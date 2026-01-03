package com.inventory.dto;

import com.inventory.entity.TemplateContent;
import com.inventory.util.CurrencyUtil;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TemplateContentResponse {
    
    private Long id;
    private Long referencedTemplateId;
    private String referencedTemplateName;
    private Integer quantityOverride;
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

    public TemplateContentResponse(TemplateContent content) {
        this.id = content.getId();
        
        if (content.getReferencedTemplate() != null) {
            this.referencedTemplateId = content.getReferencedTemplate().getId();
            this.referencedTemplateName = content.getReferencedTemplate().getName();
            this.quantityOverride = content.getQuantityOverride();
            // Copy data from referenced template
            this.category = content.getReferencedTemplate().getCategory();
            this.item = content.getReferencedTemplate().getItem();
            this.quality = content.getReferencedTemplate().getQuality();
            this.description = content.getReferencedTemplate().getDescription();
            this.priceInCopper = content.getReferencedTemplate().getPriceInCopper();
            this.quantity = content.getQuantityOverride() != null ? 
                content.getQuantityOverride() : content.getReferencedTemplate().getQuantity();
            this.weight = content.getReferencedTemplate().getWeight();
        } else {
            // Direct definition
            this.category = content.getCategory();
            this.item = content.getItem();
            this.quality = content.getQuality();
            this.description = content.getDescription();
            this.priceInCopper = content.getPriceInCopper();
            this.quantity = content.getQuantity();
            this.weight = content.getWeight();
        }
        
        this.gold = CurrencyUtil.getGold(this.priceInCopper);
        this.silver = CurrencyUtil.getSilver(this.priceInCopper);
        this.copper = CurrencyUtil.getCopper(this.priceInCopper);
    }
}
