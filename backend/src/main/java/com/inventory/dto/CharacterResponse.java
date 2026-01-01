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
    private String godName; // God associated with the current month
    private Integer godMonthNumber; // Which month this is for that god (1st, 2nd, 3rd, etc.)
    private String season; // Season for the current month
    
    public CharacterResponse() {}
    
    public CharacterResponse(Character character, PyarrCalendarService calendarService) {
        this.id = character.getId();
        this.name = character.getName();
        this.createdAt = character.getCreatedAt();
        this.currentYear = character.getCurrentYear() != null ? character.getCurrentYear() : 3692;
        this.currentDay = character.getCurrentDay() != null ? character.getCurrentDay() : 1;
        
        // Get calendar month info for frontend i18n
        try {
            var calendarMonth = calendarService.getCalendarMonth(this.currentDay);
            this.godName = calendarMonth.getGodName();
            this.godMonthNumber = calendarMonth.getGodMonthNumber();
            this.season = calendarMonth.getSeason();
        } catch (Exception e) {
            // If unable to get calendar month, leave fields as null
            this.godName = null;
            this.godMonthNumber = null;
            this.season = null;
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
    
    public String getGodName() {
        return godName;
    }
    
    public void setGodName(String godName) {
        this.godName = godName;
    }
    
    public Integer getGodMonthNumber() {
        return godMonthNumber;
    }
    
    public void setGodMonthNumber(Integer godMonthNumber) {
        this.godMonthNumber = godMonthNumber;
    }
    
    public String getSeason() {
        return season;
    }
    
    public void setSeason(String season) {
        this.season = season;
    }
}
