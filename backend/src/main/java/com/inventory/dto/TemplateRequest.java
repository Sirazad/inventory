package com.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TemplateRequest {
    
    @NotBlank
    private String name;

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

    private Double weight;

    private Boolean isContainer;

    @Valid
    private List<TemplateContentRequest> contents;
}
