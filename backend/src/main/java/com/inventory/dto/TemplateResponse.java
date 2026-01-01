package com.inventory.dto;

import com.inventory.entity.ItemTemplate;
import com.inventory.util.CurrencyUtil;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TemplateResponse {
    
    private Long id;
    private String name;
    private String category;
    private String item;
    private String quality;
    private String description;
    private Long priceInCopper;
    private Long gold;
    private Long silver;
    private Long copper;
    private Integer quantity;
    private Double weight;
    private Boolean isContainer;
    private Boolean isSystemTemplate;
    private List<TemplateItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TemplateResponse(ItemTemplate template) {
        this.id = template.getId();
        this.name = template.getName();
        this.category = template.getCategory();
        this.item = template.getItem();
        this.quality = template.getQuality();
        this.description = template.getDescription();
        this.priceInCopper = template.getPriceInCopper();
        this.gold = CurrencyUtil.getGold(template.getPriceInCopper());
        this.silver = CurrencyUtil.getSilver(template.getPriceInCopper());
        this.copper = CurrencyUtil.getCopper(template.getPriceInCopper());
        this.quantity = template.getQuantity();
        this.weight = template.getWeight();
        this.isContainer = template.getIsContainer();
        this.isSystemTemplate = template.getUser() == null;
        this.createdAt = template.getCreatedAt();
        this.updatedAt = template.getUpdatedAt();
    }
}
