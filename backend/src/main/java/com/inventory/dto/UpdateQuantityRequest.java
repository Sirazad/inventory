package com.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UpdateQuantityRequest {
    @NotNull
    private Integer quantityChange;
    private String reason; // optional
}
