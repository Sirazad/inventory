package com.inventory.dto;

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
}
