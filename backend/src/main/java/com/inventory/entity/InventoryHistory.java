package com.inventory.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_history")
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

    public InventoryHistory() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Inventory getInventory() {
        return inventory;
    }

    public void setInventory(Inventory inventory) {
        this.inventory = inventory;
    }

    public Character getCharacter() {
        return character;
    }

    public void setCharacter(Character character) {
        this.character = character;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
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

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
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

    public String getRemovalReason() {
        return removalReason;
    }

    public void setRemovalReason(String removalReason) {
        this.removalReason = removalReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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
}
