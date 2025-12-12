
-- حل اللغز: إزالة الوظائف المكررة
-- Puzzle Solver: Remove duplicate active jobs

WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
            PARTITION BY clinic_id, title, status 
            ORDER BY created_at DESC
         ) as rnum
  FROM jobs
  WHERE status = 'active'
)
-- Delete all except the most recent one (rnum = 1)
DELETE FROM jobs
WHERE id IN (
  SELECT id FROM duplicates WHERE rnum > 1
);
