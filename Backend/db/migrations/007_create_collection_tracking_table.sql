-- Migration: Create sample_collection_tracking table
-- Purpose: KM tracking and billing for field staff

CREATE TABLE IF NOT EXISTS sample_collection_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_km NUMERIC(10, 2),
  end_km NUMERIC(10, 2),
  total_km NUMERIC(10, 2) GENERATED ALWAYS AS (COALESCE(end_km, 0) - COALESCE(start_km, 0)) STORED,
  start_meter_image TEXT,
  end_meter_image TEXT,
  bike_image TEXT,
  visit_charge NUMERIC(10, 2) DEFAULT 0,
  per_km_rate NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(staff_id, date)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_collection_tracking_staff_date ON sample_collection_tracking(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_collection_tracking_date ON sample_collection_tracking(date);
CREATE INDEX IF NOT EXISTS idx_collection_tracking_branch ON sample_collection_tracking(branch_id);
