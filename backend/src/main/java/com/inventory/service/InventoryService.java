package com.inventory.service;

import com.inventory.dto.InventoryRequest;
import com.inventory.entity.Category;
import com.inventory.entity.Character;
import com.inventory.entity.Inventory;
import com.inventory.entity.InventoryHistory;
import com.inventory.entity.User;
import com.inventory.repository.CategoryRepository;
import com.inventory.repository.CharacterRepository;
import com.inventory.repository.InventoryHistoryRepository;
import com.inventory.repository.InventoryRepository;
import com.inventory.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
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
    
    private void injectCalendarService(Inventory inventory) {
        inventory.setPyarrCalendarService(pyarrCalendarService);
    }
    
    private void injectCalendarService(List<Inventory> inventories) {
        inventories.forEach(this::injectCalendarService);
    }

    public List<Inventory> getInventoryByCharacter(String username, Long characterId, 
                                                   String category, Double minPrice, Double maxWeight) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new RuntimeException("Character not found"));

        Specification<Inventory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            predicates.add(cb.equal(root.get("character").get("id"), characterId));
            predicates.add(cb.equal(root.get("removed"), false));

            if (category != null && !category.isEmpty()) {
                predicates.add(cb.equal(root.get("category"), category));
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

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<Inventory> inventories = inventoryRepository.findAll(spec);
        injectCalendarService(inventories);
        return inventories;
    }

    public Inventory createInventory(String username, Long characterId, InventoryRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new RuntimeException("Character not found"));

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
                    .orElseThrow(() -> new RuntimeException("Container not found"));
            inventory.setContainer(containerItem);
        }
        
        // Set added date from character's current date
        inventory.setAddedYear(character.getCurrentYear());
        inventory.setAddedDay(character.getCurrentDay());

        Inventory saved = inventoryRepository.save(inventory);
        injectCalendarService(saved);
        return saved;
    }

    public Inventory updateInventory(String username, Long characterId, Long inventoryId, InventoryRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new RuntimeException("Character not found"));

        Inventory inventory = inventoryRepository.findByIdAndCharacterId(inventoryId, characterId)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

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
            Inventory containerItem = inventoryRepository.findByIdAndCharacterId(request.getContainerId(), characterId)
                    .orElseThrow(() -> new RuntimeException("Container not found"));
            inventory.setContainer(containerItem);
        } else {
            inventory.setContainer(null);
        }

        Inventory saved = inventoryRepository.save(inventory);
        injectCalendarService(saved);
        return saved;
    }

    public void removeInventory(String username, Long characterId, Long inventoryId, String removalText) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new RuntimeException("Character not found"));

        Inventory inventory = inventoryRepository.findByIdAndCharacterId(inventoryId, characterId)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        inventory.setRemoved(true);
        inventory.setRemovedText(removalText);
        inventoryRepository.save(inventory);
    }
    
    public Inventory updateQuantity(String username, Long characterId, Long inventoryId, int quantityChange) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new RuntimeException("Character not found"));

        Inventory inventory = inventoryRepository.findByIdAndCharacterId(inventoryId, characterId)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        int currentQuantity = inventory.getQuantity();
        int newQuantity = currentQuantity + quantityChange;

        if (quantityChange > 0) {
            // Quantity increase - just update modified date
            inventory.setQuantity(newQuantity);
            inventory.setModifiedYear(character.getCurrentYear());
            inventory.setModifiedDay(character.getCurrentDay());
            Inventory saved = inventoryRepository.save(inventory);
            injectCalendarService(saved);
            return saved;
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
                injectCalendarService(saved);
                return saved;
            } else {
                // No items left - mark as removed
                inventory.setQuantity(0);
                inventory.setRemoved(true);
                inventory.setRemovedYear(character.getCurrentYear());
                inventory.setRemovedDay(character.getCurrentDay());
                inventory.setModifiedYear(character.getCurrentYear());
                inventory.setModifiedDay(character.getCurrentDay());
                Inventory saved = inventoryRepository.save(inventory);
                injectCalendarService(saved);
                return saved;
            }
        }
        
        // No change
        return inventory;
    }
    
    public List<Inventory> getItemsInContainer(String username, Long characterId, Long containerId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new RuntimeException("Character not found"));
        
        // Verify container belongs to this character
        inventoryRepository.findByIdAndCharacterId(containerId, characterId)
                .orElseThrow(() -> new RuntimeException("Container not found"));

        List<Inventory> items = inventoryRepository.findByContainerIdAndRemovedFalse(containerId);
        injectCalendarService(items);
        return items;
    }
    
    public Double calculateTotalWeight(String username, Long characterId, Long inventoryId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new RuntimeException("Character not found"));

        Inventory item = inventoryRepository.findByIdAndCharacterId(inventoryId, characterId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));
        
        return calculateTotalWeightRecursive(item, 0);
    }
    
    private Double calculateTotalWeightRecursive(Inventory item, int depth) {
        // Prevent infinite recursion - max depth of 10 levels
        if (depth > 10) {
            throw new RuntimeException("Container nesting too deep (max 10 levels)");
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
}
