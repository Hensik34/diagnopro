/**
 * ImprovedReportLayout.tsx
 * Helper components and utilities for better report layout and spacing
 * Styled to match professional pathology lab reports (SRL / Metropolis style)
 */

import React from 'react';

export const ReportLayoutConfig = {
  // Spacing system
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
  },
  
  // Margins for sections
  sectionMargin: {
    top: 10,
    bottom: 12,
    between: 14,
  },
  
  // Padding for boxes
  boxPadding: {
    dense: 7,
    normal: 10,
    spacious: 14,
  },
  
  // Font sizes (desktop)
  fontSize: {
    label: 9,
    value: 10.5,
    header: 10,
    sectionTitle: 12,
    patientName: 15,
  },
  
  // Font sizes mobile
  fontSizeMobile: {
    label: 8,
    value: 9,
    header: 9,
    sectionTitle: 11,
    patientName: 14,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.3,
    normal: 1.5,
    relaxed: 1.65,
    spacious: 1.8,
  },
  
  // Table column widths (percentages)
  tableColumns: {
    investigation: '40%',
    result: '14%',
    flag: '7%',
    refRange: '24%',
    unit: '15%',
  },
};

/**
 * PatientInfoRow - improved version with better alignment
 */
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
          fontSize: `${ReportLayoutConfig.fontSize.label}px`,
          fontWeight: 700,
          color: '#546E7A',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          margin: 0,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: `${ReportLayoutConfig.fontSize.value}px`,
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

/**
 * InvestigationTableHeader - Clean professional header with FLAG column
 * Responsive for mobile
 */
export function InvestigationTableHeader({ colorTokens }: { colorTokens: Record<string, string> }) {
  const thStyle = (width: string, align: string = 'center', extra: React.CSSProperties = {}): React.CSSProperties => ({
    textAlign: align as any,
    padding: `${ReportLayoutConfig.boxPadding.normal - 2}px 6px`,
    fontWeight: 700,
    color: colorTokens.white,
    fontSize: `${ReportLayoutConfig.fontSize.header - 1}px`,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    width,
    borderRight: `1px solid rgba(255,255,255,0.15)`,
    ...extra,
  });

  return (
    <thead>
      <tr style={{ background: colorTokens.brand }}>
        <th style={thStyle(ReportLayoutConfig.tableColumns.investigation, 'left')}>
          Investigation
        </th>
        <th style={thStyle(ReportLayoutConfig.tableColumns.result)}>
          Result
        </th>
        <th style={thStyle(ReportLayoutConfig.tableColumns.flag)}>
          Flag
        </th>
        <th style={thStyle(ReportLayoutConfig.tableColumns.refRange)}>
          Bio. Ref. Range
        </th>
        <th style={thStyle(ReportLayoutConfig.tableColumns.unit, 'center', { borderRight: 'none' })}>
          Unit
        </th>
      </tr>
    </thead>
  );
}

/**
 * InvestigationTableRow - Compact professional row matching pathology lab style
 * - No alternating colors, clean white background
 * - Abnormal values in bold with color
 * - Ref range and unit also bold when abnormal
 * - Indentation support for grouped sub-parameters
 * - Responsive for mobile
 */
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
  const cellBorder = `1px solid ${colorTokens.borderLight}`;
  const vPad = `${ReportLayoutConfig.boxPadding.dense}px`;
  const hPad = '6px';
  const fontSize = `${ReportLayoutConfig.fontSize.value}px`;

  return (
    <tr style={{ background: colorTokens.white }}>
      {/* Investigation name */}
      <td
        style={{
          padding: `${vPad} ${hPad}`,
          paddingLeft: indented ? '20px' : hPad,
          fontWeight: isAbnormal ? 700 : 400,
          color: isAbnormal ? statusColor : colorTokens.text,
          borderBottom: cellBorder,
          fontSize,
          textAlign: 'left',
          lineHeight: 1.4,
          wordBreak: 'break-word',
        }}
      >
        {investigation}
      </td>
      {/* Result value */}
      <td
        style={{
          padding: `${vPad} ${hPad}`,
          textAlign: 'center',
          fontWeight: isAbnormal ? 700 : 400,
          color: isAbnormal ? statusColor : colorTokens.text,
          fontSize,
          fontVariantNumeric: 'tabular-nums',
          borderBottom: cellBorder,
          borderLeft: cellBorder,
          whiteSpace: 'nowrap',
        }}
      >
        {result}
      </td>
      {/* Flag (H/L) */}
      <td
        style={{
          padding: `${vPad} 3px`,
          textAlign: 'center',
          borderBottom: cellBorder,
          borderLeft: cellBorder,
          whiteSpace: 'nowrap',
          fontSize: '9px',
          fontWeight: 700,
          color: statusColor,
        }}
      >
        {status === 'High' ? 'H' : status === 'Low' ? 'L' : ''}
      </td>
      {/* Reference Range */}
      <td
        style={{
          padding: `${vPad} ${hPad}`,
          textAlign: 'center',
          color: isAbnormal ? colorTokens.text : colorTokens.secondary,
          fontWeight: isAbnormal ? 700 : 400,
          borderBottom: cellBorder,
          borderLeft: cellBorder,
          fontSize,
          whiteSpace: 'nowrap',
        }}
      >
        {refRange}
      </td>
      {/* Unit */}
      <td
        style={{
          padding: `${vPad} ${hPad}`,
          textAlign: 'center',
          color: isAbnormal ? colorTokens.text : colorTokens.secondary,
          fontWeight: isAbnormal ? 700 : 400,
          borderBottom: cellBorder,
          borderLeft: cellBorder,
          fontSize,
          whiteSpace: 'nowrap',
        }}
      >
        {unit}
      </td>
    </tr>
  );
}

