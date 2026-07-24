import type { ReferenceRule, Patient } from "../../types";

// ============================================
// Reference Rules Utility Functions for Reports
// ============================================

export function normalizeReferenceRules(raw: any): ReferenceRule[] {
  if (!raw) return [];

  // Already an array
  if (Array.isArray(raw)) {
    return raw.map(r => ({
      age_group: r.age_group || 'all',
      sex: r.sex || 'any',
      low: r.low ?? r.min ?? null,
      high: r.high ?? r.max ?? null,
      age_min: r.age_min != null ? Number(r.age_min) : null,
      age_max: r.age_max != null ? Number(r.age_max) : null,
      age_min_unit: r.age_min_unit || r.age_max_unit || 'years',
      age_max_unit: r.age_max_unit || r.age_min_unit || 'years',
      note: r.note,
    }));
  }

  // Object format
  if (typeof raw === 'object') {
    // Check if it's a gender-keyed object like { male: { min, max }, female: { min, max } }
    const keys = Object.keys(raw);
    const genderKeys = keys.filter(k => ['male', 'female'].includes(k));

    if (genderKeys.length > 0) {
      const rules: ReferenceRule[] = [];
      for (const gender of genderKeys) {
        const vals = raw[gender];
        if (vals && typeof vals === 'object') {
          rules.push({
            age_group: 'all',
            sex: gender,
            low: (vals as any).low ?? (vals as any).min ?? null,
            high: (vals as any).high ?? (vals as any).max ?? null,
          });
        }
      }
      return rules;
    }

    // Simple { min, max } object
    if ('min' in raw || 'max' in raw || 'low' in raw || 'high' in raw) {
      return [{
        age_group: 'all',
        sex: 'any',
        low: raw.low ?? raw.min ?? null,
        high: raw.high ?? raw.max ?? null,
      }];
    }
  }

  return [];
}

export interface MatchedRange {
  low: number | null;
  high: number | null;
  note: string;
  isRuleMatched: boolean;
  criticalLow: number | null;
  criticalHigh: number | null;
}
export function convertAge(age: number, fromUnit: string, toUnit: string): number {
  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();
  if (from === to) return age;

  // Convert to days first
  let ageInDays = age;
  if (from === 'years' || from === 'year' || from === 'y') {
    ageInDays = age * 365.25;
  } else if (from === 'months' || from === 'month' || from === 'm') {
    ageInDays = age * 30.4375;
  }

  // Convert from days to target unit
  if (to === 'years' || to === 'year' || to === 'y') {
    return ageInDays / 365.25;
  } else if (to === 'months' || to === 'month' || to === 'm') {
    return ageInDays / 30.4375;
  }
  return ageInDays;
}

