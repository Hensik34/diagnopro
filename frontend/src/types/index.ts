// ==========================================
// User & Auth Types
// ==========================================

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  role: 'admin' | 'doctor' | 'staff' | 'lab_technician';
  is_active: boolean;
  petrol_price_per_km?: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginBranch {
  id: string;
  name: string;
  location?: string;
  city?: string;
  role: string;
}

export interface DoctorProfile {
  id: string;
  title?: string;
  name: string;
  specialization?: string;
  commission_percentage?: number;
  phone?: string;
  email?: string;
  signature_url?: string | null;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
  branches?: LoginBranch[];
  doctorProfile?: DoctorProfile | null;
}

// ==========================================
// Branch Types
// ==========================================

export interface Branch {
  id: string;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// Patient Types
// ==========================================

export type AgeUnit = 'years' | 'months' | 'days';

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone: string;
  age?: number;
  age_unit?: AgeUnit;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  blood_type?: string;
  branch_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  branch_name?: string;
}

export interface CreatePatientData {
  name: string;
  email?: string;
  phone: string;
  age?: number;
  age_unit?: AgeUnit;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  blood_type?: string;
  branch_id: string;
}

// ==========================================
// Doctor Types
// ==========================================

export interface Doctor {
  id: string;
  title: string;
  name: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone: string;
  specialization?: string;
  license_number?: string;
  commission_percentage?: number;
  signature_url?: string | null;
  user_id?: string | null;
  branch_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDoctorData {
  title?: string;
  name: string;
  email?: string;
  phone: string;
  specialization?: string;
  license_number?: string;
  commission_percentage?: number;
  branch_id: string;
  password?: string;
}

// Doctor Statement Types (for commission settlement)
export interface DoctorStatementReport {
  report_id: string;
  report_date: string;
  report_type: string;
  report_amount: number;
  doctor_commission: number;
  b2b_charge: number;
  status: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
}

export interface DoctorStatement {
  doctor: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    commission_percentage: number;
  };
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_reports: number;
    total_amount: number;
    total_commission: number;
    total_b2b_charge: number;
  };
  reports: DoctorStatementReport[];
}

// ==========================================
// Sample Types
// ==========================================

export interface Sample {
  id: string;
  patient_id: string;
  sample_type?: string;
  sample_id_code: string;
  collection_date?: string;
  collected_by: string;
  branch_id: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  patient_name?: string;
  collector_firstname?: string;
  collector_lastname?: string;
  branch_name?: string;
}

export interface CreateSampleData {
  patient_id: string;
  sample_type?: string;
  collection_date?: string;
  branch_id: string;
  notes?: string;
}

// ==========================================
// Test Types (Master Test List)
// ==========================================

