package com.inventory.dto;

import java.util.List;

public class BackupData {
    private UserBackup user;
    private List<CharacterBackup> characters;
    private String backupDate;
    
    public BackupData() {}
    
    public BackupData(UserBackup user, List<CharacterBackup> characters, String backupDate) {
        this.user = user;
        this.characters = characters;
        this.backupDate = backupDate;
    }
    
    // Getters and Setters
    public UserBackup getUser() {
        return user;
    }
    
    public void setUser(UserBackup user) {
        this.user = user;
    }
    
    public List<CharacterBackup> getCharacters() {
        return characters;
    }
    
    public void setCharacters(List<CharacterBackup> characters) {
        this.characters = characters;
    }
    
    public String getBackupDate() {
        return backupDate;
    }
    
    public void setBackupDate(String backupDate) {
        this.backupDate = backupDate;
    }
    
    // Inner classes for backup data structure
    public static class UserBackup {
        private Long id;
        private String username;
        private String email;
        private String createdAt;
        
        public UserBackup() {}
        
        public UserBackup(Long id, String username, String email, String createdAt) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.createdAt = createdAt;
        }
        
        // Getters and Setters
        public Long getId() {
            return id;
        }
        
        public void setId(Long id) {
            this.id = id;
        }
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public String getEmail() {
            return email;
        }
        
        public void setEmail(String email) {
            this.email = email;
        }
        
        public String getCreatedAt() {
            return createdAt;
        }
        
        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }
    }
    
    public static class CharacterBackup {
        private Long id;
        private String name;
        private String createdAt;
        private Integer currentYear;
        private Integer currentDay;
        private List<InventoryBackup> inventory;
        
        public CharacterBackup() {}
        
        // Getters and Setters
        public Long getId() {
            return id;
        }
        
        public void setId(Long id) {
            this.id = id;
        }
        
        public String getName() {
            return name;
        }
        
        public void setName(String name) {
            this.name = name;
        }
        
        public String getCreatedAt() {
            return createdAt;
        }
        
        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }
        
        public Integer getCurrentYear() {
            return currentYear;
        }
        
        public void setCurrentYear(Integer currentYear) {
            this.currentYear = currentYear;
        }
        
        public Integer getCurrentDay() {
            return currentDay;
        }
        
        public void setCurrentDay(Integer currentDay) {
            this.currentDay = currentDay;
        }
        
        public List<InventoryBackup> getInventory() {
            return inventory;
        }
        
        public void setInventory(List<InventoryBackup> inventory) {
            this.inventory = inventory;
        }
    }
    
    public static class InventoryBackup {
        private Long id;
        private String category;
        private String item;
        private String quality;
        private String description;
        private Long priceInCopper;
        private Integer quantity;
        private String addedUpdated;
        private Double weight;
        private Boolean removed;
        private String removedText;
        private Integer addedYear;
        private Integer addedDay;
        private Integer modifiedYear;
        private Integer modifiedDay;
        private Integer removedYear;
        private Integer removedDay;
        private String createdAt;
        private String updatedAt;
        
        public InventoryBackup() {}
        
        // Getters and Setters
        public Long getId() {
            return id;
        }
        
        public void setId(Long id) {
            this.id = id;
        }
        
        public String getCategory() {
            return category;
        }
        
        public void setCategory(String category) {
            this.category = category;
        }
        
        public String getItem() {
            return item;
        }
        
        public void setItem(String item) {
            this.item = item;
        }
        
        public String getQuality() {
            return quality;
        }
        
        public void setQuality(String quality) {
            this.quality = quality;
        }
        
        public String getDescription() {
            return description;
        }
        
        public void setDescription(String description) {
            this.description = description;
        }
        
        public Long getPriceInCopper() {
            return priceInCopper;
        }
        
        public void setPriceInCopper(Long priceInCopper) {
            this.priceInCopper = priceInCopper;
        }
        
        public Integer getQuantity() {
            return quantity;
        }
        
        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
        
        public String getAddedUpdated() {
            return addedUpdated;
        }
        
        public void setAddedUpdated(String addedUpdated) {
            this.addedUpdated = addedUpdated;
        }
        
        public Double getWeight() {
            return weight;
        }
        
        public void setWeight(Double weight) {
            this.weight = weight;
        }
        
        public Boolean getRemoved() {
            return removed;
        }
        
        public void setRemoved(Boolean removed) {
            this.removed = removed;
        }
        
        public String getRemovedText() {
            return removedText;
        }
        
        public void setRemovedText(String removedText) {
            this.removedText = removedText;
        }
        
        public Integer getAddedYear() {
            return addedYear;
        }
        
        public void setAddedYear(Integer addedYear) {
            this.addedYear = addedYear;
        }
        
        public Integer getAddedDay() {
            return addedDay;
        }
        
        public void setAddedDay(Integer addedDay) {
            this.addedDay = addedDay;
        }
        
        public Integer getModifiedYear() {
            return modifiedYear;
        }
        
        public void setModifiedYear(Integer modifiedYear) {
            this.modifiedYear = modifiedYear;
        }
        
        public Integer getModifiedDay() {
            return modifiedDay;
        }
        
        public void setModifiedDay(Integer modifiedDay) {
            this.modifiedDay = modifiedDay;
        }
        
        public Integer getRemovedYear() {
            return removedYear;
        }
        
        public void setRemovedYear(Integer removedYear) {
            this.removedYear = removedYear;
        }
        
        public Integer getRemovedDay() {
            return removedDay;
        }
        
        public void setRemovedDay(Integer removedDay) {
            this.removedDay = removedDay;
        }
        
        public String getCreatedAt() {
            return createdAt;
        }
        
        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }
        
        public String getUpdatedAt() {
            return updatedAt;
        }
        
        public void setUpdatedAt(String updatedAt) {
            this.updatedAt = updatedAt;
        }
    }
}
