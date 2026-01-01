package com.inventory.dto;

import com.inventory.entity.Character;
import com.inventory.service.PyarrCalendarService;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class CharacterResponse {
    private Long id;
    private String name;
    private LocalDateTime createdAt;
    private Integer currentYear;
    private Integer currentDay;
    private String godName; // God associated with the current month
    private Integer godMonthNumber; // Which month this is for that god (1st, 2nd, 3rd, etc.)
    private String season; // Season for the current month
    
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
}