/**
 * SectionGroupHeader - Clean sub-group header (e.g., "Differential Leucocyte Count", "RBC Indices")
 * Plain bold text, left-aligned, no colored background – matches professional lab style
 */
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
        colSpan={5}
        style={{
          padding: `${ReportLayoutConfig.boxPadding.dense + 1}px 8px ${ReportLayoutConfig.boxPadding.dense - 1}px`,
          fontWeight: 700,
          fontSize: `${ReportLayoutConfig.fontSize.value}px`,
          color: colorTokens.text,
          borderBottom: `1px solid ${colorTokens.borderLight}`,
          letterSpacing: '0.2px',
        }}
      >
        {title}
      </td>
    </tr>
  );
}

/**
 * ImprovedPatientBox - Better structured patient information display
 * Styled as a clean bordered info table matching professional lab reports
 * Fully responsive for mobile and tablet
 */
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
  return (
    <div
      style={{
        border: `1px solid ${colorTokens.borderLight}`,
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        {/* Column 1: Patient Details */}
        <div style={{
          flex: '1.2',
          borderRight: 'none',
          borderBottom: `1px solid ${colorTokens.borderLight}`,
          padding: '10px 12px',
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: colorTokens.text }}>
            {patientName}
          </h2>
          <div style={{ fontSize: '11px', color: '#444', lineHeight: 1.6 }}>
            <div>Age : {age} Years</div>
            <div>Sex : {gender}</div>
            <div>PID : {patientId}</div>
          </div>
        </div>

        {/* Column 2: Registration ID & Ref Doctor & QR */}
        <div style={{
          flex: '1.5',
          borderRight: 'none',
          borderBottom: `1px solid ${colorTokens.borderLight}`,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          {/* Left: Registration info */}
          <div style={{ flex: 1, minWidth: '150px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: colorTokens.secondary, marginBottom: '2px' }}>
              Registration ID:
            </div>
            <div style={{ fontSize: '13px', color: colorTokens.text, marginBottom: '4px', fontWeight: 800 }}>
              {sampleId}
            </div>
            <div style={{ fontSize: '10.5px', color: colorTokens.text }}>
              Ref. By: <span style={{ fontWeight: 700 }}>{referringDoctor}</span>
            </div>
          </div>
          {/* Right: QR Code */}
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            {qrCode}
          </div>
        </div>

        {/* Column 3: Barcode & Dates */}
        <div style={{
          flex: '1.3',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}>
          <div>
            {barcode}
          </div>
          <div style={{ fontSize: '10px', color: colorTokens.text, width: '100%', lineHeight: 1.5, textAlign: 'center' }}>
            <div>
              <span style={{ fontWeight: 700 }}>Registered:</span> {reportDate}, {reportTime}
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>Collected:</span> {collectionDate}
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>Reported:</span> {reportedDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TestSectionBlock - Container for each test with proper spacing
 * Clean centered heading with underline
 * Responsive for mobile
 */
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
        marginTop: isFirstSection ? 0 : `${ReportLayoutConfig.sectionMargin.top}px`,
      }}
    >
      {/* Test section heading */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: `${ReportLayoutConfig.spacing.md}px`,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: `${ReportLayoutConfig.fontSize.sectionTitle}px`,
            fontWeight: 800,
            color: colorTokens.text,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'inline-block',
            paddingBottom: '2px',
            borderBottom: `2px solid ${colorTokens.text}`,
          }}
        >
          {testName}
        </h2>
      </div>

      {/* Table */}
      {children}
    </div>
  );
}
