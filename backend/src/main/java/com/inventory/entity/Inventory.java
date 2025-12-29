package com.inventory.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.inventory.service.PyarrCalendarService;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
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

    public Inventory() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Category getCategoryEntity() {
        return categoryEntity;
    }

    public void setCategoryEntity(Category categoryEntity) {
        this.categoryEntity = categoryEntity;
        if (categoryEntity != null) {
            this.category = categoryEntity.getName();
        }
    }

    public String getItem() {
        return item;
    }

    public void setItem(String item) {
        this.item = item;
    }

    public String getQuality() {
        return quality;
    }

    public void setQuality(String quality) {
        this.quality = quality;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getPriceInCopper() {
        return priceInCopper;
    }

    public void setPriceInCopper(Long priceInCopper) {
        this.priceInCopper = priceInCopper;
    }

    // Helper methods for currency conversion
    public Long getGold() {
        return priceInCopper != null ? priceInCopper / 1000 : 0;
    }

    public Long getSilver() {
        return priceInCopper != null ? (priceInCopper % 1000) / 100 : 0;
    }

    public Long getCopper() {
        return priceInCopper != null ? priceInCopper % 100 : 0;
    }

    public void setPriceFromCurrency(Long gold, Long silver, Long copper) {
        long totalCopper = 0;
        if (gold != null) totalCopper += gold * 1000;
        if (silver != null) totalCopper += silver * 100;
        if (copper != null) totalCopper += copper;
        this.priceInCopper = totalCopper > 0 ? totalCopper : null;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getAddedUpdated() {
        return addedUpdated;
    }

    public void setAddedUpdated(String addedUpdated) {
        this.addedUpdated = addedUpdated;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Character getCharacter() {
        return character;
    }

    public void setCharacter(Character character) {
        this.character = character;
    }

    public Boolean getRemoved() {
        return removed;
    }

    public void setRemoved(Boolean removed) {
        this.removed = removed;
    }

    public String getRemovedText() {
        return removedText;
    }

    public void setRemovedText(String removedText) {
        this.removedText = removedText;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Integer getAddedYear() {
        return addedYear;
    }

    public void setAddedYear(Integer addedYear) {
        this.addedYear = addedYear;
    }

    public Integer getAddedDay() {
        return addedDay;
    }

    public void setAddedDay(Integer addedDay) {
        this.addedDay = addedDay;
    }

    public Integer getModifiedYear() {
        return modifiedYear;
    }

    public void setModifiedYear(Integer modifiedYear) {
        this.modifiedYear = modifiedYear;
    }

    public Integer getModifiedDay() {
        return modifiedDay;
    }

    public void setModifiedDay(Integer modifiedDay) {
        this.modifiedDay = modifiedDay;
    }

    public Integer getRemovedYear() {
        return removedYear;
    }

    public void setRemovedYear(Integer removedYear) {
        this.removedYear = removedYear;
    }

    public Integer getRemovedDay() {
        return removedDay;
    }

    public void setRemovedDay(Integer removedDay) {
        this.removedDay = removedDay;
    }
    
    public Inventory getContainer() {
        return container;
    }

    public void setContainer(Inventory container) {
        this.container = container;
    }

    public Long getContainerId() {
        return containerId;
    }

    public void setContainerId(Long containerId) {
        this.containerId = containerId;
    }
    
    public void setPyarrCalendarService(PyarrCalendarService service) {
        this.pyarrCalendarService = service;
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
