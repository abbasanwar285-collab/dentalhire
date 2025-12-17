-- ============================================
-- DentalHire - Fix Storage Policies for Documents
-- Run this in Supabase SQL Editor
-- ============================================

-- Make documents bucket public for reading (so employers can view portfolio/resume after approval)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;

-- Allow anyone to view documents (public read access)
-- The application controls access through CV approval logic
CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
