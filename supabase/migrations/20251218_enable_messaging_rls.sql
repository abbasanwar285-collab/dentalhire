
-- Enable RLS for messaging tables (already enabled, but good to be safe)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations Policies

-- Allow authenticated users to create new conversations
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid()::text = ANY(participants::text[]));

-- Allow participants to update conversations (e.g., last_message_id, unread_count)
CREATE POLICY "Participants can update conversations" ON conversations
    FOR UPDATE USING (auth.uid()::text = ANY(participants::text[]));

-- Messages Policies

-- Allow participants to insert messages into their conversations
CREATE POLICY "Participants can insert messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        conversation_id IN (
            SELECT id FROM conversations WHERE auth.uid()::text = ANY(participants::text[])
        )
    );

-- Allow participants to update messages (e.g., mark as read)
CREATE POLICY "Participants can update messages" ON messages
    FOR UPDATE USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE auth.uid()::text = ANY(participants::text[])
        )
    );
