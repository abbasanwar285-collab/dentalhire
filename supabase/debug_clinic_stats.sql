
-- Debugging Data Counts
-- Run this in Supabase SQL Editor to see what data exists

SELECT 'Total Users' as metric, COUNT(*) as count FROM users
UNION ALL
SELECT 'Users (Job Seekers)', COUNT(*) FROM users WHERE role = 'job_seeker'
UNION ALL
SELECT 'Users (Clinics)', COUNT(*) FROM users WHERE role = 'clinic'
UNION ALL
SELECT 'Total CVs (All Status)', COUNT(*) FROM cvs
UNION ALL
SELECT 'Active CVs (Visible to Clinics)', COUNT(*) FROM cvs WHERE status = 'active'
UNION ALL
SELECT 'Job Applications', COUNT(*) FROM job_applications;
