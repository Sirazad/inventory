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

import java.util.ArrayList;
import java.util.List;
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
                // Partial, case-insensitive match for category
                predicates.add(cb.like(cb.lower(root.get("category")), "%" + category.toLowerCase() + "%"));
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
                // Partial, case-insensitive match for item name
                predicates.add(cb.like(cb.lower(root.get("item")), "%" + itemName.toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<Inventory> inventories = inventoryRepository.findAll(spec);
        return inventories.stream()
                .map(inv -> new InventoryResponse(inv, pyarrCalendarService))
                .collect(Collectors.toList());
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
}
