# Template Items/Containers Architecture Design

## Problem Statement

Users want the ability to:
1. Create template items/containers (e.g., "Healing Kit" - a pre-configured pouch with medicines)
2. Create prefilled containers (e.g., a pouch that automatically includes certain medicines in given quantities)
3. When adding items, choose between "Templates" or "Custom" creation
4. Search for templates by name and add them to character inventory

## Design Options

---

## Option 1: User-Owned Templates with Database Tables

### Description
Create dedicated database tables for templates that are owned by users. Each template can define a single item or a container with nested items.

### Database Schema
```
item_template:
- id (PK)
- user_id (FK, nullable) - null = system template, non-null = user template
- name (e.g., "Healing Kit", "Adventurer's Backpack")
- category
- item
- quality
- description
- price_in_copper
- quantity
- weight
- is_container (boolean)
- created_at
- updated_at

template_item:
- id (PK)
- template_id (FK)
- category
- item
- quality
- description
- price_in_copper
- quantity
- weight
- created_at
```

### Backend Architecture
```
Entities: ItemTemplate, TemplateItem
Repositories: ItemTemplateRepository, TemplateItemRepository
Service: TemplateService
  - searchTemplates(username, name) -> List<TemplateResponse>
  - getTemplate(username, id) -> TemplateResponse
  - createTemplate(username, request) -> TemplateResponse
  - deleteTemplate(username, id)
  - addTemplateToInventory(username, characterId, templateId) -> InventoryResponse
  
Controller: TemplateController
  - GET /api/templates?name={name}
  - GET /api/templates/{id}
  - POST /api/templates
  - DELETE /api/templates/{id}
  - POST /api/templates/{templateId}/add-to-character/{characterId}
```

### Frontend Architecture
```
UI Flow:
1. User clicks "Add New Item"
2. Toggle appears: [Custom] [Template]
3. If Custom: Show existing form
4. If Template:
   - Show search box for template name
   - Display list of matching templates
   - User selects template
   - Show template preview (with items if container)
   - Confirm to add to inventory
   
Optional: "Save as Template" button in custom form
```

### Advantages
✅ **Clean separation** - Templates are separate from inventory items
✅ **Reusability** - Templates can be used across multiple characters
✅ **System templates** - Can create global templates (user_id = null) for common items
✅ **User templates** - Users can create their own custom templates
✅ **Efficient** - No duplication when instantiating templates
✅ **Flexible** - Can have both simple items and complex containers as templates
✅ **Search capability** - Easy to search and filter templates by name

### Weaknesses
❌ **More complex** - Requires new database tables, entities, services
❌ **Data duplication** - Template data vs instance data
❌ **Maintenance** - If template structure changes, existing instances aren't affected (could be good or bad)
❌ **No versioning** - Templates don't track versions (if template changes, old instances don't update)

### Implementation Effort
- **Backend**: ~4 hours (entities, repos, service, controller, testing)
- **Frontend**: ~3 hours (UI components, API integration, testing)
- **Total**: ~7 hours

---

## Option 2: JSON-Based Template Configuration

### Description
Store templates as JSON configuration files or in a simple key-value table. Parse and instantiate them on demand.

### Database Schema
```
item_template:
- id (PK)
- user_id (FK, nullable)
- name
- template_json (JSONB) - stores entire template structure
- created_at
- updated_at
```

Example JSON:
```json
{
  "category": "container",
  "item": "Healing Kit",
  "description": "A leather pouch with medical supplies",
  "quantity": 1,
  "weight": 0.5,
  "items": [
    {
      "category": "medicine",
      "item": "Bandage",
      "quantity": 5,
      "weight": 0.01
    },
    {
      "category": "medicine",
      "item": "Healing Salve",
      "quantity": 3,
      "weight": 0.05
    }
  ]
}
```

### Advantages
✅ **Simpler schema** - Only one table needed
✅ **Flexible structure** - JSON can handle any item structure
✅ **Easy to import/export** - Templates can be shared as JSON files
✅ **Version control friendly** - Templates can be stored in code repository
✅ **Quick prototyping** - Easy to add new template fields without migrations

### Weaknesses
❌ **No referential integrity** - Can't use foreign keys within JSON
❌ **Search limitations** - Searching within JSON is less efficient
❌ **Type safety** - JSON validation is runtime, not compile-time
❌ **Database queries** - Harder to query JSON fields efficiently
❌ **No SQL joins** - Can't easily join template items with other tables

### Implementation Effort
- **Backend**: ~3 hours (simpler but requires JSON parsing logic)
- **Frontend**: ~3 hours (same UI)
- **Total**: ~6 hours

---

## Option 3: Clone Existing Items as Templates

### Description
Don't create separate template tables. Instead, mark certain inventory items as "template" and allow cloning them.

### Database Schema
```
inventory:
- (existing fields...)
- is_template (boolean, default false)
- template_name (nullable string)
```

### How It Works
1. User creates an item normally
2. Option to "Save as Template" marks is_template=true and assigns a template_name
3. When adding from template, search for items where is_template=true
4. Clone the item (and nested items if container) into character's inventory

### Advantages
✅ **Simplest implementation** - Reuses existing structure
✅ **No new tables** - Just add two columns
✅ **Consistency** - Templates are just items
✅ **Live examples** - Templates are actual working items
✅ **Quick implementation** - Minimal code changes

