package com.inventory.dto;

import com.inventory.entity.Inventory;
import com.inventory.service.PyarrCalendarService;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class InventoryResponse {
    private Long id;
    private String category;
    private String item;
    private String quality;
    private String description;
    private Long priceInCopper;
    private Long gold;
    private Long silver;
    private Long copper;
    private Integer quantity;
    private String addedUpdated;
    private Double weight;
    private Long containerId;
    private Boolean removed;
    private String removedText;
    private Integer addedYear;
    private Integer addedDay;
    private Integer modifiedYear;
    private Integer modifiedDay;
    private Integer removedYear;
    private Integer removedDay;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Formatted dates
    private String formattedAddedDate;
    private String formattedModifiedDate;
    private String formattedRemovedDate;
    
    public InventoryResponse(Inventory inventory, PyarrCalendarService calendarService) {
        this.id = inventory.getId();
        this.category = inventory.getCategory();
        this.item = inventory.getItem();
        this.quality = inventory.getQuality();
        this.description = inventory.getDescription();
        this.priceInCopper = inventory.getPriceInCopper();
        this.gold = inventory.getGold();
        this.silver = inventory.getSilver();
        this.copper = inventory.getCopper();
        this.quantity = inventory.getQuantity();
        this.addedUpdated = inventory.getAddedUpdated();
        this.weight = inventory.getWeight();
        this.containerId = inventory.getContainerId();
        this.removed = inventory.getRemoved();
        this.removedText = inventory.getRemovedText();
        this.addedYear = inventory.getAddedYear();
        this.addedDay = inventory.getAddedDay();
        this.modifiedYear = inventory.getModifiedYear();
        this.modifiedDay = inventory.getModifiedDay();
        this.removedYear = inventory.getRemovedYear();
        this.removedDay = inventory.getRemovedDay();
        this.createdAt = inventory.getCreatedAt();
        this.updatedAt = inventory.getUpdatedAt();
        
        // Format dates using the calendar service
        if (addedYear != null && addedDay != null) {
            try {
                this.formattedAddedDate = calendarService.formatDate(addedYear, addedDay);
            } catch (IllegalArgumentException e) {
                // Invalid date values - leave formattedAddedDate as null
                this.formattedAddedDate = null;
            }
        }
        
        if (modifiedYear != null && modifiedDay != null) {
            try {
                this.formattedModifiedDate = calendarService.formatDate(modifiedYear, modifiedDay);
            } catch (IllegalArgumentException e) {
                // Invalid date values - leave formattedModifiedDate as null
                this.formattedModifiedDate = null;
            }
        }
        
        if (removedYear != null && removedDay != null) {
            try {
                this.formattedRemovedDate = calendarService.formatDate(removedYear, removedDay);
            } catch (IllegalArgumentException e) {
                // Invalid date values - leave formattedRemovedDate as null
                this.formattedRemovedDate = null;
            }
        }
    }
}
