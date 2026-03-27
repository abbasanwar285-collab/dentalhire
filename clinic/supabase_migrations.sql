-- Migration SQL to add missing columns to inventory_items table
-- Run this in your Supabase SQL Editor for the MAIN database

-- Add image column
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS image text;

-- Add min_stock column
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS min_stock integer DEFAULT 5;

-- Add auto_decrement column
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS auto_decrement boolean DEFAULT false;

-- Add consumption_rate column
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS consumption_rate numeric DEFAULT 0;

-- Update existing rows to have default values
UPDATE public.inventory_items 
SET min_stock = 5 
WHERE min_stock IS NULL;

UPDATE public.inventory_items 
SET auto_decrement = false 
WHERE auto_decrement IS NULL;

UPDATE public.inventory_items 
SET consumption_rate = 0 
WHERE consumption_rate IS NULL;
