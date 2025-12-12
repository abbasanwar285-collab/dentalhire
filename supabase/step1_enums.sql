-- ============================================
-- STEP 1: Add Enum Values ONLY
-- Run this FIRST, then click "Run" again for Step 2
-- ============================================

ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'dental_technician';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'secretary';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'media';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'company';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'lab';

-- After running this, verify with:
-- SELECT enum_range(NULL::user_type);
