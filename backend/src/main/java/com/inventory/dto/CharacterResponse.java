package com.inventory.dto;

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
}
