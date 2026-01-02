-- ============================================================================
-- Fix description column type from bytea to TEXT
-- ============================================================================
-- This fixes the error: "function lower(bytea) does not exist"
-- Run as: psql -U inventory -d inventory -f fix_description_column_type.sql
-- ============================================================================

-- Check current column type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'item_template' AND column_name = 'description';

-- Fix item_template.description column type
ALTER TABLE item_template 
ALTER COLUMN description TYPE TEXT USING description::text;

-- Fix template_content.description column type (if exists and wrong type)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'template_content' 
        AND column_name = 'description' 
        AND data_type = 'bytea'
    ) THEN
        ALTER TABLE template_content 
        ALTER COLUMN description TYPE TEXT USING description::text;
    END IF;
END $$;

-- Verify the fix
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('item_template', 'template_content') 
AND column_name = 'description';

-- ============================================================================
-- Fix complete! Restart your backend application.
-- ============================================================================