export function getPatientReferenceRange(
  field: {
    reference_rules?: any;
    min_value?: number | null;
    max_value?: number | null;
    critical_rules?: any
  },
  patient: Patient | null
): MatchedRange {
  let criticalLow: number | null = null;
  let criticalHigh: number | null = null;
  if (field.critical_rules) {
    criticalLow = field.critical_rules.low ?? null;
    criticalHigh = field.critical_rules.high ?? null;
  }

  // If there are qualitative bands, build their summary note
  if (field.reference_rules && typeof field.reference_rules === 'object' && !Array.isArray(field.reference_rules) && 'qualitative_bands' in field.reference_rules) {
    const bands = field.reference_rules.qualitative_bands || [];
    const bandsSummary = bands.map((b: any) => {
      let opStr = '';
      if (b.operator === 'lt') opStr = `<${b.value ?? ''}`;
      else if (b.operator === 'lte') opStr = `≤${b.value ?? ''}`;
      else if (b.operator === 'gt') opStr = `>${b.value ?? ''}`;
      else if (b.operator === 'gte') opStr = `≥${b.value ?? ''}`;
      else if (b.operator === 'eq') opStr = `=${b.value ?? ''}`;
      else if (b.operator === 'range') opStr = `${b.min ?? ''}–${b.max ?? ''}`;
      return `${b.label} ${opStr}`;
    }).join(' | ');
    return {
      low: null,
      high: null,
      note: bandsSummary,
      isRuleMatched: true,
      criticalLow,
      criticalHigh,
    };
  }

  const rules = normalizeReferenceRules(field.reference_rules);

  const fallbackRange: MatchedRange = {
    low: field.min_value != null ? Number(field.min_value) : null,
    high: field.max_value != null ? Number(field.max_value) : null,
    note: '',
    isRuleMatched: false,
    criticalLow,
    criticalHigh,
  };

  if (!patient || rules.length === 0) {
    return fallbackRange;
  }

  // Calculate patient age in years
  let ageInYears = patient.age ?? 0;
  const ageUnit = patient.age_unit ? patient.age_unit.toLowerCase() : 'years';
  if (ageUnit === 'months') {
    ageInYears = ageInYears / 12;
  } else if (ageUnit === 'days') {
    ageInYears = ageInYears / 365.25;
  }

  // Determine age group
  let ageGroup = 'adult';
  if (ageInYears <= 0.08) {
    ageGroup = 'neonatal';
  } else if (ageInYears <= 1) {
    ageGroup = 'infant';
  } else if (ageInYears <= 12) {
    ageGroup = 'pediatric';
  } else if (ageInYears < 18) {
    ageGroup = 'adolescent';
  } else if (ageInYears >= 65) {
    ageGroup = 'elderly';
  }

  const patientSex = patient.gender ? patient.gender.toLowerCase() : 'any';

  // Find compatible rules and score them
  let bestRule: any = null;
  let bestScore = -1;

  for (const rule of rules) {
    let isCompatible = true;
    let score = 0;

    // Check gender compatibility
    const ruleSex = rule.sex ? rule.sex.toLowerCase() : 'any';
    if (ruleSex !== 'any' && ruleSex !== 'all' && ruleSex !== patientSex) {
      isCompatible = false;
    } else if (ruleSex === patientSex) {
      score += 10;
    } else {
      score += 1;
    }

    // Check age compatibility
    if (isCompatible) {
      if (rule.age_min != null || rule.age_max != null) {
        if (rule.age_min != null) {
          const ruleMinUnit = (rule.age_min_unit || 'years').toLowerCase();
          const patientAgeInMinUnit = convertAge(patient.age ?? 0, patient.age_unit || 'years', ruleMinUnit);
          if (patientAgeInMinUnit < rule.age_min) {
            isCompatible = false;
          }
        }
        if (isCompatible && rule.age_max != null) {
          const ruleMaxUnit = (rule.age_max_unit || 'years').toLowerCase();
          const patientAgeInMaxUnit = convertAge(patient.age ?? 0, patient.age_unit || 'years', ruleMaxUnit);
          if (patientAgeInMaxUnit > rule.age_max) {
            isCompatible = false;
          }
        }
        if (isCompatible) {
          score += 20;
        }
      } else {
        const ruleAgeGroup = rule.age_group ? rule.age_group.toLowerCase() : 'all';
        if (ruleAgeGroup !== 'all' && ruleAgeGroup !== 'any' && ruleAgeGroup !== ageGroup) {
          isCompatible = false;
        } else if (ruleAgeGroup === ageGroup) {
          score += 10;
        } else {
          score += 1;
        }
      }
    }

    if (isCompatible && score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  if (bestRule) {
    return {
      low: bestRule.low ?? null,
      high: bestRule.high ?? null,
      note: bestRule.note || '',
      isRuleMatched: true,
      criticalLow,
      criticalHigh,
    };
  }

  return fallbackRange;
}

export function formatReferenceRange(range: MatchedRange): string {
  if (range.low != null || range.high != null) {
    const lo = range.low != null ? range.low : '—';
    const hi = range.high != null ? range.high : '—';
    return `${lo} - ${hi}`;
  }
  return range.note || '-';
}

export function isCbcTest(testName?: string, testCode?: string): boolean {
  const name = (testName || '').toLowerCase();
  const code = (testCode || '').toLowerCase();
  return (
    code === 'cbc' ||
    code.includes('cbc') ||
    name.includes('complete blood count') ||
    name.includes('cbc')
  );
}

export function isWorkflowEditable(status?: string): boolean {
  return status === 'draft' || status === 'rejected' || status === 'approved';
}

export function stableSerialize(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(obj[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function sameNumberish(a: unknown, b: unknown): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  const aNum = Number(a);
  const bNum = Number(b);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    return aNum === bNum;
  }
  return false;
}
