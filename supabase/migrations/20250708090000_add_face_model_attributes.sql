-- Migration: Add descriptive columns to face_models
-- Adds gender, ethnicity, eye_color, hair_color, hair_length, hair_style, age_range,
-- body_type, height_range, and glasses columns.
--
-- Generated on 2025-07-08

ALTER TABLE face_models
  ADD COLUMN gender text CHECK (gender IN ('Male', 'Female')),
  ADD COLUMN ethnicity text,
  ADD COLUMN eye_color text,
  ADD COLUMN hair_color text,
  ADD COLUMN hair_length text,
  ADD COLUMN hair_style text,
  ADD COLUMN age_range text,
  ADD COLUMN body_type text,
  ADD COLUMN height_range text,
  ADD COLUMN glasses text; 