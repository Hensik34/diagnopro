/**
 * ImprovedReportLayout.tsx
 * Helper components and utilities for better report layout and spacing
 * Styled to match professional pathology lab reports (SRL / Metropolis style)
 */

import React from 'react';

export const ReportLayoutConfig = {
  // Spacing system
  spacing: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 6,
    xxl: 8,
  },

  // Margins for sections
  sectionMargin: {
    top: 2,
    bottom: 2,
    between: 4,
  },

  // Padding for boxes
  boxPadding: {
    dense: 2,
    normal: 3,
    spacious: 5,
  },

  // Font sizes (desktop)
  fontSize: {
    label: 8.5,
    value: 9.5,
    header: 9,
    sectionTitle: 10.5,
    patientName: 13,
  },

  // Font sizes mobile
  fontSizeMobile: {
    label: 8,
    value: 9,
    header: 9,
    sectionTitle: 10,
    patientName: 12,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.35,
    relaxed: 1.45,
    spacious: 1.55,
  },

  // Table column widths (percentages)
  tableColumns: {
    investigation: '36%',
    result: '17%',
    refRange: '30%',
    unit: '17%',
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
    padding: `${ReportLayoutConfig.boxPadding.dense}px 2px`,
    fontWeight: 700,
    color: colorTokens.white,
    fontSize: `${ReportLayoutConfig.fontSize.header - 1}px`,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    width,
    ...extra,
  });

  return (
    <thead>
      <tr style={{ background: colorTokens.brand }}>
        <th style={thStyle(ReportLayoutConfig.tableColumns.investigation, 'left')}>
          Investigation
        </th>
        <th style={thStyle(ReportLayoutConfig.tableColumns.result, 'left')}>
          Result
        </th>
        <th style={thStyle(ReportLayoutConfig.tableColumns.refRange, 'left')}>
          Reference Value
        </th>
        <th style={thStyle(ReportLayoutConfig.tableColumns.unit, 'center')}>
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
  const vPad = `${ReportLayoutConfig.boxPadding.dense}px`;
  const fontSize = `${ReportLayoutConfig.fontSize.value}px`;

  return (
    <tr style={{ background: colorTokens.white }}>
      {/* Investigation name */}
      <td
        style={{
          padding: `${vPad} 1px`,
          paddingLeft: indented ? '16px' : '2px',
          fontWeight: isAbnormal ? 700 : 400,
          color: isAbnormal ? statusColor : colorTokens.text,
          fontSize,
          textAlign: 'left',
          lineHeight: 1.25,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {investigation}
      </td>
      {/* Result value with inline flag */}
      <td
        style={{
          padding: `${vPad} 1px`,
          paddingLeft: '2px',
          textAlign: 'left',
          fontWeight: isAbnormal ? 700 : 400,
          color: isAbnormal ? statusColor : colorTokens.text,
          fontSize,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {result} {status === 'High' ? <span style={{ color: statusColor, fontWeight: 700, marginLeft: '4px' }}>High</span> : status === 'Low' ? <span style={{ color: statusColor, fontWeight: 700, marginLeft: '4px' }}>Low</span> : status === 'Critical' ? <span style={{ color: statusColor, fontWeight: 800, marginLeft: '4px', textTransform: 'uppercase' }}>*Critical*</span> : ''}
      </td>
      {/* Reference Value */}
      <td
        style={{
          padding: `${vPad} 1px`,
          paddingLeft: '2px',
          textAlign: 'left',
          color: isAbnormal ? colorTokens.text : colorTokens.secondary,
          fontWeight: isAbnormal ? 700 : 400,
          fontSize,
          whiteSpace: 'nowrap',
        }}
      >
        {refRange}
      </td>
      {/* Unit */}
      <td
        style={{
          padding: `${vPad} 1px`,
          paddingLeft: '2px',
          textAlign: 'center',
          color: isAbnormal ? colorTokens.text : colorTokens.secondary,
          fontWeight: isAbnormal ? 700 : 400,
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
        colSpan={4}
        style={{
          padding: `5px 4px 3px`,
          fontWeight: 700,
          fontSize: `${ReportLayoutConfig.fontSize.value - 0.2}px`,
          color: colorTokens.text,
          letterSpacing: '0.2px',
          backgroundColor: '#FAFAFA',
          borderTop: '1px solid #E0E0E0',
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
          alignItems: 'stretch',
        }}
      >
        {/* Column 1: Patient Details */}
        <div style={{
          flex: '1.2',
          padding: '4px 8px',
          borderRight: `1px solid ${colorTokens.borderLight}`,
        }}>
          <h2 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 1px 0', color: colorTokens.text }}>
            {patientName}
          </h2>
          <div style={{ fontSize: '9.5px', color: '#444', lineHeight: 1.35 }}>
            <div>Age : {age}</div>
            <div>Sex : {gender}</div>
            <div>PID : {patientId}</div>
          </div>
        </div>

        {/* Column 2: Registration ID & Ref Doctor & QR */}
        <div style={{
          flex: '1.5',
          padding: '4px 8px',
          borderRight: `1px solid ${colorTokens.borderLight}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '4px',
        }}>
          {/* Left: Registration info */}
          <div style={{ flex: 1, minWidth: '130px' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 600, color: colorTokens.secondary, marginBottom: '1px' }}>
              Registration ID:
            </div>
            <div style={{ fontSize: '12px', color: colorTokens.text, marginBottom: '1px', fontWeight: 800 }}>
              {sampleId}
            </div>
            <div style={{ fontSize: '9.5px', color: colorTokens.text }}>
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
          padding: '4px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
        }}>
          <div>
            {barcode}
          </div>
          <div style={{ fontSize: '8.5px', color: colorTokens.text, width: '100%', lineHeight: 1.3, textAlign: 'center' }}>
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
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '6px',
          width: '100%',
          pageBreakAfter: 'avoid',
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
            paddingBottom: '2px',
            borderBottom: `2px solid ${colorTokens.text}`,
            pageBreakAfter: 'avoid',
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
