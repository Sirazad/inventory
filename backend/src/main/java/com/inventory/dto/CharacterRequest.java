package com.inventory.dto;

import jakarta.validation.constraints.NotBlank;

public class CharacterRequest {
    @NotBlank
    private String name;
    private Integer currentYear;
    private Integer currentDay;

    public CharacterRequest() {}

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getCurrentYear() {
        return currentYear;
    }

    public void setCurrentYear(Integer currentYear) {
        this.currentYear = currentYear;
    }

    public Integer getCurrentDay() {
        return currentDay;
    }

    public void setCurrentDay(Integer currentDay) {
        this.currentDay = currentDay;
    }
}
