-- ============================================
-- DentalHire - Storage Buckets Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('documents', 'documents', false),
    ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for avatars bucket (public)
-- ============================================

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================
-- Storage Policies for documents bucket (private)
-- ============================================

-- Allow authenticated users to upload documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- Storage Policies for logos bucket (public)
-- ============================================

-- Allow authenticated users to upload logos
CREATE POLICY "Users can upload their own logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their logos
CREATE POLICY "Users can update their own logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their logos
CREATE POLICY "Users can delete their own logo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to logos
CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');
