package com.inventory.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "calendar_months")
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

    public CalendarMonth() {}

    public CalendarMonth(Integer monthNumber, String monthName, String season, String godName, Integer godMonthNumber) {
        this.monthNumber = monthNumber;
        this.monthName = monthName;
        this.season = season;
        this.godName = godName;
        this.godMonthNumber = godMonthNumber;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getMonthNumber() {
        return monthNumber;
    }

    public void setMonthNumber(Integer monthNumber) {
        this.monthNumber = monthNumber;
    }

    public String getMonthName() {
        return monthName;
    }

    public void setMonthName(String monthName) {
        this.monthName = monthName;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
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
}
