-- Migration to add staff_id to reports
ALTER TABLE reports ADD COLUMN staff_id UUID REFERENCES users(id) ON DELETE SET NULL;