### Weaknesses
❌ **Conceptual confusion** - Templates and items mixed together
❌ **Character association** - Templates belong to a character (awkward)
❌ **Global templates difficult** - Hard to create system-wide templates
❌ **Clutter** - Template items appear in someone's inventory
❌ **Deletion complexity** - What if template item is deleted?
❌ **Performance** - Searching across all inventory items is slower

### Implementation Effort
- **Backend**: ~2 hours
- **Frontend**: ~2 hours
- **Total**: ~4 hours

---

## Option 4: Hybrid - Templates + Inheritance

### Description
Combine Option 1 with template versioning and instance tracking. Templates can be updated, and instances can optionally update from template.

### Database Schema
```
item_template: (same as Option 1)
- version (integer)

template_item: (same as Option 1)

inventory:
- (existing fields...)
- template_id (FK, nullable) - tracks which template this came from
- template_version (integer, nullable) - which version was used
```

### Advantages
✅ **All benefits of Option 1**
✅ **Traceability** - Know which items came from which templates
✅ **Update capability** - Could implement "sync with template" feature
✅ **Analytics** - Can track template usage
✅ **Flexibility** - Items can be independent or linked to templates

### Weaknesses
❌ **Most complex** - Requires most code and logic
❌ **Update complexity** - Syncing instances with updated templates is tricky
❌ **User confusion** - "Should I update from template?" decisions
❌ **Data migration** - Existing items have no template_id

### Implementation Effort
- **Backend**: ~6 hours
- **Frontend**: ~4 hours
- **Total**: ~10 hours

---

## Option 5: External Template Library

### Description
Templates are defined in code or configuration files, not in database. Pre-seed common templates on application startup.

### Implementation
```java
// TemplateLibrary.java
public class TemplateLibrary {
    public static final List<Template> SYSTEM_TEMPLATES = List.of(
        new Template("Healing Kit", "container", ...)
            .withItem("Bandage", 5)
            .withItem("Healing Salve", 3),
        new Template("Adventurer's Pack", "container", ...)
            .withItem("Rope", 1)
            .withItem("Torch", 5)
    );
}
```

### Advantages
✅ **Version controlled** - Templates are in source code
✅ **No database** - No extra tables needed
✅ **Fast** - Templates loaded in memory
✅ **Easy testing** - Templates are code, easy to test
✅ **Deployment** - New templates deployed with application

### Weaknesses
❌ **No user templates** - Users can't create their own
❌ **Code changes** - Adding templates requires code deployment
❌ **Static** - Templates can't be modified at runtime
❌ **Limited** - Only works for system templates
❌ **Not flexible** - Doesn't solve the user's need fully

### Implementation Effort
- **Backend**: ~2 hours
- **Frontend**: ~2 hours
- **Total**: ~4 hours

---

## Recommendation Matrix

| Criteria | Option 1 | Option 2 | Option 3 | Option 4 | Option 5 |
|----------|----------|----------|----------|----------|----------|
| User templates | ✅ | ✅ | ⚠️ | ✅ | ❌ |
| System templates | ✅ | ✅ | ❌ | ✅ | ✅ |
| Ease of implementation | ⚠️ | ⚠️ | ✅ | ❌ | ✅ |
| Maintainability | ✅ | ⚠️ | ❌ | ⚠️ | ✅ |
| Flexibility | ✅ | ✅ | ❌ | ✅ | ❌ |
| Performance | ✅ | ⚠️ | ❌ | ✅ | ✅ |
| Search capability | ✅ | ⚠️ | ❌ | ✅ | ✅ |
| Meets requirements | ✅ | ✅ | ⚠️ | ✅ | ⚠️ |

Legend: ✅ Good | ⚠️ Moderate | ❌ Poor

---

## Recommended Approach

**Option 1 (User-Owned Templates with Database Tables)** is the recommended approach because:

1. **Meets all requirements** - Supports both user and system templates
2. **Clean architecture** - Proper separation of concerns
3. **Scalable** - Can handle growth in templates and usage
4. **Searchable** - Efficient search by name
5. **Reusable** - Templates work across characters
6. **Professional** - Industry-standard approach for template systems

### Suggested MVP Implementation Path

**Phase 1 (Minimal Viable Product):**
- Backend: ItemTemplate and TemplateItem entities + CRUD operations
- Frontend: Template selection UI (no "Save as Template" yet)
- Seed a few system templates (Healing Kit, Adventurer's Pack)
- Basic search by name

**Phase 2 (Enhancement):**
- "Save as Template" feature in item creation form
- Template preview with items list
- Delete user templates
- Better search (category, tags)

**Phase 3 (Advanced):**
- Template versioning (Option 4 hybrid)
- Template sharing between users
- Template marketplace/library
- Import/export templates

---

## Alternative Recommendation

If **quick time-to-market** is critical and user-created templates aren't essential:

**Hybrid of Option 1 + Option 5:**
- Use Option 1 database structure for flexibility
- Seed system templates via code (Option 5)
- Allow users to create templates later
- Start with read-only templates, add write capability in Phase 2

This gives you a working feature quickly while maintaining the ability to expand later.

---

## Questions for Stakeholder

1. **User templates**: Must users be able to create their own templates, or are system templates sufficient for MVP?
2. **Sharing**: Should templates be shareable between users?
3. **Scope**: Is prefilled container (e.g., Healing Kit with items) required for MVP, or can we start with simple item templates?
4. **Search**: How important is advanced search (by category, tags) vs simple name search?
5. **Timeline**: What's the priority - quick MVP or full-featured solution?

---

## Next Steps

Once you choose an option:
1. Review and approve the architecture
2. Identify any modifications needed
3. Define exact MVP scope
4. Proceed with implementation

