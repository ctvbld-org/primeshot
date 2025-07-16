-- Migration: Only admin users can insert or update styles

-- Enable RLS if not already enabled
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- Policy: Only admin users can insert
CREATE POLICY "Admins can insert styles"
  ON styles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

-- Policy: Only admin users can update
CREATE POLICY "Admins can update styles"
  ON styles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  ); 