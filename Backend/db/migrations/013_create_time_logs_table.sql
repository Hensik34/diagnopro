-- Time Logs table for tracking user working hours
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clock_in TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    clock_out TIMESTAMP,
    total_hours DECIMAL(5, 2), -- calculated on clock out
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX idx_time_logs_clock_in ON time_logs(clock_in);
