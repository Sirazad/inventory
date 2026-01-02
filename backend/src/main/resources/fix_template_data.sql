-- Fix manually created template data to ensure all fields have proper values

-- Set default timestamps for templates that don't have them
UPDATE item_template 
SET created_at = NOW(), updated_at = NOW() 
WHERE created_at IS NULL OR updated_at IS NULL;

-- Set default is_container value for templates that don't have it
UPDATE item_template 
SET is_container = false 
WHERE is_container IS NULL;

-- Ensure quantity is set for all templates
UPDATE item_template 
SET quantity = 1 
WHERE quantity IS NULL OR quantity = 0;

-- Ensure description is set for all templates (use item name as fallback)
UPDATE item_template 
SET description = COALESCE(description, item, 'No description') 
WHERE description IS NULL OR description = '';

-- Display templates that might have issues
SELECT id, name, category, item, is_container, quantity, created_at, updated_at 
FROM item_template 
ORDER BY id;
