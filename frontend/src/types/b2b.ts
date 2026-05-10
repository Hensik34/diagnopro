// ==========================================
// B2B Lab Types
// ==========================================

export interface B2BLab {
  id: string;
  lab_name: string;
  lab_code: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  credit_limit: number;
  current_balance: number;
  lab_type: 'collection' | 'processing';
  owner_branch_id?: string;
  user_id?: string;
  logo_url?: string;
  show_processing_lab: boolean;
  custom_footer?: string;
  status: 'active' | 'inactive' | 'suspended';
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CreateB2BLabData {
  lab_name: string;
  lab_code: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  commission_type?: 'percentage' | 'fixed';
  commission_value?: number;
  credit_limit?: number;
  lab_type?: 'collection' | 'processing';
  owner_branch_id?: string;
  show_processing_lab?: boolean;
}

// ==========================================
// B2B Rate List Types
// ==========================================

export interface B2BRate {
  id: string;
  b2b_lab_id: string;
  test_id: string;
  collection_price: number;
  processing_price: number;
  test_name?: string;
  test_code?: string;
  category?: string;
  sample_type?: string;
  is_active: boolean;
}

// ==========================================
// B2B Order Types
// ==========================================

export type B2BOrderStatus =
  | 'pending' | 'sample_sent' | 'sample_received' | 'processing'
  | 'partial_complete' | 'completed' | 'report_released'
  | 'rejected' | 'cancelled';

export type B2BTestStatus =
  | 'pending' | 'processing' | 'completed' | 'approved' | 'rejected' | 'cancelled';

export interface B2BOrderTest {
  id: string;
  order_id: string;
  test_id: string;
  test_name: string;
  test_code?: string;
  category?: string;
  is_package: boolean;
  parent_test_id?: string;
  collection_price: number;
  processing_price: number;
  status: B2BTestStatus;
  expected_tat_hours?: number;
  expected_completion_at?: string;
  actual_completion_at?: string;
  is_tat_breached: boolean;
  report_id?: string;
  report_version: number;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface B2BOrder {
  id: string;
  order_code: string;
  source_lab_id: string;
  dest_branch_id?: string;
  patient_id?: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  patient_phone?: string;
  doctor_id?: string;
  doctor_commission: number;
  sample_id?: string;
  barcode?: string;
  sample_type?: string;
  container_type?: string;
  fasting_required: boolean;
  collected_by?: string;
  collection_time?: string;
  received_time?: string;
  temperature_notes?: string;
  status: B2BOrderStatus;
  total_collection_amount: number;
  total_processing_amount: number;
  margin_amount: number;
  show_processing_lab: boolean;
  notes?: string;
  rejection_reason?: string;
  version: number;
  created_at: string;
  updated_at: string;
  // Joined
  source_lab_name?: string;
  source_lab_code?: string;
  dest_branch_name?: string;
  test_count?: number;
  tat_breach_count?: number;
  tests?: B2BOrderTest[];
}

export interface CreateB2BOrderData {
  source_lab_id: string;
  dest_branch_id?: string;
  patient_id?: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  patient_phone?: string;
  doctor_id?: string;
  doctor_commission?: number;
  sample_type?: string;
  container_type?: string;
  fasting_required?: boolean;
  collection_time?: string;
  temperature_notes?: string;
  show_processing_lab?: boolean;
  notes?: string;
  tests: {
    test_id: string;
    test_name: string;
    is_package?: boolean;
    parent_order_test_id?: string;
    collection_price: number;
    processing_price: number;
    expected_tat_hours?: number;
  }[];
}

// ==========================================
// B2B Report Version Types
// ==========================================

export type B2BReportVersionStatus = 'draft' | 'uploaded' | 'approved' | 'released' | 'revised';

export interface B2BReportVersion {
  id: string;
  order_test_id: string;
  report_id?: string;
  version_number: number;
  file_url?: string;
  report_data?: Record<string, unknown>;
  status: B2BReportVersionStatus;
  uploaded_by?: string;
  uploaded_at?: string;
  approved_by?: string;
  approved_at?: string;
  released_by?: string;
  released_at?: string;
  revision_reason?: string;
  uploader_firstname?: string;
  uploader_lastname?: string;
  approver_firstname?: string;
  approver_lastname?: string;
  created_at: string;
}

// ==========================================
// B2B Payment Types
// ==========================================

export type B2BPaymentType = 'credit' | 'debit' | 'settlement' | 'advance' | 'adjustment';

export interface B2BPayment {
  id: string;
  b2b_lab_id: string;
  payment_type: B2BPaymentType;
  amount: number;
  running_balance: number;
  payment_mode?: string;
  reference_number?: string;
  order_id?: string;
  notes?: string;
  order_code?: string;
  creator_firstname?: string;
  creator_lastname?: string;
  created_at: string;
}

export interface RecordB2BPaymentData {
  b2b_lab_id: string;
  payment_type: B2BPaymentType;
  amount: number;
  payment_mode?: string;
  reference_number?: string;
  order_id?: string;
  notes?: string;
}

export interface B2BLabLedger {
  lab: {
    id: string;
    lab_name: string;
    lab_code: string;
    current_balance: number;
    credit_limit: number;
  };
  summary: {
    total_credits: number;
    total_settlements: number;
    total_advances: number;
    total_debits: number;
    total_transactions: number;
  };
  outstanding: number;
  credit_available: number;
}

// ==========================================
// B2B Dashboard Types
// ==========================================

export interface B2BDashboardStats {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  completed_orders: number;
  total_revenue: number;
  total_cost: number;
  total_margin: number;
  rejected_orders: number;
  total_receivable: number;
  total_payable: number;
  total_labs: number;
  tat_breaches: number;
  top_labs: { id: string; lab_name: string; lab_code: string; order_count: number; revenue: number }[];
  tat_breached_tests: B2BOrderTest[];
}

// ==========================================
// B2B Notification Types
// ==========================================

export interface B2BNotification {
  id: string;
  b2b_lab_id?: string;
  user_id?: string;
  type: string;
  title: string;
  message?: string;
  order_id?: string;
  is_read: boolean;
  channel: string;
  created_at: string;
}

// ==========================================
// B2B Audit Log Types
// ==========================================

export interface B2BAuditEntry {
  id: string;
  entity_type: string;
  entity_id: number;
  action: string;
  old_value?: string;
  new_value?: string;
  details?: Record<string, unknown>;
  performed_by?: string;
  performer_firstname?: string;
  performer_lastname?: string;
  performed_at: string;
  ip_address?: string;
}

// ==========================================
// B2B Filter Types
// ==========================================

export interface B2BOrderFilters {
  source_lab_id?: string;
  dest_branch_id?: string;
  status?: B2BOrderStatus;
  patient_id?: string;
  barcode?: string;
  date_from?: string;
  date_to?: string;
  owner_branch_id?: string;
  limit?: number;
  offset?: number;
}
