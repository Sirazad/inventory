package com.inventory.service;

import com.inventory.dto.InventoryRequest;
import com.inventory.entity.Character;
import com.inventory.entity.Inventory;
import com.inventory.entity.User;
import com.inventory.repository.CharacterRepository;
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

    public InventoryService(InventoryRepository inventoryRepository, 
                          CharacterRepository characterRepository,
                          UserRepository userRepository) {
        this.inventoryRepository = inventoryRepository;
        this.characterRepository = characterRepository;
        this.userRepository = userRepository;
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
                predicates.add(cb.and(
                    cb.isNotNull(root.get("price")),
                    cb.greaterThanOrEqualTo(root.get("price"), minPrice)
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

        return inventoryRepository.findAll(spec);
    }

    public Inventory createInventory(String username, Long characterId, InventoryRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new RuntimeException("Character not found"));

        Inventory inventory = new Inventory();
        inventory.setCategory(request.getCategory());
        inventory.setItem(request.getItem());
        inventory.setQuality(request.getQuality());
        inventory.setDescription(request.getDescription());
        inventory.setPrice(request.getPrice());
        inventory.setQuantity(request.getQuantity());
        inventory.setAddedUpdated(request.getAddedUpdated());
        inventory.setWeight(request.getWeight());
        inventory.setCharacter(character);

        return inventoryRepository.save(inventory);
    }

    public Inventory updateInventory(String username, Long characterId, Long inventoryId, InventoryRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new RuntimeException("Character not found"));

        Inventory inventory = inventoryRepository.findByIdAndCharacterId(inventoryId, characterId)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        inventory.setCategory(request.getCategory());
        inventory.setItem(request.getItem());
        inventory.setQuality(request.getQuality());
        inventory.setDescription(request.getDescription());
        inventory.setPrice(request.getPrice());
        inventory.setQuantity(request.getQuantity());
        inventory.setAddedUpdated(request.getAddedUpdated());
        inventory.setWeight(request.getWeight());

        return inventoryRepository.save(inventory);
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
}
