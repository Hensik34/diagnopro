/**
 * Report Layout System Types
 * Allows admins to customize how different tests are displayed in reports
 */

export type LayoutType = 'grouped' | 'flat' | 'hybrid' | 'custom';

export interface LayoutStyle {
  fontSize?: number; // in px (9-14)
  lineHeight?: number; // 1.3-2.0
  padding?: number; // in px
  margin?: number; // in px
  fontBold?: boolean;
  headerBold?: boolean;
  groupBold?: boolean;
  columnSpacing?: number; // percentage of width
  rowHeight?: 'compact' | 'normal' | 'spacious';
  colors?: {
    header?: string;
    group?: string;
    row?: string;
    abnormal?: string;
    normal?: string;
    low?: string;
    high?: string;
  };
}

export interface LayoutColumn {
  name: 'investigation' | 'result' | 'status' | 'refRange' | 'unit' | 'method' | 'custom';
  label: string;
  width?: string; // percentage or px
  align?: 'left' | 'center' | 'right';
  show?: boolean;
  bold?: boolean;
  fontSize?: number;
}

export interface LayoutSection {
  title?: string; // for grouped layouts, e.g., "HEMOGLOBIN"
  fields: string[]; // field names to include
  style?: LayoutStyle;
  showHeader?: boolean;
  nestTable?: boolean; // for sub-sections
}

export interface TestLayout {
  id: string; // test ID
  testName: string;
  layoutType: LayoutType;
  
  // Global style for this layout
  style: LayoutStyle;
  
  // Columns to display
  columns: LayoutColumn[];
  
  // For grouped layouts
  sections?: LayoutSection[];
  
  // For hybrid layouts
  primarySections?: LayoutSection[]; // main table
  secondarySections?: LayoutSection[]; // additional tables
  
  // Custom rendering instructions
  customRules?: {
    groupByField?: string; // auto-group parameters by field value
    hideIfEmpty?: boolean;
    showInterpretation?: boolean;
    showInstruments?: boolean;
  };
  
  createdAt: string;
  updatedAt: string;
  createdBy: string; // user ID
}

export interface ReportLayoutTemplate {
  id: string;
  name: string; // "SRL Style", "Metropolis Style", etc.
  description?: string;
  
  // Default styles applied to all tests
  globalStyle: LayoutStyle;
  
  // Default columns for all tests
  defaultColumns: LayoutColumn[];
  
  // Test-specific overrides
  testLayouts: TestLayout[];
  
  branchId: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pre-built layout templates for common test types
 */
export const DEFAULT_LAYOUTS: Record<string, Partial<TestLayout>> = {
  CBC: {
    layoutType: 'grouped',
    sections: [
      { title: 'HEMOGLOBIN', fields: ['Hemoglobin (Hb)', 'Hemoglobin Color Index'] },
      { title: 'RBC COUNT', fields: ['Total RBC count'] },
      { title: 'BLOOD INDICES', fields: ['Packed Cell Volume (PCV)', 'Mean Corpuscular Volume (MCV)', 'MCH', 'MCHC', 'RDW'] },
      { title: 'WBC COUNT', fields: ['Total WBC count'] },
      { title: 'DIFFERENTIAL WBC COUNT', fields: ['Neutrophils', 'Lymphocytes', 'Eosinophils', 'Monocytes', 'Basophils'] },
      { title: 'PLATELET COUNT', fields: ['Platelet Count'] },
    ],
    style: {
      fontSize: 10.5,
      lineHeight: 1.5,
      rowHeight: 'normal',
      headerBold: true,
      groupBold: true,
    },
  },
  KFT: {
    layoutType: 'flat',
    style: {
      fontSize: 10.5,
      lineHeight: 1.6,
      rowHeight: 'spacious',
    },
  },
  LFT: {
    layoutType: 'flat',
    style: {
      fontSize: 10.5,
      lineHeight: 1.6,
      rowHeight: 'spacious',
    },
  },
};

export const DEFAULT_COLUMNS: LayoutColumn[] = [
  { name: 'investigation', label: 'Investigation', width: '35%', align: 'left' },
  { name: 'result', label: 'Result', width: '15%', align: 'center' },
  { name: 'status', label: '', width: '8%', align: 'center' },
  { name: 'refRange', label: 'Reference Value', width: '25%', align: 'center' },
  { name: 'unit', label: 'Unit', width: '17%', align: 'center' },
];

export const GROUPED_COLUMNS: LayoutColumn[] = [
  { name: 'investigation', label: 'Investigation', width: '40%', align: 'left' },
  { name: 'result', label: 'Result', width: '18%', align: 'center' },
  { name: 'status', label: '', width: '7%', align: 'center' },
  { name: 'refRange', label: 'Reference Value', width: '22%', align: 'center' },
  { name: 'unit', label: 'Unit', width: '13%', align: 'center' },
];
