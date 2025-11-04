-- Migration: Update social_media_accounts table for advanced Instagram scraping
-- Date: 2025-01-20

-- Add new columns to social_media_accounts if they don't exist
ALTER TABLE social_media_accounts
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS profile_url TEXT,
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS scraping_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_mock_data BOOLEAN DEFAULT false;

-- Create social_media_metrics_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS social_media_metrics_history (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  avg_likes INTEGER DEFAULT 0,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  scraping_method VARCHAR(50),
  is_mock_data BOOLEAN DEFAULT false,
  FOREIGN KEY (account_id) REFERENCES social_media_accounts(id) ON DELETE CASCADE
);

-- Create index for faster history queries
CREATE INDEX IF NOT EXISTS idx_metrics_history_account_date
  ON social_media_metrics_history(account_id, recorded_at DESC);

-- Create index for cache lookups
CREATE INDEX IF NOT EXISTS idx_accounts_dj_platform
  ON social_media_accounts(dj_id, platform);

-- Create index for cache TTL queries
CREATE INDEX IF NOT EXISTS idx_accounts_last_scraped
  ON social_media_accounts(last_scraped_at DESC)
  WHERE last_scraped_at IS NOT NULL;

-- Update existing records with default values
UPDATE social_media_accounts
SET
  display_name = COALESCE(display_name, platform_username),
  profile_url = COALESCE(profile_url, 'https://' || platform || '.com/' || platform_username),
  is_verified = COALESCE(is_verified, false),
  is_private = COALESCE(is_private, false),
  is_mock_data = COALESCE(is_mock_data, false),
  scraping_method = COALESCE(scraping_method, 'legacy')
WHERE display_name IS NULL OR scraping_method IS NULL;

-- Migration completed
SELECT 'Migration 002 completed successfully' as status;
