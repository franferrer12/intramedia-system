-- Migration: Notifications System
-- Description: Create notifications table for in-app notifications
-- Version: 010
-- Date: 2025-10-27

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_dj_id ON notifications(dj_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_dj_read ON notifications(dj_id, read);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'In-app notifications for DJs about social media metrics, events, and system alerts';
COMMENT ON COLUMN notifications.type IS 'Notification type: follower_milestone, engagement_increase, engagement_decrease, follower_drop, viral_post, etc.';
COMMENT ON COLUMN notifications.data IS 'Additional notification data in JSON format';
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read by the user';

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO your_app_user;
