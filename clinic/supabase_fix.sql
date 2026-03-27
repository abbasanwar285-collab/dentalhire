-- ================================================
-- COMPREHENSIVE CLINIC DATABASE FIX SCRIPT
-- Run this in Supabase SQL Editor
-- Date: 2026-02-15
-- ================================================

-- ================================================
-- Fix 1: Create 'profiles' table if not exists
-- (Used by auth.ts signIn but missing from schema)
-- ================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text NOT NULL DEFAULT 'doctor' CHECK (role IN ('admin', 'doctor', 'assistant')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow all access (matches existing RLS policies in the project)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Enable all access for all users'
  ) THEN
    CREATE POLICY "Enable all access for all users"
      ON public.profiles FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Auto-create profile on sign up (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Staff'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'doctor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ================================================
-- Fix 2: Add 'updated_at' to appointments table
-- (Needed for sync conflict tracking)
-- ================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;


-- ================================================
-- Fix 3: Widen the 'status' CHECK constraint
-- Ensure all valid status values are accepted
-- ================================================
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('confirmed', 'arrived', 'completed', 'cancelled', 'pending'));


-- ================================================
-- Fix 4: Add 'timestamp' column to expenses if missing
-- (The app sends timestamp but column may not exist)
-- ================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN "timestamp" bigint;
  END IF;
END $$;


-- ================================================
-- Fix 5: Enable realtime for profiles table
-- ================================================
DO $$
BEGIN
  -- Add profiles to realtime publication if not already there
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;


-- ================================================
-- Verification: Check all tables exist
-- ================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
