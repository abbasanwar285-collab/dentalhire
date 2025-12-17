-- ============================================
-- DentalHire - Complete Storage Setup
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- STEP 1: Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents', 
    'documents', 
    true,  -- Make it public for reading
    10485760,  -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 10485760;

-- STEP 2: Drop ALL existing policies on storage.objects for documents bucket
DO $$ 
DECLARE
    policy RECORD;
BEGIN
    FOR policy IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname LIKE '%documents%' OR policyname LIKE '%document%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy.policyname);
    END LOOP;
END $$;

-- Also drop by specific names we might have created
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;

-- STEP 3: Create new policies

-- Allow authenticated users to upload to their folder
CREATE POLICY "documents_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow ANYONE (public) to view/download documents
CREATE POLICY "documents_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Allow users to update their own documents
CREATE POLICY "documents_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY "documents_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- STEP 4: Verify the setup
SELECT 
    'Bucket exists' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') 
         THEN 'YES ✓' ELSE 'NO ✗' END as result
UNION ALL
SELECT 
    'Bucket is public',
    CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents' AND public = true) 
         THEN 'YES ✓' ELSE 'NO ✗' END
UNION ALL
SELECT 
    'Select policy exists',
    CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'documents_select_policy') 
         THEN 'YES ✓' ELSE 'NO ✗' END;
