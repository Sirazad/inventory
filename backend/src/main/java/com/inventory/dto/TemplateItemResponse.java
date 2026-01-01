package com.inventory.dto;

import com.inventory.entity.TemplateItem;
import com.inventory.util.CurrencyUtil;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TemplateItemResponse {
    
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
    private Double weight;
    private LocalDateTime createdAt;

    public TemplateItemResponse(TemplateItem templateItem) {
        this.id = templateItem.getId();
        this.category = templateItem.getCategory();
        this.item = templateItem.getItem();
        this.quality = templateItem.getQuality();
        this.description = templateItem.getDescription();
        this.priceInCopper = templateItem.getPriceInCopper();
        this.gold = CurrencyUtil.getGold(templateItem.getPriceInCopper());
        this.silver = CurrencyUtil.getSilver(templateItem.getPriceInCopper());
        this.copper = CurrencyUtil.getCopper(templateItem.getPriceInCopper());
        this.quantity = templateItem.getQuantity();
        this.weight = templateItem.getWeight();
        this.createdAt = templateItem.getCreatedAt();
    }
}
