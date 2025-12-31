package com.inventory.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "characters", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"name", "user_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Character {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Pyarr Calendar Fields
    @Column(name = "current_year")
    private Integer currentYear;

    @Column(name = "current_day")
    private Integer currentDay; // Day of year (1-620)

    @OneToMany(mappedBy = "character", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Inventory> inventories = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        // Set default calendar date if not provided
        if (currentYear == null) {
            currentYear = 3692; // Default starting year
        }
        if (currentDay == null) {
            currentDay = 1; // Default to first day of year
        }
    }

    public Character(String name, User user) {
        this.name = name;
        this.user = user;
    }
}
