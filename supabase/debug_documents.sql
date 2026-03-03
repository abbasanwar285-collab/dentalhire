-- ============================================
-- Check document URLs for toqa kamal
-- Run this in Supabase SQL Editor
-- ============================================

SELECT 
    id,
    full_name,
    documents
FROM cvs
WHERE full_name = 'toqa kamal'
LIMIT 1;
