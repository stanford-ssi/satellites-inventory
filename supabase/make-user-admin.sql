-- ====================================
-- MAKE USER ADMIN SCRIPT
-- ====================================
-- Run this in your Supabase SQL Editor to make a user an admin

-- OPTION 1: Make user admin by email
-- Replace 'your-email@example.com' with the actual user's email
UPDATE users
SET role = 'admin'
WHERE email = 'lcahilly@stanford.edu';

-- OPTION 2: Make user admin by name
-- Replace 'Your Name' with the actual user's name
-- UPDATE users
-- SET role = 'admin'
-- WHERE name = 'Your Name';

-- OPTION 3: Make the first user admin (useful for initial setup)
-- UPDATE users
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM users ORDER BY created_at LIMIT 1);

-- Check results
SELECT id, name, email, role, created_at
FROM users
ORDER BY created_at;

-- To see all current admin users:
SELECT name, email, role
FROM users
WHERE role = 'admin';