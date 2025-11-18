-- Script to reset admin password
-- This will update the password hash for admin@example.com
-- You need to get the new hash from the /api/dev/hash-password endpoint

USE youtubeai;

-- Option 1: Use this hash for password "admin123" (generated with BCrypt)
-- Run this after getting hash from /api/dev/hash-password?password=admin123
UPDATE users 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    updated_at = NOW()
WHERE email = 'admin@example.com';

-- Option 2: If the above doesn't work, use this endpoint to reset:
-- POST http://localhost:8080/api/dev/reset-admin-password?newPassword=admin123

-- Verify
SELECT id, email, username, role, locked, 
       LEFT(password, 20) as password_hash_preview
FROM users 
WHERE email = 'admin@example.com';

