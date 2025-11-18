-- Script to fix user roles (set ADMIN role for admin user, USER for others)
-- Run this if users have NULL roles

USE youtubeai;

-- Update admin user role
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'admin@example.com' AND (role IS NULL OR role = '');

-- Update all other users to USER role if NULL
UPDATE users 
SET role = 'USER' 
WHERE (role IS NULL OR role = '');

-- Verify
SELECT id, email, username, role, locked 
FROM users 
ORDER BY id;

