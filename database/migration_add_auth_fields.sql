-- Migration: Add authentication fields to users table
-- Run this after creating the initial schema

USE youtubeai;

-- Add new columns for authentication
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'USER' AFTER avatar_url,
ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE AFTER role,
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) NULL AFTER locked;

-- Update existing users to have USER role
UPDATE users SET role = 'USER' WHERE role IS NULL;

-- Create an admin user (password: admin123)
-- You can change the email and password hash as needed
INSERT INTO users (email, password, username, role, locked, created_at, updated_at)
VALUES (
  'admin@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: admin123
  'Admin',
  'ADMIN',
  FALSE,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE role = 'ADMIN';

-- Create user preferences for admin if not exists
INSERT INTO user_preferences (user_id, dark_mode, language, created_at, updated_at)
SELECT id, TRUE, 'vi', NOW(), NOW()
FROM users
WHERE email = 'admin@example.com'
AND NOT EXISTS (
  SELECT 1 FROM user_preferences WHERE user_id = (SELECT id FROM users WHERE email = 'admin@example.com')
);

