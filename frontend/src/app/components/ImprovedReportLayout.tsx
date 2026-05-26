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
  
  // Font sizes
  fontSize: {
    label: 9,
    value: 11,
    header: 10.5,
    sectionTitle: 12.5,
    patientName: 15,
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
 */
export function InvestigationTableHeader({ colorTokens }: { colorTokens: Record<string, string> }) {
  const thStyle = (width: string, align: string = 'center', extra: React.CSSProperties = {}): React.CSSProperties => ({
    textAlign: align as any,
    padding: `${ReportLayoutConfig.boxPadding.dense}px 2px`,
    fontWeight: 700,
    color: colorTokens.white,
    fontSize: `${ReportLayoutConfig.fontSize.header}px`,
    letterSpacing: '0.5px',
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
  const cellBorder = 'none';
  const vPad = `${ReportLayoutConfig.boxPadding.dense}px`;
  const leftPad = '4px';
  const rightPad = '2px';
  const fontSize = `${ReportLayoutConfig.fontSize.value}px`;

  return (
    <tr style={{ background: colorTokens.white }}>
      {/* Investigation name */}
      <td
        style={{
          padding: `${vPad} 1px`,
          paddingLeft: indented ? '24px' : '2px',
          fontWeight: isAbnormal ? 700 : 400,
          color: isAbnormal ? statusColor : colorTokens.text,
          fontSize,
          textAlign: 'left',
          lineHeight: 1.4,
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
        {result} {status === 'High' ? <span style={{ color: statusColor, fontWeight: 700, marginLeft: '4px' }}>High</span> : status === 'Low' ? <span style={{ color: statusColor, fontWeight: 700, marginLeft: '4px' }}>Low</span> : ''}
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
          padding: `${ReportLayoutConfig.boxPadding.dense + 1}px 8px ${ReportLayoutConfig.boxPadding.dense - 1}px`,
          fontWeight: 700,
          fontSize: `${ReportLayoutConfig.fontSize.value}px`,
          color: colorTokens.text,
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
          borderRight: `1px solid ${colorTokens.borderLight}`,
          padding: '12px 14px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px 0', color: colorTokens.text }}>
            {patientName}
          </h2>
          <div style={{ fontSize: '12px', color: '#444', lineHeight: 1.7 }}>
            <div>Age : {age} Years</div>
            <div>Sex : {gender}</div>
            <div>PID : {patientId}</div>
          </div>
        </div>

        {/* Column 2: Registration ID & Ref Doctor & QR */}
        <div style={{
          flex: '1.5',
          borderRight: `1px solid ${colorTokens.borderLight}`,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', width: '100%' }}>
            {/* Left: Registration info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: colorTokens.secondary, marginBottom: '2px' }}>
                Registration ID:
              </div>
              <div style={{ fontSize: '14px', color: colorTokens.text, marginBottom: '6px', fontWeight: 800 }}>
                {sampleId}
              </div>
              <div style={{ fontSize: '12px', color: colorTokens.text }}>
                Ref. By: <span style={{ fontWeight: 700 }}>{referringDoctor}</span>
              </div>
            </div>
            {/* Right: QR Code */}
            <div style={{ flexShrink: 0 }}>
              {qrCode}
            </div>
          </div>
        </div>

        {/* Column 3: Barcode & Dates */}
        <div style={{
          flex: '1.3',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ marginBottom: '6px' }}>
            {barcode}
          </div>
          <div style={{ fontSize: '10.5px', color: colorTokens.text, width: '100%', lineHeight: 1.5 }}>
            <div>
              <span style={{ fontWeight: 700 }}>Registered on:</span> {reportDate}, {reportTime}
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>Collected on:</span> {collectionDate}
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>Reported on:</span> {reportedDate}
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
        marginBottom: `${ReportLayoutConfig.sectionMargin.between - 4}px`,
        marginTop: isFirstSection ? 0 : `${ReportLayoutConfig.sectionMargin.top - 4}px`,
      }}
    >
      {/* Test section heading */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: `${ReportLayoutConfig.spacing.sm}px`,
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
            borderBottom: `1px solid ${colorTokens.text}`,
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
