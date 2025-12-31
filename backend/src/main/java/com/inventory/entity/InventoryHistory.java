package com.inventory.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.inventory.util.CurrencyUtil;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id")
    @JsonIgnore
    private Inventory inventory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id", nullable = false)
    @JsonIgnore
    private Character character;

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
    private Integer quantity; // Quantity removed

    private Double weight;

    @Column(name = "removed_year", nullable = false)
    private Integer removedYear;

    @Column(name = "removed_day", nullable = false)
    private Integer removedDay;

    @Column(name = "removal_reason", length = 500)
    private String removalReason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Helper methods for currency conversion
    public Long getGold() {
        return CurrencyUtil.getGold(priceInCopper);
    }

    public Long getSilver() {
        return CurrencyUtil.getSilver(priceInCopper);
    }

    public Long getCopper() {
        return CurrencyUtil.getCopper(priceInCopper);
    }
}
