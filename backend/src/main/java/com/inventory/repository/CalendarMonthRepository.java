package com.inventory.repository;

import com.inventory.entity.CalendarMonth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CalendarMonthRepository extends JpaRepository<CalendarMonth, Long> {
    Optional<CalendarMonth> findByMonthNumber(Integer monthNumber);
}