export interface Test {
  id: string;
  test_name: string;
  test_code: string;
  category?: string;
  sample_type?: string;
  price?: number;
  turnaround_time?: number; // in hours
  description?: string;
  has_branch_override?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTestData {
  test_name: string;
  test_code: string;
  category?: string;
  sample_type?: string;
  price?: number;
  turnaround_time?: number;
  description?: string;
  branch_id?: string;
}

// ==========================================
// Test Field Types (Dynamic parameters per test)
// ==========================================

export type FieldType = 'input' | 'calculated' | 'flag';

// Reference range rule (age/gender-specific)
export interface ReferenceRule {
  age_group?: string;   // 'adult' | 'pediatric' | 'neonatal' | 'all' | custom
  age_min?: number;
  age_max?: number;
  sex?: string;         // 'male' | 'female' | 'any'
  low?: number | null;
  high?: number | null;
  min?: number | null;  // alias for low (legacy format)
  max?: number | null;  // alias for high (legacy format)
  note?: string;
}

// Critical value thresholds
export interface CriticalRules {
  low?: number | null;
  high?: number | null;
  policy?: string;
}

export interface TestField {
  id: string;
  test_id: string;
  field_name: string;
  unit?: string;
  min_value?: number | null;
  max_value?: number | null;
  input_type?: string; // 'number' | 'text' | 'select'
  options?: string;     // comma-separated for select type
  field_type?: FieldType; // input (default), calculated, flag
  formula?: string;       // JS expression for calculated fields, e.g. "TotalCholesterol / HDL"
  depends_on?: string;    // JSON array of field names this field depends on
  section_group?: string; // Sub-section heading within a test, e.g. "HEMOGLOBIN", "RBC COUNT"
  order_index: number;
  reference_rules?: ReferenceRule[] | Record<string, any> | null;
  critical_rules?: CriticalRules | null;
  interpretation_logic?: Record<string, any> | null;
  is_mandatory?: boolean;
  display_format?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTestFieldData {
  field_name: string;
  unit?: string;
  min_value?: number | null;
  max_value?: number | null;
  input_type?: string;
  options?: string;
  field_type?: FieldType;
  formula?: string;
  depends_on?: string;
  order_index?: number;
  section_group?: string;
  reference_rules?: ReferenceRule[] | null;
  critical_rules?: CriticalRules | null;
}

// ==========================================
// Sample Test Types (Tests assigned to samples)
// ==========================================

export interface SampleTest {
  id: string;
  sample_id: string;
  test_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  result?: string;
  result_unit?: string;
  reference_range?: string;
  performed_by?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  test_name?: string;
  test_code?: string;
  category?: string;
}

export interface UpdateTestResultData {
  result?: string;
  result_unit?: string;
  reference_range?: string;
}

// ==========================================
// Report Types
// ==========================================

// New workflow statuses
export type ReportStatus = 'draft' | 'under_review' | 'approved' | 'rejected' | 'created' | 'collected' | 'processing' | 'completed';

// Test parameter for storing test results
export interface TestParameter {
  name: string;
  value: string | number | null;
  unit?: string;
  referenceRange?: string;
  status?: 'normal' | 'high' | 'low' | 'critical';
  group?: string; // Sub-section heading, e.g. "HEMOGLOBIN", "RBC COUNT"
}

// A single test group within a report (e.g., CBC, Lipid Profile)
export interface TestGroup {
  testId: string;
  testName: string;
  parameters: TestParameter[];
}

// Test data stored in report
export interface TestData {
  testType?: string;
  testName?: string;
  testIds?: string[];       // IDs of tests associated with this report
  // NEW: grouped structure — each test has its own parameter list
  tests?: TestGroup[];
  // LEGACY: flat parameter list (for backward compatibility with old reports)
  parameters?: TestParameter[];
  remarks?: string;
}

// Delivery preferences for sending report
export interface DeliveryPreferences {
  patient_whatsapp?: boolean;
  patient_email?: boolean;
  patient_email_address?: string;
  doctor_whatsapp?: boolean;
  doctor_email?: boolean;
}

export interface Report {
  id: string;
  patient_id: string;
  doctor_id?: string;
  technician_id?: string;
  report_type?: string;
  sample_id?: string;
  status: ReportStatus;
  clinical_notes?: string;
  findings?: string;
  recommendations?: string;
  reviewed_by?: string;
  approved_by?: string;
  approved_at?: string;
  // New workflow fields
  submitted_by?: string;
  submitted_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  // Test data
  test_data?: TestData;
  // Delivery preferences
  delivery_preferences?: DeliveryPreferences;
  // Financial
  report_amount?: number;
  doctor_commission?: number;
  is_self_report?: boolean;
  // Billing
  base_amount?: number;
  lab_discount_type?: 'percent' | 'amount';
  lab_discount_value?: number;
  doctor_discount?: number;
  final_amount?: number;
  payment_status?: 'paid' | 'partial' | 'pending';
  // B2B Partner Lab
  b2b_lab_id?: string;
  b2b_charge?: number;
  b2b_lab_name?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  patient_name?: string;
  patient_phone?: string;
  patient_gender?: string;
  patient_age?: number;
  patient_age_unit?: AgeUnit;
  doctor_title?: string;
  doctor_name?: string;
  doctor_firstname?: string;
  doctor_lastname?: string;
  doctor_phone?: string;
  doctor_email?: string;
  technician_firstname?: string;
  technician_lastname?: string;
  sample_id_code?: string;
  sample_type?: string;
  approved_by_firstname?: string;
  approved_by_lastname?: string;
  submitted_by_firstname?: string;
  submitted_by_lastname?: string;
  rejected_by_firstname?: string;
  rejected_by_lastname?: string;
}

export interface CreateReportData {
  patient_id: string;
  doctor_id?: string;
  report_type?: string;
  sample_id?: string;
  clinical_notes?: string;
  technician_id?: string;
  report_amount?: number;
  is_self_report?: boolean;
  test_data?: TestData;
  findings?: string;
  recommendations?: string;
  branch_id?: string;
  delivery_preferences?: DeliveryPreferences;
  base_amount?: number;
  lab_discount_type?: 'percent' | 'amount';
  lab_discount_value?: number;
  doctor_discount?: number;
  final_amount?: number;
  b2b_lab_id?: string;
  b2b_charge?: number;
}

export interface UpdateReportData {
  findings?: string;
  recommendations?: string;
  clinical_notes?: string;
  technician_id?: string;
  test_data?: TestData;
  doctor_id?: string;
  report_type?: string;
  report_amount?: number;
  is_self_report?: boolean;
}

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T> {
  message: string;
  data: T;
  count?: number;
}

export interface ApiError {
  error: string;
  message?: string;
}

// ==========================================
// Filter Types
// ==========================================

export interface PatientFilters {
  branch_id?: string;
  search?: string;
}

export interface ReportFilters {
  patient_id?: string;
  status?: ReportStatus;
  branch_id?: string;
}

// ==========================================
// Billing & Payment Types
// ==========================================

export type PaymentMode = 'cash' | 'upi' | 'card';
export type PaymentStatus = 'paid' | 'partial' | 'pending';

export interface Payment {
  id: string;
  report_id: string;
  payment_mode: PaymentMode;
  amount: number;
  created_at: string;
}

export interface BillingData {
  base_amount: number;
  lab_discount_type: 'percent' | 'amount';
  lab_discount_value: number;
  doctor_discount: number;
  final_amount: number;
}

export interface PaymentsResponse {
  payments: Payment[];
  totalPaid: number;
  finalAmount: number;
  paymentStatus: PaymentStatus;
}

export interface SampleFilters {
  branch_id?: string;
  status?: string;
  patient_id?: string;
}

// ==========================================
// Inventory Types
// ==========================================

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Reagent' | 'Kit';
  quantity: number;
  alert_threshold: number;
  branch_id: string;
  last_restocked: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryData {
  name: string;
  category: string;
  quantity?: number;
  alert_threshold?: number;
  branch_id?: string;
}

// ==========================================
// Collection Tracking Types
// ==========================================

export interface CollectionTracking {
  id: string;
  staff_id: string;
  branch_id?: string;
  date: string;
  start_km: number | null;
  end_km: number | null;
  total_km: number | null;
  start_meter_image: string | null;
  end_meter_image: string | null;
  bike_image: string | null;
  visit_charge: number;
  per_km_rate: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  staff_firstname?: string;
  staff_lastname?: string;
  staff_petrol_price?: number;
  branch_name?: string;
}

export interface CreateCollectionTrackingData {
  start_km?: number;
  end_km?: number;
  start_meter_image?: string;
  end_meter_image?: string;
  bike_image?: string;
  visit_charge?: number;
  per_km_rate?: number;
  branch_id?: string;
  date?: string;
}

export interface CollectionTrackingFilters {
  staff_id?: string;
  branch_id?: string;
  date_from?: string;
  date_to?: string;
  date?: string;
}

export interface CollectionSalarySummary {
  total_days: string;
  total_km: string | null;
  km_payment: string | null;
  total_visit_charges: string | null;
  total_amount: string | null;
}

export interface StaffListItem {
  id: string;
  firstname: string;
  lastname: string;
  role: string;
}
