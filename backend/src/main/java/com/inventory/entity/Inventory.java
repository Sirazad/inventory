package com.inventory.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.inventory.service.PyarrCalendarService;
import com.inventory.util.CurrencyUtil;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Inventory {
    
    @Transient
    private PyarrCalendarService pyarrCalendarService;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonIgnore
    private Category categoryEntity;

    @Column(nullable = false)
    private String item;

    private String quality;

    @Column(nullable = false)
    private String description;

    @Column(name = "price_in_copper")
    private Long priceInCopper;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "added_updated")
    private String addedUpdated;

    // Weight in kilograms per single item
    private Double weight;

    // Container support: reference to parent container
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "container_id")
    @JsonIgnore
    private Inventory container;

    @Column(name = "container_id", insertable = false, updatable = false)
    private Long containerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id", nullable = false)
    @JsonIgnore
    private Character character;

    @Column(name = "removed")
    private Boolean removed = false;

    @Column(name = "removed_text")
    private String removedText;

    // Pyarr Calendar Date Tracking
    @Column(name = "added_year")
    private Integer addedYear;

    @Column(name = "added_day")
    private Integer addedDay;

    @Column(name = "modified_year")
    private Integer modifiedYear;

    @Column(name = "modified_day")
    private Integer modifiedDay;

    @Column(name = "removed_year")
    private Integer removedYear;

    @Column(name = "removed_day")
    private Integer removedDay;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (removed == null) {
            removed = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
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

    public void setPriceFromCurrency(Long gold, Long silver, Long copper) {
        this.priceInCopper = CurrencyUtil.toCopperValue(gold, silver, copper);
    }

    public void setCategoryEntity(Category categoryEntity) {
        this.categoryEntity = categoryEntity;
        if (categoryEntity != null) {
            this.category = categoryEntity.getName();
        }
    }
    
    // Formatted date getters for JSON serialization
    public String getFormattedAddedDate() {
        if (addedYear != null && addedDay != null && pyarrCalendarService != null) {
            try {
                return pyarrCalendarService.formatDate(addedYear, addedDay);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
    
    public String getFormattedModifiedDate() {
        if (modifiedYear != null && modifiedDay != null && pyarrCalendarService != null) {
            try {
                return pyarrCalendarService.formatDate(modifiedYear, modifiedDay);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
    
    public String getFormattedRemovedDate() {
        if (removedYear != null && removedDay != null && pyarrCalendarService != null) {
            try {
                return pyarrCalendarService.formatDate(removedYear, removedDay);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
}
