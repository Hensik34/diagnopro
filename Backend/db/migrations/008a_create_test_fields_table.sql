-- Migration: Create test_fields table for dynamic test parameters
-- Date: 2026-04-01
-- Description: Each test can have multiple fields (parameters) defined by admin.
--              ReportEntry renders inputs dynamically from this table.

CREATE TABLE IF NOT EXISTS test_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    field_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    min_value DECIMAL(12, 4),
    max_value DECIMAL(12, 4),
    input_type VARCHAR(30) DEFAULT 'number',  -- number, text, select
    options TEXT,                               -- comma-separated options for select type
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_test_fields_test_id ON test_fields(test_id);
