import React from 'react';

export const ReportLayoutConfig = {
  spacing: {
    xs: 2,
    sm: 3,
    md: 5,
    lg: 8,
    xl: 10,
    xxl: 14,
  },
  sectionMargin: {
    top: 10,
    bottom: 2,
    between: 16,
  },
  boxPadding: {
    dense: 3,
    normal: 5,
    spacious: 8,
  },
  fontSize: {
    label: 10,
    value: 12,
    header: 13,
    sectionTitle: 14,
    patientName: 14,
  },
  lineHeight: {
    tight: 1.3,
    normal: 1.45,
    relaxed: 1.55,
  },
  tableColumns: {
    investigation: '30%',
    result: '18%',
    refRange: '22%',
    unit: '12%',
    extra: '10%',
  },
};

/* ------------------------------------------------------------------ */
/*  Patient Info Row                                                   */
/* ------------------------------------------------------------------ */

export function PatientInfoRow({
  label,
  value,
  bold = false,
  flex = 1,
}: {
  label: string;
  value: string | React.ReactNode;
  bold?: boolean;
  flex?: number;
}) {
  return (
    <div style={{ flex, display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <div
        style={{
          fontSize: '9px',
          fontWeight: 700,
          color: '#78909C',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          margin: 0,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '10.5px',
          fontWeight: bold ? 700 : 500,
          color: '#212121',
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table Header - Clean underline, no colored background             */
/* ------------------------------------------------------------------ */

export function InvestigationTableHeader({ colorTokens }: { colorTokens: Record<string, string> }) {
  const thStyle = (width: string, align: string = 'left'): React.CSSProperties => ({
    textAlign: align as any,
    padding: '4px 0',
    fontWeight: 700,
    color: '#111',
    fontSize: `${ReportLayoutConfig.fontSize.header}px`,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    width,
  });

  return (
    <thead>
      <tr>
        <th style={thStyle(ReportLayoutConfig.tableColumns.investigation, 'left')}>
          Investigation
        </th>
        <th style={thStyle(ReportLayoutConfig.tableColumns.result, 'left')}>
          Result
        </th>
        <th style={thStyle(ReportLayoutConfig.tableColumns.unit, 'left')}>
          Unit
        </th>
        <th style={thStyle(ReportLayoutConfig.tableColumns.refRange, 'left')}>
          Reference Value
        </th>
        <th style={thStyle(ReportLayoutConfig.tableColumns.extra, 'left')}>
          {/* Spacer */}
        </th>
      </tr>
      <tr>
        <td
          colSpan={5}
          style={{
            padding: '2px 0 4px 0',
            border: 'none',
            lineHeight: 0,
            fontSize: 0,
          }}
        >
          <div style={{ height: '1.5px', backgroundColor: '#333', width: '100%' }} />
        </td>
      </tr>
    </thead>
  );
}

/* ------------------------------------------------------------------ */
/*  Table Row - Plain, no borders, no alternating bg                  */
/* ------------------------------------------------------------------ */

export function InvestigationTableRow({
  investigation,
  result,
  status,
  refRange,
  unit,
  isAbnormal = false,
  statusColor = '#212121',
  rowIndex = 0,
  indented = false,
  colorTokens,
  compact = false,
  customFontSize,
  customBold,
}: {
  investigation: string;
  result: string;
  status?: string;
  refRange: string;
  unit: string;
  isAbnormal?: boolean;
  statusColor?: string;
  rowIndex?: number;
  indented?: boolean;
  colorTokens: Record<string, string>;
  compact?: boolean;
  customFontSize?: number;
  customBold?: boolean;
}) {
  const fontSize = customFontSize ? `${customFontSize}px` : (compact ? `${ReportLayoutConfig.fontSize.value - 0.5}px` : `${ReportLayoutConfig.fontSize.value}px`);
  const vPad = compact ? '1px' : '0.5px';
  const fontWeight = customBold !== undefined ? (customBold ? 700 : 400) : (isAbnormal ? 700 : 400);
  const resultFontWeight = customBold !== undefined ? (customBold ? 800 : 400) : (isAbnormal ? 800 : 400);

  return (
    <tr>
      <td
        style={{
          paddingTop: vPad,
          paddingBottom: vPad,
          paddingLeft: indented ? '14px' : '0',
          paddingRight: '6px',
          fontWeight,
          color: isAbnormal ? statusColor : '#222',
          fontSize,
          textAlign: 'left',
          verticalAlign: 'baseline',   // was 'middle' — middle pushes descenders into the clip
          lineHeight: 1.6,             // was 1.5 — more room below baseline for g/y/j
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          overflow: 'visible',         // was 'hidden' — let descenders render
          textOverflow: 'clip',        // ellipsis needs overflow:hidden; with fixed table it rarely truncates anyway
        }}
      >
        {investigation}
      </td>

      <td
        style={{
          paddingTop: vPad,
          paddingBottom: vPad,
          paddingLeft: 0,
          paddingRight: 0,
          textAlign: 'left',
          fontWeight: resultFontWeight,
          color: isAbnormal ? statusColor : '#222',
          fontSize,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        }}
      >
        {result}
        {status === 'High' && (
          <span style={{ color: statusColor, fontWeight: 700, marginLeft: '4px', fontSize: '9px' }}>H</span>
        )}
        {status === 'Low' && (
          <span style={{ color: statusColor, fontWeight: 700, marginLeft: '4px', fontSize: '9px' }}>L</span>
        )}
        {status === 'Critical' && (
          <span style={{ color: statusColor, fontWeight: 800, marginLeft: '4px', fontSize: '9px' }}>C*</span>
        )}
      </td>
      <td
        style={{
          paddingTop: vPad,
          paddingBottom: vPad,
          paddingLeft: 0,
          paddingRight: 0,
          textAlign: 'left',
          color: '#555',
          fontWeight: customBold !== undefined ? (customBold ? 700 : 400) : 400,
          fontSize,
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        }}
      >
        {unit}
      </td>
      <td
        style={{
          paddingTop: vPad,
          paddingBottom: vPad,
          paddingLeft: 0,
          paddingRight: 0,
          textAlign: 'left',
          color: '#555',
          fontWeight: customBold !== undefined ? (customBold ? 700 : 400) : 400,
          fontSize,
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        }}
      >
        {refRange}
      </td>
      <td
        style={{
          paddingTop: vPad,
          paddingBottom: vPad,
          width: ReportLayoutConfig.tableColumns.extra,
        }}
      />
    </tr>
  );
}


/* ------------------------------------------------------------------ */
/*  Section Group Header                                               */
/* ------------------------------------------------------------------ */

export function SectionGroupHeader({
  title,
  colorTokens,
  compact = false,
}: {
  title: string;
  colorTokens: Record<string, string>;
  compact?: boolean;
}) {
  return (
    <tr>
      <td
        colSpan={5}
        style={{
          paddingTop: compact ? '1px' : '2px',
          paddingBottom: compact ? '1px' : '2px',
          paddingLeft: 0,
          paddingRight: 0,
          fontWeight: 800,
          fontSize: '11.5px',
          color: '#222',
          letterSpacing: '0.2px',
        }}
      >
        {title}
      </td>
    </tr>
  );
}


/* ------------------------------------------------------------------ */
/*  Patient Box - Bordered box with 3-column layout (KEPT + IMPROVED) */
/* ------------------------------------------------------------------ */

export function ImprovedPatientBox({
  patientName,
  age,
  gender,
  patientId,
  sampleId,
  referringDoctor,
  reportDate,
  reportTime,
  collectionDate,
  reportedDate,
  collectionAddress,
  qrCode,
  barcode,
  colorTokens,
}: {
  patientName: string;
  age: number;
  gender: string;
  patientId: string;
  sampleId: string;
  referringDoctor: string;
  reportDate: string;
  reportTime: string;
  collectionDate: string;
  reportedDate: string;
  collectionAddress: string;
  qrCode: React.ReactNode;
  barcode: React.ReactNode;
  colorTokens: Record<string, string>;
}) {
  const labelStyle: React.CSSProperties = {
    fontSize: '8px',
    fontWeight: 700,
    color: '#607D8B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    lineHeight: 1.1,
  };
  const valStyle: React.CSSProperties = {
    fontSize: '9.5px',
    fontWeight: 600,
    color: '#1A1A1A',
    lineHeight: 1.3,
  };
  const cellDivider: React.CSSProperties = {
    borderRight: `1px solid ${colorTokens.borderLight}`,
  };

  return (
    <div
      style={{
        border: `1px solid ${colorTokens.borderLight}`,
        borderRadius: '5px',
        overflow: 'hidden',
        marginBottom: '6px',
        backgroundColor: '#F8F9FA', // Subtle premium background
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Col 1: Patient identity */}
        <div style={{ flex: 1.15, padding: '4px 8px', ...cellDivider, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 800,
              color: '#0D47A1', // Accent brand color for patient name
              lineHeight: 1.15,
              marginBottom: '2px',
              textTransform: 'capitalize', // Autocapitalize names
            }}
          >
            {patientName}
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ ...labelStyle, padding: '0.5px 0', width: '36px' }}>Age</td>
                <td style={{ ...valStyle, padding: '0.5px 0' }}>: {age}</td>
              </tr>
              <tr>
                <td style={{ ...labelStyle, padding: '0.5px 0' }}>Sex</td>
                <td style={{ ...valStyle, padding: '0.5px 0', textTransform: 'capitalize' }}>: {gender}</td>
              </tr>
              <tr>
                <td style={{ ...labelStyle, padding: '0.5px 0' }}>PID</td>
                <td style={{ ...valStyle, padding: '0.5px 0', fontSize: '9px', color: '#555' }}>: {patientId}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Col 2: Registration + Ref Doctor + QR */}
        <div
          style={{
            flex: 1.45,
            padding: '4px 8px',
            ...cellDivider,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <div>
              <div style={labelStyle}>Registration ID</div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#1A1A1A',
                  margin: '0px 0 1px',
                  letterSpacing: '0.2px',
                }}
              >
                {sampleId}
              </div>
            </div>
            <div style={{ marginTop: '1px' }}>
              <div style={labelStyle}>Ref. By</div>
              <div style={{ ...valStyle, color: '#0D47A1', fontWeight: 700, fontSize: '10.5px', textTransform: 'capitalize' }}>
                {referringDoctor}
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0, padding: '1px', backgroundColor: '#ffffff', border: `1px solid ${colorTokens.borderLight}`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {qrCode}
          </div>
        </div>

        {/* Col 3: Barcode + Dates */}
        <div
          style={{
            flex: 1.25,
            padding: '4px 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
          }}
        >
          <div style={{ padding: '1px 2px', backgroundColor: '#ffffff', borderRadius: '3px', border: `1px solid ${colorTokens.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {barcode}
          </div>
          <div
            style={{
              fontSize: '8px',
              color: '#455A64',
              width: '100%',
              lineHeight: 1.3,
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontWeight: 700, color: '#607D8B' }}>Reg:</span> {reportDate},{' '}
              {reportTime}
            </div>
            <div>
              <span style={{ fontWeight: 700, color: '#607D8B' }}>Coll:</span> {collectionDate}
            </div>
            <div>
              <span style={{ fontWeight: 700, color: '#607D8B' }}>Rep:</span> {reportedDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Test Section Block - Improved heading with left-aligned style     */
/*  Thin line spans full width, title sits on top                     */
/* ------------------------------------------------------------------ */

export function TestSectionBlock({
  testName,
  children,
  colorTokens,
  isFirstSection = false,
}: {
  testName: string;
  children: React.ReactNode;
  colorTokens: Record<string, string>;
  isFirstSection?: boolean;
}) {
  return (
    <div
      style={{
        marginBottom: `${ReportLayoutConfig.sectionMargin.between}px`,
        marginTop: isFirstSection ? 0 : `${ReportLayoutConfig.sectionMargin.top + 2}px`,
      }}
    >
      {/* Full-width thin line with title overlaid center */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          marginBottom: '4px',
          pageBreakAfter: 'avoid',
        }}
      >
        {/* Left line */}
        <div style={{ flex: 1, height: '1px', background: '#BDBDBD' }} />
        {/* Title */}
        <span
          style={{
            padding: '0 10px',
            fontSize: `${ReportLayoutConfig.fontSize.sectionTitle}px`,
            fontWeight: 800,
            color: '#111',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
          }}
        >
          {testName}
        </span>
        {/* Right line */}
        <div style={{ flex: 1, height: '1px', background: '#BDBDBD' }} />
      </div>

      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Formatted Clinical Significance Component                         */
/* ------------------------------------------------------------------ */

interface TableBlock {
  type: 'table';
  rows: string[][];
}
interface TextBlock {
  type: 'text';
  content: string;
}
type Block = TableBlock | TextBlock;

function parseLineToColumns(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Check if it's a markdown table row (starts/ends with |)
  if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
    const cells = trimmed.split('|').map(c => c.trim());
    return cells.slice(1, -1);
  }

  // Check if it contains a tab or multiple spaces
  const hasTab = line.includes('\t');
  const hasMultipleSpaces = /\s{3,}/.test(line); // 3 or more spaces
  if (hasTab || hasMultipleSpaces) {
    const cols = line.split(/\t|\s{2,}/).map(c => c.trim()).filter(c => c !== '');
    if (cols.length >= 2) {
      return cols;
    }
  }

  return null;
}

export function parseClinicalSignificanceToBlocks(text: string): Block[] {
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let currentTableRows: string[][] = [];

  const flushTable = () => {
    if (currentTableRows.length > 0) {
      blocks.push({ type: 'table', rows: [...currentTableRows] });
      currentTableRows = [];
    }
  };

  for (const line of lines) {
    const cols = parseLineToColumns(line);
    if (cols) {
      // Check if it's a markdown separator row (e.g. ---)
      const isSeparator = cols.every(c => /^[:\-\s]+$/.test(c));
      if (isSeparator) {
        continue;
      }
      currentTableRows.push(cols);
    } else {
      flushTable();
      blocks.push({ type: 'text', content: line });
    }
  }
  flushTable();

  return blocks;
}

export function FormattedClinicalSignificance({
  text,
  fontSize = '9.5px',
  bold = false,
}: {
  text: string;
  fontSize?: string | number;
  bold?: boolean;
}) {
  if (!text) return null;
  const blocks = parseClinicalSignificanceToBlocks(text);
  const sigFontSize = typeof fontSize === 'number' ? `${fontSize}px` : fontSize;
  const sigFontWeight = bold ? 700 : 400;

  return (
    <div style={{ fontSize: sigFontSize, fontWeight: sigFontWeight, margin: 0 }}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'table') {
          return (
            <div key={bIdx} style={{ overflowX: 'auto', margin: '8px 0', pageBreakInside: 'avoid' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'inherit',
                lineHeight: 1.4,
              }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #111' }}>
                    {block.rows[0].map((col, cIdx) => (
                      <th
                        key={cIdx}
                        style={{
                          padding: '4px 6px',
                          fontWeight: 700,
                          textAlign: cIdx === 0 ? 'left' : 'center',
                          whiteSpace: 'nowrap',
                          border: 'none',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.slice(1).map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom: rIdx === block.rows.length - 2 ? 'none' : '1px solid #e0e0e0'
                      }}
                    >
                      {row.map((col, cIdx) => (
                        <td
                          key={cIdx}
                          style={{
                            padding: '4.5px 6px',
                            textAlign: cIdx === 0 ? 'left' : 'center',
                            whiteSpace: cIdx === 0 ? 'normal' : 'nowrap',
                            border: 'none',
                          }}
                        >
                          {col}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        } else {
          return (
            <div
              key={bIdx}
              style={{
                minHeight: '1em',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.45,
                margin: '2px 0',
              }}
            >
              {block.content}
            </div>
          );
        }
      })}
    </div>
  );
}
