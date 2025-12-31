package com.inventory.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "calendar_months")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarMonth {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "month_number", nullable = false, unique = true)
    private Integer monthNumber; // 1-31

    @Column(name = "month_name", nullable = false, length = 100)
    private String monthName;

    @Column(name = "season", nullable = false, length = 50)
    private String season;

    @Column(name = "god_name", nullable = false, length = 100)
    private String godName;

    @Column(name = "god_month_number", nullable = false)
    private Integer godMonthNumber; // Which month this is for that god (1st, 2nd, 3rd, etc.)

    public CalendarMonth(Integer monthNumber, String monthName, String season, String godName, Integer godMonthNumber) {
        this.monthNumber = monthNumber;
        this.monthName = monthName;
        this.season = season;
        this.godName = godName;
        this.godMonthNumber = godMonthNumber;
    }
}
