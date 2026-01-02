package com.inventory.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "template_content")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TemplateContent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    @JsonIgnore
    private ItemTemplate template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referenced_template_id")
    @JsonIgnore
    private ItemTemplate referencedTemplate;

    @Column(name = "quantity_override")
    private Integer quantityOverride;

    // Direct definition fields (used when referencedTemplate is null)
    private String category;
    
    private String item;
    
    private String quality;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "price_in_copper")
    private Long priceInCopper;
    
    private Integer quantity;
    
    private Double weight;
}
