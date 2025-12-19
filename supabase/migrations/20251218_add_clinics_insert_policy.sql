-- ============================================
-- Add INSERT policy for clinics table
-- ============================================

-- Allow authenticated users to insert a new clinic profile
-- Logic: A user can insert a row if the user_id in the row matches their own internal user id.
-- We need to check against the users table mapping (auth.uid() -> id).

CREATE POLICY "Users can create their own clinic profile" ON clinics
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );
