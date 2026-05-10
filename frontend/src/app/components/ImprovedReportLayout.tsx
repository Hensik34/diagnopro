/**
 * ImprovedReportLayout.tsx
 * Helper components and utilities for better report layout and spacing
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
    top: 14,
    bottom: 16,
    between: 18,
  },
  
  // Padding for boxes
  boxPadding: {
    dense: 10,
    normal: 12,
    spacious: 16,
  },
  
  // Font sizes
  fontSize: {
    label: 9,
    value: 10,
    header: 10.5,
    sectionTitle: 13,
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
    investigation: '38%',
    result: '16%',
    status: '7%',
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
 * InvestigationTableHeader - Properly styled table header
 */
export function InvestigationTableHeader({ colorTokens }: { colorTokens: Record<string, string> }) {
  return (
    <thead>
      <tr style={{ background: colorTokens.brand }}>
        <th
          style={{
            textAlign: 'left',
            padding: `${ReportLayoutConfig.boxPadding.normal}px 10px`,
            fontWeight: 700,
            color: colorTokens.white,
            fontSize: `${ReportLayoutConfig.fontSize.header}px`,
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            width: ReportLayoutConfig.tableColumns.investigation,
            borderRight: `1px solid rgba(255,255,255,0.2)`,
          }}
        >
          Investigation
        </th>
        <th
          style={{
            textAlign: 'center',
            padding: `${ReportLayoutConfig.boxPadding.normal}px 10px`,
            fontWeight: 700,
            color: colorTokens.white,
            fontSize: `${ReportLayoutConfig.fontSize.header}px`,
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            width: ReportLayoutConfig.tableColumns.result,
            borderRight: `1px solid rgba(255,255,255,0.2)`,
          }}
        >
          Result
        </th>
        <th
          style={{
            textAlign: 'center',
            padding: `${ReportLayoutConfig.boxPadding.normal}px 4px`,
            fontWeight: 700,
            color: colorTokens.white,
            fontSize: `${ReportLayoutConfig.fontSize.header}px`,
            width: ReportLayoutConfig.tableColumns.status,
            borderRight: `1px solid rgba(255,255,255,0.2)`,
          }}
        >
          {/* Status column - no header */}
        </th>
        <th
          style={{
            textAlign: 'center',
            padding: `${ReportLayoutConfig.boxPadding.normal}px 10px`,
            fontWeight: 700,
            color: colorTokens.white,
            fontSize: `${ReportLayoutConfig.fontSize.header}px`,
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            width: ReportLayoutConfig.tableColumns.refRange,
            borderRight: `1px solid rgba(255,255,255,0.2)`,
          }}
        >
          Reference Value
        </th>
        <th
          style={{
            textAlign: 'center',
            padding: `${ReportLayoutConfig.boxPadding.normal}px 10px`,
            fontWeight: 700,
            color: colorTokens.white,
            fontSize: `${ReportLayoutConfig.fontSize.header}px`,
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            width: ReportLayoutConfig.tableColumns.unit,
          }}
        >
          Unit
        </th>
      </tr>
    </thead>
  );
}

