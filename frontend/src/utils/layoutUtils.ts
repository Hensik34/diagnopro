/**
 * Layout utilities for generating and managing test layouts
 */

import {
  DEFAULT_LAYOUTS,
  DEFAULT_COLUMNS,
  GROUPED_COLUMNS,
  type TestLayout,
  type LayoutColumn,
  type ReportLayoutTemplate,
} from '../types/reportLayout';

/**
 * Get default layout for a test based on category or name
 */
export function getDefaultLayoutForTest(testName: string, testCategory?: string): Partial<TestLayout> {
  // Check exact name first
  if (DEFAULT_LAYOUTS[testName]) {
    return DEFAULT_LAYOUTS[testName];
  }

  // Check category
  if (testCategory && DEFAULT_LAYOUTS[testCategory]) {
    return DEFAULT_LAYOUTS[testCategory];
  }

  // Check for common patterns
  const nameLower = testName.toLowerCase();
  if (nameLower.includes('blood') || nameLower.includes('cbc') || nameLower.includes('hemoglobin')) {
    return DEFAULT_LAYOUTS.CBC || {};
  }
  if (nameLower.includes('kidney') || nameLower.includes('kft') || nameLower.includes('creatinine')) {
    return DEFAULT_LAYOUTS.KFT || {};
  }
  if (nameLower.includes('liver') || nameLower.includes('lft') || nameLower.includes('bilirubin')) {
    return DEFAULT_LAYOUTS.LFT || {};
  }

  // Default to flat layout
  return {
    layoutType: 'flat',
    style: {
      fontSize: 10.5,
      lineHeight: 1.6,
      rowHeight: 'normal',
    },
  };
}

/**
 * Create a new layout for a test
 */
export function createTestLayout(
  testId: string,
  testName: string,
  testCategory?: string,
  userId?: string
): TestLayout {
  const now = new Date().toISOString();
  const defaultLayout = getDefaultLayoutForTest(testName, testCategory);
  const layoutType = defaultLayout.layoutType || 'flat';
  const isGrouped = layoutType === 'grouped';
  const columns = isGrouped ? GROUPED_COLUMNS : DEFAULT_COLUMNS;

  return {
    id: testId,
    testName,
    layoutType: layoutType as any,
    style: {
      fontSize: 10.5,
      lineHeight: 1.6,
      rowHeight: 'normal',
      headerBold: true,
      groupBold: isGrouped,
      padding: 3,
      ...defaultLayout.style,
    },
    columns,
    sections: defaultLayout.sections,
    customRules: {
      groupByField: 'group',
      hideIfEmpty: true,
      showInterpretation: true,
      showInstruments: true,
    },
    createdAt: now,
    updatedAt: now,
    createdBy: userId || 'system',
  };
}

/**
 * Create a default template for a branch
 */
export function createDefaultTemplate(
  branchId: string,
  templateName = 'Standard Medical Report',
  userId?: string
): ReportLayoutTemplate {
  const now = new Date().toISOString();

  return {
    id: `template-${Date.now()}`,
    name: templateName,
    description: 'Standard medical laboratory report template',
    branchId,
    isDefault: true,
    globalStyle: {
      fontSize: 10.5,
      lineHeight: 1.6,
      rowHeight: 'normal',
      headerBold: true,
      groupBold: true,
      padding: 3,
      margin: 2,
    },
    defaultColumns: DEFAULT_COLUMNS,
    testLayouts: [
      createTestLayout('cbc', 'Complete Blood Count', 'CBC', userId),
      createTestLayout('kft', 'Kidney Function Test', 'KFT', userId),
      createTestLayout('lft', 'Liver Function Test', 'LFT', userId),
    ],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Apply global style to all columns in a layout
 */
export function applyGlobalStyle(
  columns: LayoutColumn[],
  globalFontSize?: number,
  globalBold?: boolean
): LayoutColumn[] {
  return columns.map((col) => ({
    ...col,
    fontSize: col.fontSize || globalFontSize,
    bold: col.bold !== undefined ? col.bold : globalBold,
  }));
}

/**
 * Validate a layout configuration
 */
export function validateLayout(layout: TestLayout): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!layout.id) errors.push('Layout must have an ID');
  if (!layout.testName) errors.push('Layout must have a test name');
  if (!layout.layoutType) errors.push('Layout must have a type');
  if (!layout.columns || layout.columns.length === 0) {
    errors.push('Layout must have at least one column');
  }

  if (layout.layoutType === 'grouped' && (!layout.sections || layout.sections.length === 0)) {
    errors.push('Grouped layout must have sections defined');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Export layout as JSON
 */
export function exportLayout(layout: TestLayout): string {
  return JSON.stringify(layout, null, 2);
}

/**
 * Import layout from JSON
 */
export function importLayout(json: string): TestLayout | null {
  try {
    const layout = JSON.parse(json);
    const validation = validateLayout(layout);
    if (!validation.valid) {
      console.error('Invalid layout:', validation.errors);
      return null;
    }
    return layout;
  } catch (error) {
    console.error('Failed to parse layout JSON:', error);
    return null;
  }
}
