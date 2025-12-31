package com.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CharacterRequest {
    @NotBlank
    private String name;
    private Integer currentYear;
    private Integer currentDay;
}
