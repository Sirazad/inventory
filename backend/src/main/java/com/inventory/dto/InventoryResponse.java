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
    
    // Calendar metadata for frontend i18n
    private String addedGodName;
    private Integer addedGodMonthNumber;
    private String addedSeason;
    private String modifiedGodName;
    private Integer modifiedGodMonthNumber;
    private String modifiedSeason;
    
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
        
        // Get calendar month info for frontend i18n
        if (addedYear != null && addedDay != null) {
            try {
                var calendarMonth = calendarService.getCalendarMonth(addedDay);
                this.addedGodName = calendarMonth.getGodName();
                this.addedGodMonthNumber = calendarMonth.getGodMonthNumber();
                this.addedSeason = calendarMonth.getSeason();
            } catch (IllegalArgumentException e) {
                // Invalid date values - leave fields as null
                this.addedGodName = null;
                this.addedGodMonthNumber = null;
                this.addedSeason = null;
            }
        }
        
        if (modifiedYear != null && modifiedDay != null) {
            try {
                var calendarMonth = calendarService.getCalendarMonth(modifiedDay);
                this.modifiedGodName = calendarMonth.getGodName();
                this.modifiedGodMonthNumber = calendarMonth.getGodMonthNumber();
                this.modifiedSeason = calendarMonth.getSeason();
            } catch (IllegalArgumentException e) {
                // Invalid date values - leave fields as null
                this.modifiedGodName = null;
                this.modifiedGodMonthNumber = null;
                this.modifiedSeason = null;
            }
        }
    }
}
