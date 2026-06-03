-- ============================================
-- WHATSAPP INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'qr_ready', 'connected', 'session_expired', 'error')),
    phone_number VARCHAR(30),
    wa_jid VARCHAR(120),
    qr_expires_at TIMESTAMP,
    last_connected_at TIMESTAMP,
    last_disconnected_at TIMESTAMP,
    failure_reason TEXT,
    session_metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_branch_id ON whatsapp_sessions(branch_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number);

CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    event_key VARCHAR(80) NOT NULL,
    template_name VARCHAR(140) NOT NULL,
    template_body TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_branch_event ON whatsapp_templates(branch_id, event_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_enabled ON whatsapp_templates(is_enabled);

CREATE TABLE IF NOT EXISTS whatsapp_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    event_key VARCHAR(80) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notification_settings_branch_event ON whatsapp_notification_settings(branch_id, event_key);

INSERT INTO whatsapp_templates (id, branch_id, event_key, template_name, template_body, is_enabled, is_system, created_at, updated_at)
VALUES
(gen_random_uuid(), NULL, 'report_ready', 'Report Ready', 'Hello {{patient_name}}, your report for {{test_name}} is ready at {{branch_name}}. View report: {{report_link}}', TRUE, TRUE, NOW(), NOW()),
(gen_random_uuid(), NULL, 'report_approved', 'Report Approved', 'Hello {{patient_name}}, your report for {{test_name}} has been approved by our pathologist at {{branch_name}}. View report: {{report_link}}', TRUE, TRUE, NOW(), NOW()),
(gen_random_uuid(), NULL, 'appointment_confirmation', 'Appointment Confirmation', 'Hello {{patient_name}}, your appointment is confirmed at {{branch_name}} on {{appointment_date}} at {{appointment_time}}.', TRUE, TRUE, NOW(), NOW()),
(gen_random_uuid(), NULL, 'appointment_reminder', 'Appointment Reminder', 'Reminder: {{patient_name}}, you have an appointment at {{branch_name}} on {{appointment_date}} at {{appointment_time}}.', TRUE, TRUE, NOW(), NOW()),
(gen_random_uuid(), NULL, 'payment_confirmation', 'Payment Confirmation', 'Hello {{patient_name}}, we received your payment of {{payment_amount}} for {{test_name}} at {{branch_name}}. Thank you.', TRUE, TRUE, NOW(), NOW()),
(gen_random_uuid(), NULL, 'registration_confirmation', 'Registration Confirmation', 'Welcome {{patient_name}}. Your registration at {{branch_name}} is complete for tests: {{patient_tests}}. Thank you for choosing us!', TRUE, TRUE, NOW(), NOW())
ON CONFLICT (branch_id, event_key) DO NOTHING;
