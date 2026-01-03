# Template Items/Containers Feature - Setup Guide

## Overview

The template feature allows you to create reusable item templates and container templates (e.g., "Healing Kit" with pre-configured medicines) that can be instantiated into character inventories.

## Quick Start

### Option 1: Automatic Setup (Recommended for Development)

If you're using the default configuration with `spring.jpa.hibernate.ddl-auto=update`:

1. **Restart the Spring Boot application**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. Hibernate will automatically create the required tables:
   - `item_template`
   - `template_content`
   - Add `is_container` column to `inventory` table

3. **Run the data migration** (one-time only)
   ```bash
   psql -U inventory -d inventory -c "UPDATE inventory SET is_container = CASE WHEN LOWER(category) = 'container' THEN true ELSE false END WHERE is_container IS NULL OR is_container = false;"
   ```

### Option 2: Manual Setup (Recommended for Production)

If you prefer explicit schema control:

1. **Run the migration script**
   ```bash
   cd backend/src/main/resources
   psql -U inventory -d inventory -f migration_template_feature.sql
   ```

2. **Restart the Spring Boot application**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

## Troubleshooting

### Error: 500 Internal Server Error on `/api/templates/search`

**Cause**: The database tables don't exist yet.

**Solution**:
1. Check if tables exist:
   ```sql
   \dt item_template
   \dt template_content
   \d inventory
   ```

2. If tables don't exist, run the migration script:
   ```bash
   psql -U inventory -d inventory -f backend/src/main/resources/migration_template_feature.sql
   ```

3. Restart the application

### Error: Column "is_container" does not exist in table "inventory"

**Cause**: The `is_container` column hasn't been added to the existing `inventory` table.

**Solution**:
```sql
ALTER TABLE inventory ADD COLUMN is_container BOOLEAN DEFAULT false;
UPDATE inventory SET is_container = CASE WHEN LOWER(category) = 'container' THEN true ELSE false END;
```

## Database Schema

### New Tables

**`item_template`** - Stores template definitions
- `id`: Primary key
- `name`: Unique template name
- `category`: Item category (e.g., "potion", "weapon")
- `item`: Item name (e.g., "Health Potion")
- `quality`: Optional quality indicator
- `description`: Item description
- `price_in_copper`: Price in copper (nullable)
- `quantity`: Default quantity
- `weight`: Item weight (nullable)
- `is_container`: Boolean flag for container templates
- `created_at`, `updated_at`: Timestamps

**`template_content`** - Stores items within container templates
- `id`: Primary key
- `template_id`: FK to parent template
- `referenced_template_id`: FK to referenced template (for reusable templates)
- `quantity_override`: Override quantity for referenced templates
- `category`, `item`, `quality`, `description`, `price_in_copper`, `quantity`, `weight`: Direct item definition fields (used when not referencing a template)

### Modified Tables

**`inventory`** - Added `is_container` column
- `is_container`: Boolean flag (replaces category-based container detection)

## API Endpoints

### Template Management

- `GET /api/templates` - List all templates (with pagination)
- `GET /api/templates/search?name={name}&isContainer={true|false}&category={category}` - Search templates
- `GET /api/templates/{id}` - Get template details
- `POST /api/templates` - Create new template
- `PUT /api/templates/{id}` - Update template
- `DELETE /api/templates/{id}` - Delete template (with reference validation)

### Inventory Integration

- `POST /api/templates/{templateId}/add-to-character/{characterId}` - Instantiate template to character inventory

## Frontend Routes

- `/templates` - Template management page (list, search, filter, delete)
- `/templates/new` - Create new template
- `/templates/:id/edit` - Edit existing template
- `/characters/:id/inventory` - Enhanced inventory page with template integration

## Features

✅ **Template Reusability**: Container templates can reference other templates  
✅ **Recursive Resolution**: Unlimited nesting depth support  
✅ **Circular Reference Prevention**: Automatic validation  
✅ **Pagination**: Default 20 items per page, max 100  
✅ **Advanced Search**: Filter by name, category, container type  
✅ **Safety**: Template deletion blocked if referenced by other templates  

## Example Workflows

### Creating a Simple Item Template

1. Navigate to `/templates`
2. Click "Create New Template"
3. Fill in: Name="Health Potion", Category="potion", Item="Health Potion", Description="Restores 50 HP", Quantity=1
4. Save

### Creating a Container Template with References

1. Create individual item templates first (e.g., "Health Potion", "Mana Potion")
2. Navigate to `/templates`
3. Click "Create New Template"
4. Fill in: Name="Potion Bag", Category="container", Item="Leather Pouch", Description="Bag for potions"
5. Check "Is Container"
6. In "Container Contents", add:
   - Reference "Health Potion" template with quantity override = 2
   - Reference "Mana Potion" template with quantity override = 3
7. Save

### Using a Template in Inventory

1. Navigate to character inventory
2. Click "Add Item"
3. Switch to "From Template" tab
4. Search for template (e.g., "Potion Bag")
5. Preview shows nested contents
6. Click "Add to Inventory"
7. Template is instantiated with all nested items created

## Notes

- All templates are system-wide (no user ownership)
- Templates are lightweight definitions; full metadata added on instantiation
- Container detection now uses explicit `is_container` boolean field
- Migration script handles existing inventory data automatically
