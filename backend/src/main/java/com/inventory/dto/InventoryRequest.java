package com.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class InventoryRequest {
    @NotBlank
    private String category;

    @NotBlank
    private String item;

    private String quality;

    @NotBlank
    private String description;

    private Long gold;
    private Long silver;
    private Long copper;

    @NotNull
    @Min(1)
    private Integer quantity;

    private String addedUpdated;

    private Double weight;

    private Long containerId;

    public InventoryRequest() {}

    // Getters and Setters
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

    public Long getGold() {
        return gold;
    }

    public void setGold(Long gold) {
        this.gold = gold;
    }

    public Long getSilver() {
        return silver;
    }

    public void setSilver(Long silver) {
        this.silver = silver;
    }

    public Long getCopper() {
        return copper;
    }

    public void setCopper(Long copper) {
        this.copper = copper;
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

    public Long getContainerId() {
        return containerId;
    }

    public void setContainerId(Long containerId) {
        this.containerId = containerId;
    }
}
