-- Migration: Add admin policies for style_scenes, style_wardrobes, and style_colors tables
-- Date: 2025-07-17
-- Purpose: Allow admin users to INSERT, UPDATE, and DELETE records in style option tables

-- Add INSERT policies for admin users
CREATE POLICY "Admins can insert style_scenes"
  ON style_scenes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

CREATE POLICY "Admins can insert style_wardrobes"
  ON style_wardrobes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

CREATE POLICY "Admins can insert style_colors"
  ON style_colors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

-- Add UPDATE policies for admin users
CREATE POLICY "Admins can update style_scenes"
  ON style_scenes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

CREATE POLICY "Admins can update style_wardrobes"
  ON style_wardrobes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

CREATE POLICY "Admins can update style_colors"
  ON style_colors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

-- Add DELETE policies for admin users
CREATE POLICY "Admins can delete style_scenes"
  ON style_scenes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

CREATE POLICY "Admins can delete style_wardrobes"
  ON style_wardrobes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

CREATE POLICY "Admins can delete style_colors"
  ON style_colors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

-- Grant necessary permissions to authenticated users for admin operations
GRANT INSERT, UPDATE, DELETE ON style_scenes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON style_wardrobes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON style_colors TO authenticated; 