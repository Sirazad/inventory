package com.inventory.service;

import com.inventory.entity.CalendarMonth;
import java.util.Map;

public interface CalendarService {
    CalendarMonth getCalendarMonth(int dayOfYear);
    Map<String, Integer> incrementDay(int year, int dayOfYear);
    Map<String, Integer> decrementDay(int year, int dayOfYear);
}
