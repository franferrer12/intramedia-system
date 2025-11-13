-- ============================================
-- MIGRATION 003: Authentication & OAuth System
-- Purpose: Add user authentication, OAuth tokens, and reporting
-- Created: 2025-10-20
-- ============================================

-- ============================================
-- TABLE: users
-- Purpose: System users (admins, DJs, staff)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'dj', 'staff')),
  dj_id INTEGER REFERENCES djs(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_dj_role CHECK (
    (role = 'dj' AND dj_id IS NOT NULL) OR
    (role != 'dj' AND dj_id IS NULL)
  )
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_dj_id ON users(dj_id);

-- ============================================
-- TABLE: oauth_tokens
-- Purpose: Store encrypted OAuth tokens for social media
-- ============================================
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube')),
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_at TIMESTAMP,
  scope TEXT,
  platform_user_id VARCHAR(255),
  platform_username VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_refreshed TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dj_id, platform)
);

-- Indexes for oauth_tokens table
CREATE INDEX idx_oauth_tokens_dj_id ON oauth_tokens(dj_id);
CREATE INDEX idx_oauth_tokens_platform ON oauth_tokens(platform);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
CREATE INDEX idx_oauth_tokens_is_active ON oauth_tokens(is_active);

-- ============================================
-- TABLE: social_connections
-- Purpose: Track connection status (OAuth vs Scraping)
-- ============================================
CREATE TABLE IF NOT EXISTS social_connections (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube')),
  connection_type VARCHAR(20) NOT NULL CHECK (connection_type IN ('oauth', 'scraping')),
  is_active BOOLEAN DEFAULT true,
  username VARCHAR(255),
  last_sync TIMESTAMP,
  last_sync_status VARCHAR(20) CHECK (last_sync_status IN ('success', 'error', 'pending')),
  sync_error_message TEXT,
  sync_retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dj_id, platform)
);

-- Indexes for social_connections table
CREATE INDEX idx_social_connections_dj_id ON social_connections(dj_id);
CREATE INDEX idx_social_connections_platform ON social_connections(platform);
CREATE INDEX idx_social_connections_type ON social_connections(connection_type);
CREATE INDEX idx_social_connections_is_active ON social_connections(is_active);
CREATE INDEX idx_social_connections_last_sync ON social_connections(last_sync);

-- ============================================
-- TABLE: monthly_reports
-- Purpose: Store generated monthly reports
-- ============================================
CREATE TABLE IF NOT EXISTS monthly_reports (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  instagram_data JSONB DEFAULT '{}',
  facebook_data JSONB DEFAULT '{}',
  tiktok_data JSONB DEFAULT '{}',
  youtube_data JSONB DEFAULT '{}',
  total_followers INTEGER DEFAULT 0,
  total_engagement NUMERIC(10, 2) DEFAULT 0,
  engagement_rate NUMERIC(5, 2) DEFAULT 0,
  growth_percentage NUMERIC(5, 2) DEFAULT 0,
  top_post_id VARCHAR(255),
  pdf_url TEXT,
  excel_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'error')),
  error_message TEXT,
  generated_at TIMESTAMP,
  sent_to_dj BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dj_id, month, year)
);

-- Indexes for monthly_reports table
CREATE INDEX idx_monthly_reports_dj_id ON monthly_reports(dj_id);
CREATE INDEX idx_monthly_reports_month_year ON monthly_reports(month, year);
CREATE INDEX idx_monthly_reports_status ON monthly_reports(status);
CREATE INDEX idx_monthly_reports_generated_at ON monthly_reports(generated_at);

-- ============================================
-- TABLE: audit_log
-- Purpose: Track all admin actions for security
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_log table
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============================================
-- TABLE: notification_preferences
-- Purpose: DJ notification settings
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE UNIQUE,
  email_monthly_report BOOLEAN DEFAULT true,
  email_milestone_alert BOOLEAN DEFAULT true,
  email_weekly_summary BOOLEAN DEFAULT false,
  email_engagement_drop BOOLEAN DEFAULT true,
  milestone_1k_notified BOOLEAN DEFAULT false,
  milestone_5k_notified BOOLEAN DEFAULT false,
  milestone_10k_notified BOOLEAN DEFAULT false,
  milestone_50k_notified BOOLEAN DEFAULT false,
  milestone_100k_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for notification_preferences table
CREATE INDEX idx_notification_preferences_dj_id ON notification_preferences(dj_id);

-- ============================================
-- TRIGGERS: Update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_connections_updated_at BEFORE UPDATE ON social_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_reports_updated_at BEFORE UPDATE ON monthly_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT DATA: Create default admin user
-- ============================================
-- Password: 'admin123' (CHANGE THIS IN PRODUCTION!)
-- Hash generated with bcrypt, salt rounds: 10
INSERT INTO users (email, password_hash, role, is_active, email_verified)
VALUES (
  'admin@intramedia.com',
  '$2b$10$WRlUhXAkIjTp9pLt4ieGbe6t/pCfqFRCovO37TJHnQbrReTpsAA46', -- Password: admin123
  'admin',
  true,
  true
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE users IS 'System users with role-based access';
COMMENT ON TABLE oauth_tokens IS 'Encrypted OAuth tokens for social media platforms';
COMMENT ON TABLE social_connections IS 'Tracks if connection is OAuth or scraping fallback';
COMMENT ON TABLE monthly_reports IS 'Auto-generated monthly reports with PDF/Excel exports';
COMMENT ON TABLE audit_log IS 'Security audit trail of admin actions';
COMMENT ON TABLE notification_preferences IS 'DJ email notification settings';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
