-- Migration script for adding template feature support
-- Run this manually after deploying the code changes

-- Step 1: Add is_container column to inventory table (Hibernate will do this automatically)
-- This is just documentation of what Hibernate will do:
-- ALTER TABLE inventory ADD COLUMN is_container BOOLEAN DEFAULT false;

-- Step 2: Migrate existing inventory data to set is_container based on category
UPDATE inventory 
SET is_container = CASE 
    WHEN LOWER(category) = 'container' THEN true 
    ELSE false 
END
WHERE is_container IS NULL;

-- Step 3: Create indexes for performance (Hibernate may create these automatically)
-- If not created automatically, run these manually:
-- CREATE INDEX IF NOT EXISTS idx_inventory_is_container ON inventory(is_container);
-- CREATE INDEX IF NOT EXISTS idx_item_template_name ON item_template(name);
-- CREATE INDEX IF NOT EXISTS idx_item_template_is_container ON item_template(is_container);
-- CREATE INDEX IF NOT EXISTS idx_item_template_category ON item_template(category);
-- CREATE INDEX IF NOT EXISTS idx_template_content_template_id ON template_content(template_id);
-- CREATE INDEX IF NOT EXISTS idx_template_content_referenced_template_id ON template_content(referenced_template_id);

-- Note: The item_template and template_content tables will be created automatically by Hibernate
-- based on the @Entity annotations.
