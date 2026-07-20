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
  const charsPerLine = 100;
  const fontSize = customFontSize || 9.5;
  const lineHeight = Math.ceil(fontSize * 1.35); // e.g. 13px line height for 9.5px font
  const paragraphs = text.split('\n');
  let lines = 0;
  for (const para of paragraphs) {
    lines += Math.max(1, Math.ceil(para.trim().length / charsPerLine));
  }
  return 12 + lines * lineHeight; // title + spacing (12px) + lines * lineHeight
}

/**
 * Splits text by newline first, then calculates wrapping per line for smear block.
 */
export function estimatePeripheralSmearHeight(text: string, dense: boolean): number {
  const charsPerLine = 95;
  const lineHeight = 15; // 11.5px font * 1.3
  const paragraphs = text.split('\n');
  let lines = 0;
  for (const para of paragraphs) {
    lines += Math.max(1, Math.ceil(para.trim().length / charsPerLine));
  }
  return 24 + lines * lineHeight; // title + spacing (24px) + lines * lineHeight
}

export function estimateSectionHeight(section: TestSection, params: Parameter[], dense: boolean): number {
  const groupHeaderHeight = 19; // Tight constant group header height
  const uniqueGroupRows = params.reduce((count, p, idx) => {
    if (!p.group) return count;
    const prev = idx > 0 ? params[idx - 1].group : undefined;
    return prev !== p.group ? count + 1 : count;
  }, 0);

  const heading = 22;       // section title block (margin top + title + margin bottom)
  const tableHeader = 26;   // table header (th + border line spacer)
  
  let rows = 0;
  for (const p of params) {
    const size = p.fontSize || 11; // default 11px
    rows += Math.ceil(size * 1.35) + 2; // Math.ceil(size * 1.35) + 2px padding
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
  const isDense = true; // Always dense as requested (using less space by default)
  const patientHeight = 75;

  const maxChunkHeight = Math.max(160, contentHeight - patientHeight - 30);
  const chunks = orderedSections.flatMap(section => splitSection(section, maxChunkHeight, isDense));

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

    const chunkH = estimateSectionHeight(section, chunk.parameters, isDense);

    let sigH = 0;
    const isLastChunk = chunks.filter(c => c.sectionId === chunk.sectionId).pop() === chunk;
    if (isLastChunk && section.testId) {
      const snapshot = layoutSnapshots[section.testId];
      const sig = snapshot?.clinical_significance;
      if (sig?.trim()) {
        const customSigFontSize = snapshot?.clinicalSignificanceLayout?.fontSize;
        sigH = estimateInterpretationHeight(sig.trim(), isDense, customSigFontSize);
      }
    }

    let testRemarkH = 0;
    let testRemarkText = '';
    if (isLastChunk && section.testId) {
      const matchedTest = testData?.tests?.find((t: any) => (t.id || t.testId) === section.testId);
      const remark = matchedTest?.remarks || matchedTest?.notes || '';
      if (remark.trim()) {
        testRemarkText = remark.trim();
        testRemarkH = estimateInterpretationHeight(testRemarkText, isDense);
      }
    }

    let trailingH = 0;
    const isLastChunkOverall = i === chunks.length - 1;
    if (isLastChunkOverall) {
      if (clinicalNotes?.trim()) {
        const notesText = clinicalNotes.trim();
        trailingH += estimateInterpretationHeight(notesText, isDense);
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
      const smearH = estimatePeripheralSmearHeight(smearText, isDense);
      
      // Always push peripheral smear to a new page if the current page has other tests/content
      if (out[out.length - 1].some(item => item.type === 'test' || item.type === 'interpretation')) {
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
    const notesH = estimateInterpretationHeight(notesText, isDense);
    
    if (currentHeight + notesH + minBufferForLastItem > effectiveContentHeight && out[out.length - 1].length > 1) {
      out.push([]);
      out[out.length - 1].push({ type: 'patient' });
      currentHeight = patientHeight;
    }
    
    place({ type: 'generalNotes', text: notesText }, notesH);
  }

  const shouldAttachMarketing = attachMarketingPages;
  if (shouldAttachMarketing && marketingPages && Array.isArray(marketingPages)) {
    const activeMarketingPages = marketingPages.filter((p: any) => p.active && (p.url || p.previewUrl));
    for (const mPage of activeMarketingPages) {
      out.push([{ type: 'marketing', pageConfig: mPage }]);
    }
  }

  return {
    pages: out,
    compactAdjustment: 0,
  };
}

function getPermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const permutations: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const subPerms = getPermutations(remaining);
    for (const sub of subPerms) {
      permutations.push([current, ...sub]);
    }
  }
  return permutations;
}

/**
 * Optimizes the default order of test sections to minimize total report page count.
 * - CBC tests always take first place.
 * - Remaining tests are arranged/permuted to fit in the minimum possible number of pages.
 */
export function optimizeTestOrder(
  sections: TestSection[],
  options: Omit<PaginationOptions, 'orderedSections'>
): TestSection[] {
  // Separate CBC from non-CBC
  const cbcSections = sections.filter(s => !!s.isCbc);
  const otherSections = sections.filter(s => !s.isCbc);

  if (otherSections.length <= 1) {
    return [...cbcSections, ...otherSections];
  }

  // To prevent performance lag on large sets, only permute if otherSections.length <= 5
  if (otherSections.length > 5) {
    // Fallback: sort other sections by height descending to pack larger items first
    const sortedOthers = [...otherSections].sort((a, b) => {
      const hA = estimateSectionHeight(a, a.parameters, true);
      const hB = estimateSectionHeight(b, b.parameters, true);
      return hB - hA;
    });
    return [...cbcSections, ...sortedOthers];
  }

  const permutations = getPermutations(otherSections);
  let bestOrder = [...cbcSections, ...otherSections];
  let minPages = Infinity;

  for (const perm of permutations) {
    const candidateOrder = [...cbcSections, ...perm];
    const result = computeReportPages({
      ...options,
      orderedSections: candidateOrder,
    });

    if (result.pages.length < minPages) {
      minPages = result.pages.length;
      bestOrder = candidateOrder;
    }
  }

  return bestOrder;
}

