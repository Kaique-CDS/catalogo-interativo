-- Migration 003: Add SKU to vehicles and new fields to stores

-- Add SKU column to vehicles (unique short identifier)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;

-- Add financing WhatsApp number to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS whatsapp_financeiro TEXT;

-- Add opening hours to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS opening_hours TEXT DEFAULT 'Seg a Sex: 09h às 18h';

-- Create index on vehicles.sku for fast lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_sku ON vehicles(sku);

-- Auto-fill SKU for existing vehicles that don't have one
-- Uses a random 5-char alphanumeric code
UPDATE vehicles
SET sku = upper(substring(md5(random()::text || id::text), 1, 5))
WHERE sku IS NULL;