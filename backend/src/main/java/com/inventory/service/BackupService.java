package com.inventory.service;

import com.inventory.dto.BackupData;
import com.inventory.dto.BackupData.CharacterBackup;
import com.inventory.dto.BackupData.InventoryBackup;
import com.inventory.dto.BackupData.UserBackup;
import com.inventory.entity.Character;
import com.inventory.entity.Inventory;
import com.inventory.entity.User;
import com.inventory.repository.CharacterRepository;
import com.inventory.repository.InventoryRepository;
import com.inventory.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class BackupService {
    
    private final UserRepository userRepository;
    private final CharacterRepository characterRepository;
    private final InventoryRepository inventoryRepository;
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    
    public BackupService(UserRepository userRepository,
                        CharacterRepository characterRepository,
                        InventoryRepository inventoryRepository) {
        this.userRepository = userRepository;
        this.characterRepository = characterRepository;
        this.inventoryRepository = inventoryRepository;
    }
    
    @Transactional(readOnly = true)
    public BackupData createBackup(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Create user backup
        UserBackup userBackup = new UserBackup(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getCreatedAt() != null ? user.getCreatedAt().format(FORMATTER) : null
        );
        
        // Get all characters for this user
        List<Character> characters = characterRepository.findByUserId(user.getId());
        List<CharacterBackup> characterBackups = new ArrayList<>();
        
        for (Character character : characters) {
            CharacterBackup charBackup = new CharacterBackup();
            charBackup.setId(character.getId());
            charBackup.setName(character.getName());
            charBackup.setCreatedAt(character.getCreatedAt() != null ? character.getCreatedAt().format(FORMATTER) : null);
            charBackup.setCurrentYear(character.getCurrentYear());
            charBackup.setCurrentDay(character.getCurrentDay());
            
            // Get all inventory items for this character (including removed ones)
            List<Inventory> inventories = inventoryRepository.findAll(
                (root, query, cb) -> cb.equal(root.get("character").get("id"), character.getId())
            );
            
            List<InventoryBackup> inventoryBackups = new ArrayList<>();
            for (Inventory inventory : inventories) {
                InventoryBackup invBackup = new InventoryBackup();
                invBackup.setId(inventory.getId());
                invBackup.setCategory(inventory.getCategory());
                invBackup.setItem(inventory.getItem());
                invBackup.setQuality(inventory.getQuality());
                invBackup.setDescription(inventory.getDescription());
                invBackup.setPriceInCopper(inventory.getPriceInCopper());
                invBackup.setQuantity(inventory.getQuantity());
                invBackup.setAddedUpdated(inventory.getAddedUpdated());
                invBackup.setWeight(inventory.getWeight());
                invBackup.setRemoved(inventory.getRemoved());
                invBackup.setRemovedText(inventory.getRemovedText());
                invBackup.setAddedYear(inventory.getAddedYear());
                invBackup.setAddedDay(inventory.getAddedDay());
                invBackup.setModifiedYear(inventory.getModifiedYear());
                invBackup.setModifiedDay(inventory.getModifiedDay());
                invBackup.setRemovedYear(inventory.getRemovedYear());
                invBackup.setRemovedDay(inventory.getRemovedDay());
                invBackup.setCreatedAt(inventory.getCreatedAt() != null ? inventory.getCreatedAt().format(FORMATTER) : null);
                invBackup.setUpdatedAt(inventory.getUpdatedAt() != null ? inventory.getUpdatedAt().format(FORMATTER) : null);
                
                inventoryBackups.add(invBackup);
            }
            
            charBackup.setInventory(inventoryBackups);
            characterBackups.add(charBackup);
        }
        
        // Create backup data with timestamp
        String backupDate = LocalDateTime.now().format(FORMATTER);
        return new BackupData(userBackup, characterBackups, backupDate);
    }
}
