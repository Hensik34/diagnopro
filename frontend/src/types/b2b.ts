// ==========================================
// B2B Partner Lab Types (Simplified)
// ==========================================

export interface B2BLab {
  id: string;
  lab_name: string;
  lab_code: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  status: 'active' | 'inactive' | 'suspended';
  owner_branch_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateB2BLabData {
  lab_name: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  owner_branch_id?: string;
}
