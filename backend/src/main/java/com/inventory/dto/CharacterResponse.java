package com.inventory.dto;

import com.inventory.entity.Character;
import com.inventory.service.PyarrCalendarService;

import java.time.LocalDateTime;

public class CharacterResponse {
    private Long id;
    private String name;
    private LocalDateTime createdAt;
    private Integer currentYear;
    private Integer currentDay;
    private String formattedDate; // Pyarr calendar formatted date
    
    public CharacterResponse() {}
    
    public CharacterResponse(Character character, PyarrCalendarService calendarService) {
        this.id = character.getId();
        this.name = character.getName();
        this.createdAt = character.getCreatedAt();
        this.currentYear = character.getCurrentYear();
        this.currentDay = character.getCurrentDay();
        
        // Format the Pyarr calendar date
        if (currentYear != null && currentDay != null) {
            this.formattedDate = calendarService.formatDate(currentYear, currentDay);
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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
    
    public String getFormattedDate() {
        return formattedDate;
    }
    
    public void setFormattedDate(String formattedDate) {
        this.formattedDate = formattedDate;
    }
}
