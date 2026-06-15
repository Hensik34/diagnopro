import { TestField } from './index';

export interface ParameterSetting {
  fieldId: string;
  fieldName: string;
  position: number;
  visible: boolean;
  group?: string;
}

export interface LayoutConfig {
  parameterSettings: ParameterSetting[];
  version?: number;
}

export interface TestLayoutResponse {
  testId: string;
  testName: string;
  layoutConfig: LayoutConfig | null;
  fields: TestField[];
  clinical_significance?: string;
  updated_at: string;
}
