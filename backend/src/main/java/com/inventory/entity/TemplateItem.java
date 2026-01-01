package com.inventory.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "template_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TemplateItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    @JsonIgnore
    private ItemTemplate template;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String item;

    private String quality;

    @Column(nullable = false)
    private String description;

    @Column(name = "price_in_copper")
    private Long priceInCopper;

    @Column(nullable = false)
    private Integer quantity;

    private Double weight;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
