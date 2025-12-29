package com.inventory.service;

import com.inventory.entity.CalendarMonth;
import com.inventory.repository.CalendarMonthRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class PyarrCalendarService {
    
    @Autowired
    private CalendarMonthRepository calendarMonthRepository;
    
    // Constants
    public static final int DAYS_PER_YEAR = 620;
    public static final int DAYS_PER_MONTH = 20;
    public static final int MONTHS_PER_YEAR = 31;
    
    /**
     * Calculate month number from day of year (1-620)
     * @param dayOfYear 1-620
     * @return month number 1-31
     */
    public int getMonthNumber(int dayOfYear) {
        if (dayOfYear < 1 || dayOfYear > DAYS_PER_YEAR) {
            throw new IllegalArgumentException("Day of year must be between 1 and " + DAYS_PER_YEAR);
        }
        return ((dayOfYear - 1) / DAYS_PER_MONTH) + 1;
    }
    
    /**
     * Calculate day within month from day of year
     * @param dayOfYear 1-620
     * @return day within month 1-20
     */
    public int getDayInMonth(int dayOfYear) {
        if (dayOfYear < 1 || dayOfYear > DAYS_PER_YEAR) {
            throw new IllegalArgumentException("Day of year must be between 1 and " + DAYS_PER_YEAR);
        }
        return ((dayOfYear - 1) % DAYS_PER_MONTH) + 1;
    }
    
    /**
     * Get CalendarMonth information for a given day of year
     * @param dayOfYear 1-620
     * @return CalendarMonth object
     */
    public CalendarMonth getCalendarMonth(int dayOfYear) {
        int monthNumber = getMonthNumber(dayOfYear);
        return calendarMonthRepository.findByMonthNumber(monthNumber)
                .orElseThrow(() -> new RuntimeException("Calendar month not found for month number: " + monthNumber));
    }
    
    /**
     * Format a date in Pyarr calendar format
     * Example: "3692, Csend 12 (Darton's 2nd month, Hideg évszak)"
     * @param year the year
     * @param dayOfYear 1-620
     * @return formatted date string
     */
    public String formatDate(int year, int dayOfYear) {
        CalendarMonth month = getCalendarMonth(dayOfYear);
        int dayInMonth = getDayInMonth(dayOfYear);
        
        String ordinal = getOrdinal(month.getGodMonthNumber());
        
        return String.format("%d, %s %d (%s's %s month, %s)",
                year,
                month.getMonthName(),
                dayInMonth,
                month.getGodName(),
                ordinal,
                month.getSeason());
    }
    
    /**
     * Get ordinal suffix for god's month number
     */
    private String getOrdinal(int number) {
        if (number >= 11 && number <= 13) {
            return number + "th";
        }
        switch (number % 10) {
            case 1: return number + "st";
            case 2: return number + "nd";
            case 3: return number + "rd";
            default: return number + "th";
        }
    }
    
    /**
     * Increment day by one, handling year rollover
     * @param year current year
     * @param dayOfYear current day (1-620)
     * @return Map with "year" and "day" keys
     */
    public Map<String, Integer> incrementDay(int year, int dayOfYear) {
        Map<String, Integer> result = new HashMap<>();
        
        if (dayOfYear >= DAYS_PER_YEAR) {
            result.put("year", year + 1);
            result.put("day", 1);
        } else {
            result.put("year", year);
            result.put("day", dayOfYear + 1);
        }
        
        return result;
    }
    
    /**
     * Decrement day by one, handling year rollover
     * @param year current year
     * @param dayOfYear current day (1-620)
     * @return Map with "year" and "day" keys
     */
    public Map<String, Integer> decrementDay(int year, int dayOfYear) {
        Map<String, Integer> result = new HashMap<>();
        
        if (dayOfYear <= 1) {
            result.put("year", year - 1);
            result.put("day", DAYS_PER_YEAR);
        } else {
            result.put("year", year);
            result.put("day", dayOfYear - 1);
        }
        
        return result;
    }
    
    /**
     * Validate day of year
     */
    public boolean isValidDay(int dayOfYear) {
        return dayOfYear >= 1 && dayOfYear <= DAYS_PER_YEAR;
    }
}
