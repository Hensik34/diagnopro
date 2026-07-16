export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;
export const PAGE_GAP_PX = 24;

export type Parameter = {
  name: string;
  result: string;
  unit: string;
  refRange: string;
  isAbnormal: boolean;
  status?: string;
  fieldType?: string;
  group?: string;
  isMandatory?: boolean;
  fontSize?: number;
  bold?: boolean;
};

export type TestSection = {
  id: string;
  testId?: string;
  testName: string;
  parameters: Parameter[];
  isCbc?: boolean;
  peripheralSmearText?: string | null;
};

export type TestChunk = {
  sectionId: string;
  title: string;
  continuation: boolean;
  parameters: Parameter[];
};

export type PageItem =
  | { type: 'patient' }
  | { type: 'test'; chunk: TestChunk }
  | { type: 'interpretation'; testId: string; text: string }
  | { type: 'testRemark'; testId: string; text: string }
  | { type: 'peripheralSmear'; testName: string; text: string }
  | { type: 'generalNotes'; text: string }
  | { type: 'endMarker' }
  | { type: 'signature' }
  | { type: 'marketing'; pageConfig: any };

export function estimateInterpretationHeight(text: string, dense: boolean, customFontSize?: number): number {
  const charsPerLine = dense ? 100 : 90;
  let lineHeight = dense ? 13 : 14;
  if (customFontSize) {
    lineHeight = Math.ceil(customFontSize * 1.35);
  }
  const paragraphs = text.split('\n');
  let lines = 0;
  for (const para of paragraphs) {
    // Empty lines still take up one line height
    lines += Math.max(1, Math.ceil(para.trim().length / charsPerLine));
  }
  return 24 + lines * lineHeight; // marginTop (8) + heading (14) + heading margin (2) = 24px base
}

/**
 * Splits text by newline first, then calculates wrapping per line for smear block.
 */
export function estimatePeripheralSmearHeight(text: string, dense: boolean): number {
  const charsPerLine = dense ? 95 : 85;
  const lineHeight = dense ? 14 : 16;
  const paragraphs = text.split('\n');
  let lines = 0;
  for (const para of paragraphs) {
    lines += Math.max(1, Math.ceil(para.trim().length / charsPerLine));
  }
  return 36 + lines * lineHeight;
}

export function estimateSectionHeight(section: TestSection, params: Parameter[], dense: boolean): number {
  const groupHeaderHeight = dense ? 23 : 25;
  const uniqueGroupRows = params.reduce((count, p, idx) => {
    if (!p.group) return count;
    const prev = idx > 0 ? params[idx - 1].group : undefined;
    return prev !== p.group ? count + 1 : count;
  }, 0);

  const heading = 26;       // section title with lines + margin
  const tableHeader = 24;   // header row with border
  
  let rows = 0;
  for (const p of params) {
    let size = dense ? 11.5 : 12;
    if (p.fontSize) {
      size = p.fontSize;
    }
    rows += dense ? Math.max(21, size + 9) : Math.max(23, size + 11);
  }

  const groups = uniqueGroupRows * groupHeaderHeight;
  const spacing = 28;       // bottom margin / section separation space
  return heading + tableHeader + rows + groups + spacing;
}

export function splitSection(section: TestSection, maxChunkHeight: number, dense: boolean): TestChunk[] {
  const fullHeight = estimateSectionHeight(section, section.parameters, dense);
  if (fullHeight <= maxChunkHeight) {
    return [
      {
        sectionId: section.id,
        title: section.testName,
        continuation: false,
        parameters: section.parameters,
      },
    ];
  }

  const chunks: TestChunk[] = [];
  let current: Parameter[] = [];

  for (let i = 0; i < section.parameters.length; i++) {
    const candidate = [...current, section.parameters[i]];
    const candidateHeight = estimateSectionHeight(section, candidate, dense);
    const nextParam = i + 1 < section.parameters.length ? section.parameters[i + 1] : null;
    const isGroupChanging = nextParam && candidate[candidate.length - 1].group !== nextParam.group;

    if (candidateHeight > maxChunkHeight && current.length > 0) {
      const currentGroupItems = current.filter(p => p.group === current[current.length - 1]?.group).length;
      if (isGroupChanging && currentGroupItems <= 1 && current.length < 3) {
        current = candidate;
        continue;
      }
      chunks.push({
        sectionId: section.id,
        title: section.testName,
        continuation: chunks.length > 0,
        parameters: current,
      });
      current = [section.parameters[i]];
      continue;
    }

    current = candidate;
  }

  if (current.length > 0) {
    chunks.push({
      sectionId: section.id,
      title: section.testName,
      continuation: chunks.length > 0,
      parameters: current,
    });
  }

  return chunks;
}

