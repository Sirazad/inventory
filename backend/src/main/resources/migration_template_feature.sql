-- ============================================================================
-- Migration script for Template Items/Containers Feature
-- ============================================================================
-- This script should be run manually if Hibernate auto-DDL is disabled,
-- or if you prefer explicit schema migration control.
--
-- Prerequisites: PostgreSQL database
-- Run as: psql -U inventory -d inventory -f migration_template_feature.sql
-- ============================================================================

-- Step 1: Create item_template table
CREATE TABLE IF NOT EXISTS item_template (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    item VARCHAR(255) NOT NULL,
    quality VARCHAR(100),
    description TEXT NOT NULL,
    price_in_copper BIGINT,
    quantity INTEGER NOT NULL,
    weight DOUBLE PRECISION,
    is_container BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create template_content table
CREATE TABLE IF NOT EXISTS template_content (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES item_template(id) ON DELETE CASCADE,
    referenced_template_id BIGINT REFERENCES item_template(id) ON DELETE CASCADE,
    quantity_override INTEGER,
    category VARCHAR(100),
    item VARCHAR(255),
    quality VARCHAR(100),
    description TEXT,
    price_in_copper BIGINT,
    quantity INTEGER,
    weight DOUBLE PRECISION,
    CONSTRAINT check_content_type CHECK (
        (referenced_template_id IS NOT NULL) OR 
        (referenced_template_id IS NULL AND category IS NOT NULL AND item IS NOT NULL)
    )
);

-- Step 3: Add is_container column to inventory table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory' AND column_name = 'is_container'
    ) THEN
        ALTER TABLE inventory ADD COLUMN is_container BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Step 4: Migrate existing inventory data to set is_container based on category
UPDATE inventory 
SET is_container = CASE 
    WHEN LOWER(category) = 'container' THEN true 
    ELSE false 
END
WHERE is_container IS NULL OR is_container = false;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_item_template_name ON item_template(name);
CREATE INDEX IF NOT EXISTS idx_item_template_is_container ON item_template(is_container);
CREATE INDEX IF NOT EXISTS idx_item_template_category ON item_template(category);
CREATE INDEX IF NOT EXISTS idx_template_content_template_id ON template_content(template_id);
CREATE INDEX IF NOT EXISTS idx_template_content_referenced_template_id ON template_content(referenced_template_id);
CREATE INDEX IF NOT EXISTS idx_inventory_is_container ON inventory(is_container);

-- ============================================================================
-- Migration complete!
-- ============================================================================
-- Note: If using Hibernate with spring.jpa.hibernate.ddl-auto=update,
-- these tables will be created automatically on application startup.
-- This manual script is provided for production environments or when
-- you prefer explicit schema control.
-- ============================================================================
