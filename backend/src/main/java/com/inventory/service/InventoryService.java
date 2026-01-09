package com.inventory.service;

import com.inventory.dto.InventoryRequest;
import com.inventory.dto.InventoryResponse;
import com.inventory.entity.Category;
import com.inventory.entity.Character;
import com.inventory.entity.Inventory;
import com.inventory.entity.InventoryHistory;
import com.inventory.entity.User;
import com.inventory.exception.InvalidOperationException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.repository.CategoryRepository;
import com.inventory.repository.CharacterRepository;
import com.inventory.repository.InventoryHistoryRepository;
import com.inventory.repository.InventoryRepository;
import com.inventory.repository.UserRepository;
import com.inventory.util.ValidationUtil;
import jakarta.persistence.criteria.Predicate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final CharacterRepository characterRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryHistoryRepository inventoryHistoryRepository;
    private final PyarrCalendarService pyarrCalendarService;

    public InventoryService(InventoryRepository inventoryRepository, 
                          CharacterRepository characterRepository,
                          UserRepository userRepository,
                          CategoryRepository categoryRepository,
                          InventoryHistoryRepository inventoryHistoryRepository,
                          PyarrCalendarService pyarrCalendarService) {
        this.inventoryRepository = inventoryRepository;
        this.characterRepository = characterRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryHistoryRepository = inventoryHistoryRepository;
        this.pyarrCalendarService = pyarrCalendarService;
    }

    public List<InventoryResponse> getInventoryByCharacter(String username, Long characterId, 
                                                   String category, Double minPrice, Double maxWeight, String itemName) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));

        Specification<Inventory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            predicates.add(cb.equal(root.get("character").get("id"), characterId));
            predicates.add(cb.equal(root.get("removed"), false));

            if (category != null && !category.isEmpty()) {
                // Partial, case-insensitive match for category with escaped special characters
                String escapedCategory = escapeLikePattern(category);
                predicates.add(cb.like(cb.lower(root.get("category")), "%" + escapedCategory.toLowerCase() + "%"));
            }

            if (minPrice != null) {
                // minPrice is expected to be in copper
                predicates.add(cb.and(
                    cb.isNotNull(root.get("priceInCopper")),
                    cb.greaterThanOrEqualTo(root.get("priceInCopper"), minPrice.longValue())
                ));
            }

            if (maxWeight != null) {
                predicates.add(cb.and(
                    cb.isNotNull(root.get("weight")),
                    cb.lessThanOrEqualTo(root.get("weight"), maxWeight)
                ));
            }

            if (itemName != null && !itemName.isEmpty()) {
                // Partial, case-insensitive match for item name with escaped special characters
                String escapedItemName = escapeLikePattern(itemName);
                predicates.add(cb.like(cb.lower(root.get("item")), "%" + escapedItemName.toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<Inventory> inventories = inventoryRepository.findAll(spec);
        return inventories.stream()
                .map(inv -> new InventoryResponse(inv, pyarrCalendarService))
                .collect(Collectors.toList());
    }
    
    /**
     * Escape special LIKE pattern characters to prevent SQL injection.
     * Escapes: % (matches any characters), _ (matches single character), \ (escape character)
     */
    private String escapeLikePattern(String input) {
        if (input == null) {
            return null;
        }
        return input.replace("\\", "\\\\")
                    .replace("%", "\\%")
                    .replace("_", "\\_");
    }

    public InventoryResponse createInventory(String username, Long characterId, InventoryRequest request) {
        log.debug("Creating inventory item '{}' for character ID {}", request.getItem(), characterId);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));

        Inventory inventory = new Inventory();
        inventory.setCategory(request.getCategory());
        
        // Set category entity if it exists
        if (request.getCategory() != null && !request.getCategory().isEmpty()) {
            categoryRepository.findByName(request.getCategory())
                    .ifPresent(inventory::setCategoryEntity);
        }
        
        inventory.setItem(request.getItem());
        inventory.setQuality(request.getQuality());
        inventory.setDescription(request.getDescription());
        inventory.setPriceFromCurrency(request.getGold(), request.getSilver(), request.getCopper());
        inventory.setQuantity(request.getQuantity());
        inventory.setAddedUpdated(request.getAddedUpdated());
        inventory.setWeight(request.getWeight());
        inventory.setCharacter(character);
        
        // Set container if provided
        if (request.getContainerId() != null) {
            Inventory containerItem = inventoryRepository.findByIdAndCharacterId(request.getContainerId(), characterId)
                    .orElseThrow(() -> new ResourceNotFoundException("Container not found"));
            inventory.setContainer(containerItem);
        }
        
        // Set added date from character's current date
        inventory.setAddedYear(character.getCurrentYear());
        inventory.setAddedDay(character.getCurrentDay());

        Inventory saved = inventoryRepository.save(inventory);
        log.info("Inventory item created: {} (ID: {}) for character ID {}", 
                saved.getItem(), saved.getId(), characterId);
        
        return new InventoryResponse(saved, pyarrCalendarService);
    }

    public InventoryResponse updateInventory(String username, Long characterId, Long inventoryId, InventoryRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));

        Inventory inventory = inventoryRepository.findByIdAndCharacterId(inventoryId, characterId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));

        inventory.setCategory(request.getCategory());
        
        // Set category entity if it exists
        if (request.getCategory() != null && !request.getCategory().isEmpty()) {
            categoryRepository.findByName(request.getCategory())
                    .ifPresent(inventory::setCategoryEntity);
        }
        
        inventory.setItem(request.getItem());
        inventory.setQuality(request.getQuality());
        inventory.setDescription(request.getDescription());
        inventory.setPriceFromCurrency(request.getGold(), request.getSilver(), request.getCopper());
        inventory.setQuantity(request.getQuantity());
        inventory.setAddedUpdated(request.getAddedUpdated());
        inventory.setWeight(request.getWeight());

        // Update container if provided
        if (request.getContainerId() != null) {
            // Prevent circular references: check if the container we're trying to put this item into
            // is not the item itself or any of its descendants
            if (request.getContainerId().equals(inventoryId)) {
                throw new InvalidOperationException("Cannot put an item inside itself");
            }
            
            // Check for circular reference by ensuring the target container is not inside this item
            if (wouldCreateCircularReference(inventoryId, request.getContainerId())) {
                log.warn("Circular reference detected when updating inventory ID {}", inventoryId);
                throw new InvalidOperationException("Cannot create circular container reference - the target container is inside this item");
            }
            
            Inventory containerItem = inventoryRepository.findByIdAndCharacterId(request.getContainerId(), characterId)
                    .orElseThrow(() -> new ResourceNotFoundException("Container not found"));
            inventory.setContainer(containerItem);
        } else {
            inventory.setContainer(null);
        }

        Inventory saved = inventoryRepository.save(inventory);
        return new InventoryResponse(saved, pyarrCalendarService);
    }

    public void removeInventory(String username, Long characterId, Long inventoryId, String removalText) {
        log.info("Removing inventory item ID {} for character ID {}", inventoryId, characterId);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));

        Inventory inventory = inventoryRepository.findByIdAndCharacterId(inventoryId, characterId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));

        // Validate removal text is provided
        ValidationUtil.requireNonEmpty(removalText, "Removal reason");

        inventory.setRemoved(true);
        inventory.setRemovedText(removalText);
        inventoryRepository.save(inventory);
        
        log.info("Inventory item removed: {} (ID: {}), reason: {}", 
                inventory.getItem(), inventoryId, removalText);
    }
    
    public InventoryResponse updateQuantity(String username, Long characterId, Long inventoryId, int quantityChange) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));

        Inventory inventory = inventoryRepository.findByIdAndCharacterId(inventoryId, characterId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));

        int currentQuantity = inventory.getQuantity();
        int newQuantity = currentQuantity + quantityChange;

        if (quantityChange > 0) {
            // Quantity increase - just update modified date
            inventory.setQuantity(newQuantity);
            inventory.setModifiedYear(character.getCurrentYear());
            inventory.setModifiedDay(character.getCurrentDay());
            Inventory saved = inventoryRepository.save(inventory);
            return new InventoryResponse(saved, pyarrCalendarService);
        } else if (quantityChange < 0) {
            // Quantity decrease - create history record and update/remove item
            int decreaseAmount = Math.abs(quantityChange);
            
            // Create history record for the removed item(s)
            InventoryHistory history = new InventoryHistory();
            history.setInventory(inventory);
            history.setCharacter(character);
            history.setCategory(inventory.getCategory());
            history.setItem(inventory.getItem());
            history.setQuality(inventory.getQuality());
            history.setDescription(inventory.getDescription());
            history.setPriceInCopper(inventory.getPriceInCopper());
            history.setQuantity(decreaseAmount);
            history.setWeight(inventory.getWeight());
            history.setRemovedYear(character.getCurrentYear());
            history.setRemovedDay(character.getCurrentDay());
            inventoryHistoryRepository.save(history);

            if (newQuantity > 0) {
                // Still have items left - update quantity and modified date
                inventory.setQuantity(newQuantity);
                inventory.setModifiedYear(character.getCurrentYear());
                inventory.setModifiedDay(character.getCurrentDay());
                Inventory saved = inventoryRepository.save(inventory);
                return new InventoryResponse(saved, pyarrCalendarService);
            } else {
                // No items left - mark as removed
                inventory.setQuantity(0);
                inventory.setRemoved(true);
                inventory.setRemovedYear(character.getCurrentYear());
                inventory.setRemovedDay(character.getCurrentDay());
                inventory.setModifiedYear(character.getCurrentYear());
                inventory.setModifiedDay(character.getCurrentDay());
                Inventory saved = inventoryRepository.save(inventory);
                return new InventoryResponse(saved, pyarrCalendarService);
            }
        }
        
        // No change - return as is without saving
        return new InventoryResponse(inventory, pyarrCalendarService);
    }
    
    public List<InventoryResponse> getItemsInContainer(String username, Long characterId, Long containerId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));
        
        // Verify container belongs to this character
        inventoryRepository.findByIdAndCharacterId(containerId, characterId)
                .orElseThrow(() -> new ResourceNotFoundException("Container not found"));

        List<Inventory> items = inventoryRepository.findByContainerIdAndRemovedFalse(containerId);
        return items.stream()
                .map(item -> new InventoryResponse(item, pyarrCalendarService))
                .collect(Collectors.toList());
    }
    
    public Double calculateTotalWeight(String username, Long characterId, Long inventoryId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));

        Inventory item = inventoryRepository.findByIdAndCharacterId(inventoryId, characterId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));
        
        return calculateTotalWeightRecursive(item, 0);
    }
    
    private Double calculateTotalWeightRecursive(Inventory item, int depth) {
        // Prevent infinite recursion - max depth of 10 levels
        if (depth > 10) {
            throw new InvalidOperationException("Container nesting too deep (max 10 levels)");
        }
        
        // Base weight of the item itself (weight per item * quantity)
        Double totalWeight = 0.0;
        if (item.getWeight() != null && item.getQuantity() != null) {
            totalWeight = item.getWeight() * item.getQuantity();
        }
        
        // Add weight of all items in this container
        List<Inventory> containedItems = inventoryRepository.findByContainerIdAndRemovedFalse(item.getId());
        for (Inventory containedItem : containedItems) {
            totalWeight += calculateTotalWeightRecursive(containedItem, depth + 1);
        }
        
        return totalWeight;
    }
    
    /**
     * Check if assigning itemId to targetContainerId would create a circular reference.
     * This happens if targetContainerId is currently inside itemId (at any depth).
     */
    private boolean wouldCreateCircularReference(Long itemId, Long targetContainerId) {
        return isDescendantOf(targetContainerId, itemId, 0);
    }
    
    /**
     * Check if potentialDescendant is inside ancestor (at any depth).
     */
    private boolean isDescendantOf(Long potentialDescendant, Long ancestor, int depth) {
        // Safety check to prevent infinite loops
        if (depth > 10) {
            return false;
        }
        
        // Get the potential descendant item
        Inventory item = inventoryRepository.findById(potentialDescendant).orElse(null);
        if (item == null || item.getContainerId() == null) {
            return false;
        }
        
        // If it's directly inside the ancestor, we have a match
        if (item.getContainerId().equals(ancestor)) {
            return true;
        }
        
        // Otherwise, check if its container is inside the ancestor
        return isDescendantOf(item.getContainerId(), ancestor, depth + 1);
    }
    
    /**
     * Clone an inventory item with optional recursive container cloning.
     * Returns a map with the cloned item and a list of cloned containers with their item counts.
     */
    @Transactional
    public Map<String, Object> cloneInventoryItem(String username, Long characterId, 
                                                   Long inventoryId, boolean includeContents) {
        log.debug("Cloning inventory item ID {} for character ID {}, includeContents: {}", 
                inventoryId, characterId, includeContents);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));

        Inventory originalItem = inventoryRepository.findByIdAndCharacterId(inventoryId, characterId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));
        
        // Track cloned containers for success message
        List<Map<String, Object>> clonedContainers = new ArrayList<>();
        
        // Clone the item (and optionally its contents if it's a container)
        Inventory clonedItem = cloneItemRecursive(originalItem, originalItem.getContainer(), 
                                                   character, 0, includeContents, clonedContainers);
        
        log.info("Successfully cloned inventory item '{}' (ID: {}) to new ID: {}", 
                originalItem.getItem(), inventoryId, clonedItem.getId());
        
        // Prepare response
        Map<String, Object> response = new HashMap<>();
        response.put("clonedItem", new InventoryResponse(clonedItem, pyarrCalendarService));
        response.put("clonedContainers", clonedContainers);
        
        return response;
    }
    
    /**
     * Recursive helper to clone an inventory item and optionally its contents.
     */
    private Inventory cloneItemRecursive(Inventory original, Inventory targetContainer, 
                                        Character character, int depth, boolean includeContents,
                                        List<Map<String, Object>> clonedContainers) {
        // Prevent infinite recursion
        if (depth > 10) {
            throw new InvalidOperationException("Container nesting too deep (max 10 levels)");
        }
        
        // Create new inventory item with same properties
        Inventory clone = new Inventory();
        clone.setCategory(original.getCategory());
        
        // Set category entity if it exists
        if (original.getCategory() != null && !original.getCategory().isEmpty()) {
            categoryRepository.findByName(original.getCategory())
                    .ifPresent(clone::setCategoryEntity);
        }
        
        clone.setItem(original.getItem());
        clone.setQuality(original.getQuality());
        clone.setDescription(original.getDescription());
        clone.setPriceInCopper(original.getPriceInCopper());
        clone.setQuantity(original.getQuantity());
        clone.setAddedUpdated(original.getAddedUpdated());
        clone.setWeight(original.getWeight());
        clone.setCharacter(character);
        clone.setContainer(targetContainer);
        clone.setIsContainer(original.getIsContainer());
        
        // Set added date from character's current date (NOT from original item)
        clone.setAddedYear(character.getCurrentYear());
        clone.setAddedDay(character.getCurrentDay());
        
        // Modified date should be null (new item has not been modified yet)
        clone.setModifiedYear(null);
        clone.setModifiedDay(null);
        
        // Save the cloned item
        Inventory savedClone = inventoryRepository.save(clone);
        
        // If it's a container and includeContents is true, recursively clone all contained items
        if (Boolean.TRUE.equals(original.getIsContainer()) && includeContents) {
            List<Inventory> containedItems = inventoryRepository.findByContainerIdAndRemovedFalse(original.getId());
            int itemCount = containedItems.size();
            
            // Track this container for success message
            Map<String, Object> containerInfo = new HashMap<>();
            containerInfo.put("name", savedClone.getItem());
            containerInfo.put("count", itemCount);
            clonedContainers.add(containerInfo);
            
            // Clone each contained item recursively
            for (Inventory containedItem : containedItems) {
                cloneItemRecursive(containedItem, savedClone, character, depth + 1, 
                                  true, clonedContainers);
            }
        }
        
        return savedClone;
    }
}
