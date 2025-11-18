-- Script to create admin user
-- Run this in your MySQL database

USE youtubeai;

-- Create admin user if not exists
-- Email: admin@example.com
-- Password: admin123
INSERT INTO users (email, password, username, role, locked, created_at, updated_at)
VALUES (
  'admin@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- bcrypt hash of 'admin123'
  'Admin',
  'ADMIN',
  FALSE,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  role = 'ADMIN',
  locked = FALSE;

-- Create user preferences for admin if not exists
INSERT INTO user_preferences (user_id, dark_mode, language, created_at, updated_at)
SELECT id, TRUE, 'vi', NOW(), NOW()
FROM users
WHERE email = 'admin@example.com'
AND NOT EXISTS (
  SELECT 1 FROM user_preferences 
  WHERE user_id = (SELECT id FROM users WHERE email = 'admin@example.com')
);

-- Verify admin user was created
SELECT id, email, username, role, locked 
FROM users 
WHERE email = 'admin@example.com';

