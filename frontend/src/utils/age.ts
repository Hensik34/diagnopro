import type { AgeUnit } from '../types';

export const DEFAULT_AGE_UNIT: AgeUnit = 'years';

export function normalizeAgeUnit(ageUnit?: string | null): AgeUnit {
  if (ageUnit === 'months' || ageUnit === 'days') {
    return ageUnit;
  }

  return DEFAULT_AGE_UNIT;
}

export function getAgeMax(ageUnit?: string | null): number {
  switch (normalizeAgeUnit(ageUnit)) {
    case 'months':
      return 1800;
    case 'days':
      return 54750;
    default:
      return 150;
  }
}

export function formatAge(age?: number | null, ageUnit?: string | null): string {
  if (age == null) {
    return '';
  }

  const normalizedUnit = normalizeAgeUnit(ageUnit);
  const unitLabel = normalizedUnit.charAt(0).toUpperCase() + normalizedUnit.slice(1);
  return `${age} ${unitLabel}`;
}