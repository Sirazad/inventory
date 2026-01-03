package com.inventory.dto;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TemplateContentRequest {
    
    private Long referencedTemplateId;
    
    private Integer quantityOverride;
    
    // Direct definition fields (used if referencedTemplateId is null)
    private String category;
    
    private String item;
    
    private String quality;
    
    private String description;
    
    private Long gold;
    private Long silver;
    private Long copper;
    
    @Min(1)
    private Integer quantity;
    
    private Double weight;
}
