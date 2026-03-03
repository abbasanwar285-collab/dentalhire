-- ============================================
-- DentalHire - Secure Profile Update RPC
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS update_my_profile(text, text, text, text);

-- Create a secure RPC function to update the user's own profile
-- This uses SECURITY DEFINER to bypass RLS, but validates auth internally
CREATE OR REPLACE FUNCTION update_my_profile(
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS but runs as function owner (postgres)
AS $$
DECLARE
    current_user_auth_id UUID;
    result_row RECORD;
BEGIN
    -- Get the authenticated user's ID from Supabase Auth
    current_user_auth_id := auth.uid();
    
    IF current_user_auth_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Update only the provided fields (NULL = no change)
    UPDATE users
    SET
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        city = COALESCE(p_city, city),
        phone = COALESCE(p_phone, phone),
        updated_at = NOW()
    WHERE auth_id = current_user_auth_id
    RETURNING id, first_name, last_name, city, phone, avatar, updated_at INTO result_row;
    
    IF result_row IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found or update failed');
    END IF;
    
    -- Return the updated data
    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'id', result_row.id,
            'first_name', result_row.first_name,
            'last_name', result_row.last_name,
            'city', result_row.city,
            'phone', result_row.phone,
            'avatar', result_row.avatar,
            'updated_at', result_row.updated_at
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_my_profile(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Test query (optional, uncomment to test)
-- SELECT update_my_profile('TestFirst', 'TestLast', 'Baghdad', NULL);
