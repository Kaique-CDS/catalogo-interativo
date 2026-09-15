-- Migration 004: Store Customization (colors, typography, slogan, banner)

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#18181B',
  ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS slogan TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT;