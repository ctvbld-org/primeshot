-- Migration: Add DELETE policy for admin users on styles table

-- Policy: Only admin users can delete styles
CREATE POLICY "Admins can delete styles"
  ON styles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  ); 