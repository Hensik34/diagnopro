export interface Sum100Group {
  label: string;
  paramNames: string[];
}

export interface MicroscopicConfig {
  keywords: string[];
  plentyTriggers: string[];
  redCellKeywords: string[];
  redCellThreshold: number; // e.g. 2 (singleNum > 2 is high)
  otherThreshold: number;   // e.g. 5 (singleNum >= 5 is high)
  rangeMinThreshold: number; // e.g. 3 (minVal >= 3 is high)
  rangeMaxThreshold: number; // e.g. 5 (maxVal >= 5 is high)
}

// 1. Centralized configuration for sum-100 validation groups
export const SUM_100_GROUPS: Sum100Group[] = [
  {
    label: 'Differential Count',
    paramNames: ['Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils'],
  },
  {
    label: 'Motility Count',
    paramNames: ['Motility Actively Motile', 'Sluggish Motile', 'Non Motile'],
  },
];

// 2. Centralized configuration for qualitative select fields with "high" triggers
export const QUALITATIVE_HIGH_TRIGGERS = [
  'positive',
  'present',
  'reactive',
  'trace'
];

// 3. Centralized configuration for microscopic parameters
export const MICROSCOPIC_CONFIG: MicroscopicConfig = {
  keywords: [
    'pus cell',
    'red cell',
    'r.b. c',
    'epithelial',
    'epithcell',
    'puscells',
    'redcells'
  ],
  plentyTriggers: ['plenty'],
  redCellKeywords: [
    'red cell',
    'r.b. c',
    'redcells'
  ],
  redCellThreshold: 2,  // triggers when > 2
  otherThreshold: 5,    // triggers when >= 5
  rangeMinThreshold: 3, // triggers when range min >= 3
  rangeMaxThreshold: 5, // triggers when range max >= 5
};

export interface ParameterRule {
  nameKey: string;
  isHigh: (value: string, options?: string, testCode?: string, reportType?: string) => boolean;
}

export const PARAMETER_SPECIFIC_RULES: ParameterRule[] = [
  {
    nameKey: 'colour', // covers 'Colour'
    isHigh: (val: string, options?: string) => {
      const v = val.trim().toLowerCase();
      const opts = (options || '').toLowerCase();
      // If it is Stool color (determined by options containing blackish or greenish or brownish)
      if (opts.includes('blackish') || opts.includes('greenish') || opts.includes('brownish')) {
        const highStoolColors = ['blackish', 'blckish', 'reddish', 'redish'];
        return highStoolColors.includes(v);
      }
      // Otherwise, assume Urine color rules
      const highUrineColors = ['yellow', 'dark yellow', 'dark yerllow', 'orange', 'milky', 'reddish yellow', 'redish yellow', 'deep yellow'];
      return highUrineColors.includes(v);
    }
  },
  {
    nameKey: 'color', // covers 'Color' just in case
    isHigh: (val: string, options?: string) => {
      const v = val.trim().toLowerCase();
      const opts = (options || '').toLowerCase();
      // If it is Stool color
      if (opts.includes('blackish') || opts.includes('greenish') || opts.includes('brownish')) {
        const highStoolColors = ['blackish', 'blckish', 'reddish', 'redish'];
        return highStoolColors.includes(v);
      }
      // Otherwise, assume Urine color rules
      const highUrineColors = ['yellow', 'dark yellow', 'dark yerllow', 'orange', 'milky', 'reddish yellow', 'redish yellow', 'deep yellow'];
      return highUrineColors.includes(v);
    }
  },
  {
    nameKey: 'transparency',
    isHigh: (val: string) => {
      const v = val.trim().toLowerCase();
      // only clear is normal, else mark high (e.g. Slightly Turbid, Turbid, Cloudy)
      return v !== 'clear' && (v === 'slightly turbid' || v === 'turbid' || v === 'cloudy');
    }
  },
  {
    nameKey: 'reaction',
    isHigh: (val: string, options?: string, testCode?: string, reportType?: string) => {
      const v = val.trim().toLowerCase();
      const code = (testCode || '').toLowerCase();
      const type = (reportType || '').toLowerCase();
      if (code.includes('semen') || type.includes('semen')) {
        // Semen reaction: acidic is high, alkaline is normal
        return v === 'acidic';
      }
      // Other reactions (stool/urine): alkaline or alkine is high
      return v === 'alkaline' || v === 'alkine';
    }
  },
  {
    nameKey: 'casts',
    isHigh: (val: string) => {
      const v = val.trim().toLowerCase();
      // in Casts, absent is normal, else all mark as high
      return v !== 'absent';
    }
  },
  {
    nameKey: 'crystals',
    isHigh: (val: string) => {
      const v = val.trim().toLowerCase();
      // for Crystals, expect absent is normal, else all mark as high
      return v !== 'absent';
    }
  },
  {
    nameKey: 'consistency',
    isHigh: (val: string) => {
      const v = val.trim().toLowerCase();
      // Consistency for hard liquid mark as high
      return v === 'hard' || v === 'liquid';
    }
  },
  {
    nameKey: 'fat globules',
    isHigh: (val: string) => {
      const v = val.trim().toLowerCase();
      // for Fat Globules, present and other all options except absent mark high
      return v !== 'absent';
    }
  }
];

/**
 * Helper to check if a qualitative select value indicates a "high" / abnormal state.
 */
export function isQualitativeValueHigh(value: string, paramName?: string, options?: string, testCode?: string, reportType?: string): boolean {
  if (!value) return false;
  const val = value.trim().toLowerCase();

  // 1. Check parameter-specific rules first
  if (paramName) {
    const nameLower = paramName.toLowerCase();
    const specificRule = PARAMETER_SPECIFIC_RULES.find(rule => nameLower.includes(rule.nameKey));
    if (specificRule) {
      return specificRule.isHigh(value, options, testCode, reportType);
    }
  }

  // 2. Fall back to generic qualitative high triggers
  return QUALITATIVE_HIGH_TRIGGERS.some(trigger => 
    val === trigger || val.includes(trigger)
  );
}

/**
 * Helper to check if a value for a microscopic parameter indicates a "high" state.
 */
export function isMicroscopicRangeHigh(fieldName: string, value: string): boolean {
  if (!value) return false;
  const name = fieldName.toLowerCase();
  
  const isMicroscopicTarget = MICROSCOPIC_CONFIG.keywords.some(keyword => name.includes(keyword));

  if (isMicroscopicTarget) {
    const val = value.trim().toLowerCase();
    
    if (MICROSCOPIC_CONFIG.plentyTriggers.some(trigger => val === trigger)) {
      return true;
    }
    
    // Check range pattern e.g. "3-5" or "2-4"
    const match = val.match(/^(\d+)\s*-\s*(\d+)$/);
    if (match) {
      const minVal = parseInt(match[1], 10);
      const maxVal = parseInt(match[2], 10);
      if (minVal >= MICROSCOPIC_CONFIG.rangeMinThreshold || maxVal >= MICROSCOPIC_CONFIG.rangeMaxThreshold) {
        return true;
      }
    }
    
    const singleNum = parseFloat(val);
    if (!isNaN(singleNum)) {
      const isRedCell = MICROSCOPIC_CONFIG.redCellKeywords.some(keyword => name.includes(keyword));
      if (isRedCell) {
        return singleNum > MICROSCOPIC_CONFIG.redCellThreshold;
      } else {
        return singleNum >= MICROSCOPIC_CONFIG.otherThreshold;
      }
    }
  }
  return false;
}
