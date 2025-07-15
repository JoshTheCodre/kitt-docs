
-- Complete database setup script
-- Run this to set up the entire database

-- Enable necessary extensions
\i scripts/create-tables.sql
\i scripts/create-policies.sql
\i scripts/create-storage.sql
\i scripts/functions.sql
\i scripts/seed-data.sql

-- Verify setup
SELECT 'Database setup completed successfully!' as status;

-- Show table counts
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 
  'resources' as table_name, COUNT(*) as count FROM resources
UNION ALL
SELECT 
  'wallets' as table_name, COUNT(*) as count FROM wallets
UNION ALL
SELECT 
  'transactions' as table_name, COUNT(*) as count FROM transactions
UNION ALL
SELECT 
  'downloads' as table_name, COUNT(*) as count FROM downloads
UNION ALL
SELECT 
  'reviews' as table_name, COUNT(*) as count FROM reviews
UNION ALL
SELECT 
  'bookmarks' as table_name, COUNT(*) as count FROM bookmarks;