/**
 * InvestigationTableRow - Properly styled table row with improved spacing
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
  colorTokens: Record<string, string>;
}) {
  const rowBg = isAbnormal
    ? statusColor === colorTokens.high
      ? 'rgba(198,40,40,0.04)'
      : 'rgba(21,101,192,0.04)'
    : rowIndex % 2 === 0
    ? colorTokens.white
    : colorTokens.tableStripe;

  return (
    <tr style={{ background: rowBg }}>
      <td
        style={{
          padding: `${ReportLayoutConfig.boxPadding.dense}px 10px`,
          fontWeight: 500,
          color: colorTokens.text,
          borderBottom: `1px solid ${colorTokens.borderLight}`,
          fontSize: `${ReportLayoutConfig.fontSize.value}px`,
          textAlign: 'left',
        }}
      >
        {investigation}
      </td>
      <td
        style={{
          padding: `${ReportLayoutConfig.boxPadding.dense}px 10px`,
          textAlign: 'center',
          fontWeight: isAbnormal ? 700 : 500,
          color: statusColor,
          fontSize: `${ReportLayoutConfig.fontSize.value}px`,
          fontVariantNumeric: 'tabular-nums',
          borderBottom: `1px solid ${colorTokens.borderLight}`,
          borderLeft: `1px solid ${colorTokens.borderLight}`,
          whiteSpace: 'nowrap',
        }}
      >
        {result}
      </td>
      <td
        style={{
          padding: `${ReportLayoutConfig.boxPadding.dense}px 4px`,
          textAlign: 'center',
          borderBottom: `1px solid ${colorTokens.borderLight}`,
          borderLeft: `1px solid ${colorTokens.borderLight}`,
          whiteSpace: 'nowrap',
          fontSize: '8px',
          fontWeight: 700,
          color: statusColor,
        }}
      >
        {status}
      </td>
      <td
        style={{
          padding: `${ReportLayoutConfig.boxPadding.dense}px 10px`,
          textAlign: 'center',
          color: colorTokens.secondary,
          borderBottom: `1px solid ${colorTokens.borderLight}`,
          borderLeft: `1px solid ${colorTokens.borderLight}`,
          fontSize: `${ReportLayoutConfig.fontSize.value}px`,
          whiteSpace: 'nowrap',
        }}
      >
        {refRange}
      </td>
      <td
        style={{
          padding: `${ReportLayoutConfig.boxPadding.dense}px 10px`,
          textAlign: 'center',
          color: colorTokens.secondary,
          borderBottom: `1px solid ${colorTokens.borderLight}`,
          borderLeft: `1px solid ${colorTokens.borderLight}`,
          fontSize: `${ReportLayoutConfig.fontSize.value}px`,
          whiteSpace: 'nowrap',
        }}
      >
        {unit}
      </td>
    </tr>
  );
}

/**
 * SectionGroupHeader - Header for grouped sections (e.g., HEMOGLOBIN, RBC COUNT)
 */
export function SectionGroupHeader({
  title,
  colorTokens,
}: {
  title: string;
  colorTokens: Record<string, string>;
}) {
  return (
    <tr style={{ background: colorTokens.brandLight }}>
      <td
        colSpan={5}
        style={{
          padding: `${ReportLayoutConfig.boxPadding.dense}px 10px`,
          fontWeight: 800,
          fontSize: `${ReportLayoutConfig.fontSize.value * 0.9}px`,
          color: colorTokens.brand,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          borderBottom: `1px solid ${colorTokens.borderLight}`,
        }}
      >
        {title}
      </td>
    </tr>
  );
}

/**
 * ImprovedPatientBox - Better structured patient information display
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
        display: 'flex',
        borderBottom: `2px solid ${colorTokens.borderLight}`,
        paddingBottom: '16px',
        alignItems: 'stretch',
      }}
    >
      {/* Column 1: Patient Details & QR */}
      <div style={{ flex: '1.2', borderRight: `1px solid ${colorTokens.borderLight}`, paddingRight: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: colorTokens.text }}>
              {patientName}
            </h2>
            <div style={{ fontSize: '13px', color: '#444', lineHeight: 1.6 }}>
              <div>Age : {age} Years</div>
              <div>Sex : {gender}</div>
              <div>PID : {patientId}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Registration ID & Ref Doctor & QR */}
      <div style={{ flex: '1.5', borderRight: `1px solid ${colorTokens.borderLight}`, padding: '0 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',flexDirection:'column' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 4px 0', color: colorTokens.text }}>
          Registration ID:
        </h3>
        
            <div style={{ fontSize: '15px', color: colorTokens.text, marginBottom: '8px', fontWeight: 800 }}>
              {sampleId}
            </div>
            <div style={{ fontSize: '13px', color: colorTokens.text }}>
              Ref. By: <span style={{ fontWeight: 800 }}>{referringDoctor}</span>
            </div></div>
          <div style={{ flexShrink: 0, background: '#fff' }}>
            {qrCode}
          </div>
        
      </div>

      {/* Column 3: Barcode & Dates */}
      <div style={{ flex: '1.3', paddingLeft: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: '6px' }}>
          {barcode}
        </div>
        <div style={{ fontSize: '11px', color: colorTokens.text, width: '100%', lineHeight: 1.4 }}>
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
  );
}

/**
 * TestSectionBlock - Container for each test with proper spacing
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
            color: colorTokens.brand,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            display: 'inline-block',
            paddingBottom: '4px',
            borderBottom: `2px solid ${colorTokens.brand}`,
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
