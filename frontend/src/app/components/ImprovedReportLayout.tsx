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
    top: 4,
    bottom: 2,
    between: 6,
  },
  boxPadding: {
    dense: 3,
    normal: 5,
    spacious: 8,
  },
  fontSize: {
    label: 10,
    value: 11,
    header: 10,
    sectionTitle: 12,
    patientName: 14,
  },
  lineHeight: {
    tight: 1.3,
    normal: 1.45,
    relaxed: 1.55,
  },
  tableColumns: {
    investigation: '42%',
    result: '16%',
    refRange: '26%',
    unit: '16%',
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
    fontSize: '10px',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    width,
    borderBottom: '1.5px solid #333',
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
        <th style={thStyle(ReportLayoutConfig.tableColumns.refRange, 'left')}>
          Reference Value
        </th>
        <th style={thStyle(ReportLayoutConfig.tableColumns.unit, 'left')}>
          Unit
        </th>
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
}) {
  const fontSize = '11px';

  return (
    <tr>
      <td
        style={{
          padding: '3px 0',
          paddingLeft: indented ? '14px' : '0',
          fontWeight: isAbnormal ? 700 : 400,
          color: isAbnormal ? statusColor : '#222',
          fontSize,
          textAlign: 'left',
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 0,
        }}
      >
        {investigation}
      </td>
      <td
        style={{
          padding: '3px 0',
          textAlign: 'left',
          fontWeight: isAbnormal ? 800 : 400,
          color: isAbnormal ? statusColor : '#222',
          fontSize,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
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
          padding: '3px 0',
          textAlign: 'left',
          color: '#555',
          fontWeight: 400,
          fontSize: '10.5px',
          whiteSpace: 'nowrap',
        }}
      >
        {refRange}
      </td>
      <td
        style={{
          padding: '3px 0',
          textAlign: 'left',
          color: '#555',
          fontWeight: 400,
          fontSize: '10.5px',
          whiteSpace: 'nowrap',
        }}
      >
        {unit}
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Group Header                                               */
/* ------------------------------------------------------------------ */

export function SectionGroupHeader({
  title,
  colorTokens,
}: {
  title: string;
  colorTokens: Record<string, string>;
}) {
  return (
    <tr>
      <td
        colSpan={4}
        style={{
          padding: '5px 0 2px',
          fontWeight: 700,
          fontSize: '10.5px',
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
    fontSize: '9px',
    fontWeight: 700,
    color: '#78909C',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    lineHeight: 1,
  };
  const valStyle: React.CSSProperties = {
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#212121',
    lineHeight: 1.35,
  };
  const cellDivider: React.CSSProperties = {
    borderRight: `1px solid ${colorTokens.borderLight}`,
  };

  return (
    <div
      style={{
        border: `1.5px solid ${colorTokens.borderLight}`,
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Col 1: Patient identity */}
        <div style={{ flex: 1.1, padding: '5px 8px', ...cellDivider }}>
          <div
            style={{
              fontSize: '13.5px',
              fontWeight: 800,
              color: '#111',
              lineHeight: 1.15,
              marginBottom: '3px',
            }}
          >
            {patientName}
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ ...labelStyle, padding: '1px 0', width: '32px' }}>Age</td>
                <td style={{ ...valStyle, padding: '1px 0' }}>: {age}</td>
              </tr>
              <tr>
                <td style={{ ...labelStyle, padding: '1px 0' }}>Sex</td>
                <td style={{ ...valStyle, padding: '1px 0' }}>: {gender}</td>
              </tr>
              <tr>
                <td style={{ ...labelStyle, padding: '1px 0' }}>PID</td>
                <td style={{ ...valStyle, padding: '1px 0', fontSize: '9.5px' }}>: {patientId}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Col 2: Registration + Ref Doctor + QR */}
        <div
          style={{
            flex: 1.5,
            padding: '5px 8px',
            ...cellDivider,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={labelStyle}>Registration ID</div>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: '#111',
                margin: '2px 0',
                letterSpacing: '0.3px',
              }}
            >
              {sampleId}
            </div>
            <div style={{ fontSize: '10px', color: '#333', lineHeight: 1.4 }}>
              <span style={{ ...labelStyle, textTransform: 'none', fontSize: '9px' }}>Ref. By: </span>
              <span style={{ fontWeight: 700, fontSize: '10.5px' }}>{referringDoctor}</span>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>{qrCode}</div>
        </div>

        {/* Col 3: Barcode + Dates */}
        <div
          style={{
            flex: 1.2,
            padding: '5px 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
          }}
        >
          <div>{barcode}</div>
          <div
            style={{
              fontSize: '8.5px',
              color: '#333',
              width: '100%',
              lineHeight: 1.4,
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontWeight: 700, color: '#78909C' }}>Registered:</span> {reportDate},{' '}
              {reportTime}
            </div>
            <div>
              <span style={{ fontWeight: 700, color: '#78909C' }}>Collected:</span> {collectionDate}
            </div>
            <div>
              <span style={{ fontWeight: 700, color: '#78909C' }}>Reported:</span> {reportedDate}
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
