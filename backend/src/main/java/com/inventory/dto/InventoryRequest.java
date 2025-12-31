package com.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
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
}