export interface PaginationOptions {
  orderedSections: TestSection[];
  safeZones: { top: number; bottom: number };
  hasDoctorSignature: boolean;
  density: string;
  layoutSnapshots: Record<string, any>;
  testData: any;
  clinicalNotes?: string | null;
  isSelfReport?: boolean;
  attachMarketingPages?: boolean;
  marketingPages?: any[];
}

export interface PaginationResult {
  pages: PageItem[][];
  compactAdjustment: number;
}

export function computeReportPages(options: PaginationOptions): PaginationResult {
  const {
    orderedSections,
    safeZones,
    hasDoctorSignature,
    density,
    layoutSnapshots,
    testData,
    clinicalNotes,
    isSelfReport,
    attachMarketingPages,
    marketingPages,
  } = options;

  const signatureStripHeight = hasDoctorSignature ? 84 : 76;
  const contentHeight = A4_HEIGHT_PX - safeZones.top - safeZones.bottom - signatureStripHeight;
  const isDense = density !== 'comfortable';
  const patientHeight = 75;

  const maxChunkHeight = Math.max(160, contentHeight - patientHeight - 30);
  const chunks = orderedSections.flatMap(section => splitSection(section, maxChunkHeight, isDense));

  // First pass: calculate total height including all elements to detect overflow correctly
  let totalNeeded = patientHeight;
  for (const chunk of chunks) {
    const section = orderedSections.find(s => s.id === chunk.sectionId);
    if (section) {
      totalNeeded += estimateSectionHeight(section, chunk.parameters, isDense);
      const isLastChunk = chunks.filter(c => c.sectionId === chunk.sectionId).pop() === chunk;
      if (isLastChunk && section.testId) {
        const snapshot = layoutSnapshots[section.testId];
        const sig = snapshot?.clinical_significance;
        if (sig?.trim()) {
          const customSigFontSize = snapshot?.clinicalSignificanceLayout?.fontSize;
          totalNeeded += estimateInterpretationHeight(sig.trim(), isDense, customSigFontSize);
        }
        const matchedTest = testData?.tests?.find((t: any) => (t.id || t.testId) === section.testId);
        const remark = matchedTest?.remarks || matchedTest?.notes || '';
        if (remark.trim()) {
          totalNeeded += estimateInterpretationHeight(remark.trim(), isDense);
        }
      }
      if (isLastChunk && section.isCbc && section.peripheralSmearText?.trim()) {
        totalNeeded += estimatePeripheralSmearHeight(section.peripheralSmearText.trim(), isDense);
      }
    }
  }

  if (clinicalNotes?.trim()) {
    totalNeeded += estimateInterpretationHeight(clinicalNotes.trim(), isDense);
  }

  const overflow = totalNeeded - contentHeight;
  const needsCompact = overflow > 0 && overflow <= 120;
  const compactAdjustment = needsCompact ? overflow : 0;
  const compactScale = needsCompact ? Math.max(0.82, 1 - (overflow + 20) / totalNeeded) : 1;

  const estimateHeight = (section: TestSection, params: Parameter[]) => {
    const base = estimateSectionHeight(section, params, isDense);
    return needsCompact ? Math.floor(base * compactScale) : base;
  };

  const out: PageItem[][] = [[]];
  let currentHeight = 0;

  // Margin spacing as specified in user request
  const signatureSafetyMargin = 70;
  const effectiveContentHeight = contentHeight - signatureSafetyMargin;
  const minBufferForLastItem = 10;

  const place = (item: PageItem, itemHeight: number) => {
    if (currentHeight + itemHeight + minBufferForLastItem > effectiveContentHeight && out[out.length - 1].length > 1) {
      out.push([]);
      currentHeight = patientHeight;
      out[out.length - 1].push({ type: 'patient' });
    }
    out[out.length - 1].push(item);
    currentHeight += itemHeight;
  };

  out[0].push({ type: 'patient' });
  currentHeight += patientHeight;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const section = orderedSections.find(s => s.id === chunk.sectionId);
    if (!section) continue;

    const chunkH = estimateHeight(section, chunk.parameters);

    let sigH = 0;
    const isLastChunk = chunks.filter(c => c.sectionId === chunk.sectionId).pop() === chunk;
    if (isLastChunk && section.testId) {
      const snapshot = layoutSnapshots[section.testId];
      const sig = snapshot?.clinical_significance;
      if (sig?.trim()) {
        const customSigFontSize = snapshot?.clinicalSignificanceLayout?.fontSize;
        sigH = needsCompact
          ? Math.floor(estimateInterpretationHeight(sig.trim(), isDense, customSigFontSize) * compactScale)
          : estimateInterpretationHeight(sig.trim(), isDense, customSigFontSize);
      }
    }

    let testRemarkH = 0;
    let testRemarkText = '';
    if (isLastChunk && section.testId) {
      const matchedTest = testData?.tests?.find((t: any) => (t.id || t.testId) === section.testId);
      const remark = matchedTest?.remarks || matchedTest?.notes || '';
      if (remark.trim()) {
        testRemarkText = remark.trim();
        testRemarkH = needsCompact
          ? Math.floor(estimateInterpretationHeight(testRemarkText, isDense) * compactScale)
          : estimateInterpretationHeight(testRemarkText, isDense);
      }
    }

    let trailingH = 0;
    const isLastChunkOverall = i === chunks.length - 1;
    if (isLastChunkOverall) {
      if (clinicalNotes?.trim()) {
        const notesText = clinicalNotes.trim();
        trailingH += needsCompact
          ? Math.floor(estimateInterpretationHeight(notesText, isDense) * compactScale)
          : estimateInterpretationHeight(notesText, isDense);
      }
    }

    const totalSectionHeight = chunkH + sigH + testRemarkH + trailingH;

    const currentHasContent = out[out.length - 1].some(item => item.type === 'test' || item.type === 'interpretation');
    if (currentHasContent && currentHeight + totalSectionHeight > effectiveContentHeight && totalSectionHeight <= effectiveContentHeight) {
      out.push([]);
      currentHeight = 0;
      out[out.length - 1].push({ type: 'patient' });
      currentHeight += patientHeight;
    }

    place({ type: 'test', chunk }, chunkH);

    if (sigH > 0) {
      const sectionTestId = section.testId;
      if (sectionTestId) {
        const sig = layoutSnapshots[sectionTestId]?.clinical_significance;
        if (sig?.trim()) {
          place({ type: 'interpretation', testId: sectionTestId, text: sig.trim() }, sigH);
        }
      }
    }

    if (testRemarkH > 0 && section.testId) {
      place({ type: 'testRemark', testId: section.testId, text: testRemarkText }, testRemarkH);
    }

    if (isLastChunk && section.isCbc && section.peripheralSmearText?.trim()) {
      const smearText = section.peripheralSmearText.trim();
      const smearH = needsCompact
        ? Math.floor(estimatePeripheralSmearHeight(smearText, isDense) * compactScale)
        : estimatePeripheralSmearHeight(smearText, isDense);
      
      if (out.length === 1) {
        out.push([]);
        currentHeight = 0;
        out[out.length - 1].push({ type: 'patient' });
        currentHeight += patientHeight;
      }
      place({ type: 'peripheralSmear', testName: section.testName || 'CBC', text: smearText }, smearH);
    }
  }

  if (clinicalNotes?.trim()) {
    const notesText = clinicalNotes.trim();
    const notesH = needsCompact
      ? Math.floor(estimateInterpretationHeight(notesText, isDense) * compactScale)
      : estimateInterpretationHeight(notesText, isDense);
    
    if (currentHeight + notesH + minBufferForLastItem > effectiveContentHeight && out[out.length - 1].length > 1) {
      out.push([]);
      out[out.length - 1].push({ type: 'patient' });
      currentHeight = patientHeight;
    }
    
    place({ type: 'generalNotes', text: notesText }, notesH);
  }

  const shouldAttachMarketing = isSelfReport || attachMarketingPages;
  if (shouldAttachMarketing && marketingPages && Array.isArray(marketingPages)) {
    const activeMarketingPages = marketingPages.filter((p: any) => p.active && (p.url || p.previewUrl));
    for (const mPage of activeMarketingPages) {
      out.push([{ type: 'marketing', pageConfig: mPage }]);
    }
  }

  return {
    pages: out,
    compactAdjustment,
  };
}
