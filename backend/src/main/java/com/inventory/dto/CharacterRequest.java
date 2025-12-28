package com.inventory.dto;

import jakarta.validation.constraints.NotBlank;

public class CharacterRequest {
    @NotBlank
    private String name;

    public CharacterRequest() {}

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
