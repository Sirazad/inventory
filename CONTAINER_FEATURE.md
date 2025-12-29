# Container Feature Implementation

## Overview
This document describes the implementation of the container feature for the inventory system. Containers (bags, pouches, backpacks, etc.) are special items that can hold other items.

## How It Works

### Database Schema
- Added `container_id` column to the `inventory` table
- This creates a self-referential foreign key relationship
- Items can reference another item as their container

### Backend Implementation

#### Entity Changes (`Inventory.java`)
- Added `containerId` field (Long) - stores the ID of the parent container
- Added `container` relationship (@ManyToOne) - JPA relationship to parent container
- Container relationship is lazy-loaded to avoid performance issues

#### Service Methods (`InventoryService.java`)
1. **getItemsInContainer()** - Retrieves all items contained in a specific container
2. **calculateTotalWeight()** - Recursively calculates total weight of a container:
   - Base weight: container's own weight × quantity
   - Plus: sum of all contained items' total weights (recursive)

#### API Endpoints (`InventoryController.java`)
1. `GET /api/characters/{characterId}/inventory/{inventoryId}/contents`
   - Returns list of items in a container
   
2. `GET /api/characters/{characterId}/inventory/{inventoryId}/total-weight`
   - Returns total weight of container including all contents

### Frontend Implementation

#### UI Features
1. **Container Selection**
   - When adding/editing an item, there's a dropdown to select a container
   - Only items with category "container" appear in the dropdown
   - Items cannot be their own container (filtered out when editing)

2. **Expandable/Collapsible Containers**
   - Container rows have a green background color
   - An expand/collapse button (▶/▼) appears in the category column
   - Clicking toggles the visibility of contained items
   - When expanded:
     - Loads container contents via API
     - Loads and displays total weight
     - Shows contained items with indentation (↳ symbol)
     - Contained items have gray background

3. **Weight Display**
   - Regular items: show weight per item
   - Containers (when expanded): show total weight including all contents in bold

## Usage Instructions

### Creating a Container

1. Go to the Categories page
2. Create a category called "container" (if not already exists)
3. Go to the Inventory page for a character
4. Click "Add New Item"
5. Fill in the form:
   - **Category**: Select "container"
   - **Item**: Name of the container (e.g., "Leather Backpack")
   - **Description**: Description of the container
   - **Weight**: The empty container's weight in kg
   - **Quantity**: How many containers (usually 1)
   - **Other fields**: As desired
6. Click "Add Item"

### Adding Items to a Container

1. Create or edit an item
2. In the form, find the "Container (optional)" dropdown
3. Select the container you want to place the item in
4. Save the item

### Viewing Container Contents

1. Find a container item in the inventory list (green background)
2. Click the ▶ button in the Category column
3. The container expands to show:
   - All items inside it (with gray background and ↳ prefix)
   - Total weight in the Weight column (in bold)

### Moving Items Between Containers

1. Edit the item you want to move
2. Change the "Container" dropdown to:
   - A different container (to move it)
   - "No container" (to remove it from all containers)
3. Save the item

## Technical Notes

### Performance Considerations
- Container contents are lazy-loaded (only when expanded)
- Total weight is calculated on-demand
- Note: Deep nesting of containers may cause performance issues due to recursive queries

### Validation
- Items cannot contain themselves (prevented in UI)
- No circular containment validation (e.g., A contains B, B contains A)
  - This should be added in a future enhancement

### Database Migration
- The `container_id` column is nullable
- Existing items will have `NULL` for `container_id` (not in any container)
- No data migration required

## Example Scenarios

### Scenario 1: Basic Backpack
1. Create container: "Leather Backpack" (category: container, weight: 2 kg)
2. Add items to backpack:
   - "Rope" (weight: 1 kg, container: Leather Backpack)
   - "Torches" (weight: 0.5 kg, quantity: 5, container: Leather Backpack)
3. Total weight displayed: 4.5 kg (2 kg backpack + 1 kg rope + 2.5 kg torches)

### Scenario 2: Nested Containers
1. Create "Large Backpack" (category: container, weight: 3 kg)
2. Create "Small Pouch" (category: container, weight: 0.2 kg, container: Large Backpack)
3. Add "Gold Coins" (weight: 0.01 kg, quantity: 100, container: Small Pouch)
4. Large Backpack total weight: 4.2 kg (3 kg + 0.2 kg + 1 kg coins)

## Future Enhancements

Potential improvements:
1. Add container capacity limits (max weight or volume)
2. Prevent circular containment relationships
3. Optimize recursive weight calculation with caching
4. Add visual indicators for container capacity utilization
5. Support bulk move operations (move multiple items at once)
6. Add container-specific filters in the inventory list
