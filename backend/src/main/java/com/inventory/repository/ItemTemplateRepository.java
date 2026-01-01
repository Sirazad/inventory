package com.inventory.repository;

import com.inventory.entity.ItemTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemTemplateRepository extends JpaRepository<ItemTemplate, Long> {
    
    @Query("SELECT t FROM ItemTemplate t WHERE " +
           "(t.user IS NULL OR t.user.id = :userId) AND " +
           "LOWER(t.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<ItemTemplate> searchByName(@Param("name") String name, @Param("userId") Long userId);
    
    @Query("SELECT t FROM ItemTemplate t WHERE t.user IS NULL OR t.user.id = :userId")
    List<ItemTemplate> findAllAccessibleTemplates(@Param("userId") Long userId);
    
    Optional<ItemTemplate> findByIdAndUserId(Long id, Long userId);
    
    @Query("SELECT t FROM ItemTemplate t WHERE t.id = :id AND (t.user IS NULL OR t.user.id = :userId)")
    Optional<ItemTemplate> findByIdAndUserIdOrSystem(@Param("id") Long id, @Param("userId") Long userId);
}
