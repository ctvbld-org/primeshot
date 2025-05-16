-- Enable realtime for the styles table
ALTER PUBLICATION supabase_realtime ADD TABLE styles;

-- Make sure RLS is enabled
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- Add policy for realtime subscriptions if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'styles' 
        AND policyname = 'Enable realtime for users own styles'
    ) THEN
        CREATE POLICY "Enable realtime for users own styles"
            ON styles
            FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);
    END IF;
END
$$; 