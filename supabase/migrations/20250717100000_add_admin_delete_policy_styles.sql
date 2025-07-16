-- Migration: Add DELETE policy for admin users on styles table

-- Policy: Allow admin users to read styles (needed for DELETE operations)
CREATE POLICY "Admins can read styles"
  ON styles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );