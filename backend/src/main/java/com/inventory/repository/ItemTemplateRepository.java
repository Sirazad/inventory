package com.inventory.repository;

import com.inventory.entity.ItemTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemTemplateRepository extends JpaRepository<ItemTemplate, Long> {
    
    Page<ItemTemplate> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    @Query("SELECT t FROM ItemTemplate t WHERE " +
           "(:name IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:isContainer IS NULL OR t.isContainer = :isContainer) AND " +
           "(:category IS NULL OR LOWER(t.category) LIKE LOWER(CONCAT('%', :category, '%')))")
    Page<ItemTemplate> searchTemplates(
        @Param("name") String name,
        @Param("isContainer") Boolean isContainer,
        @Param("category") String category,
        Pageable pageable
    );
    
    boolean existsByName(String name);
}
