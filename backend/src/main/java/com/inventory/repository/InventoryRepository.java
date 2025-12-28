package com.inventory.repository;

import com.inventory.entity.Category;
import com.inventory.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long>, JpaSpecificationExecutor<Inventory> {
    List<Inventory> findByCharacterIdAndRemovedFalse(Long characterId);
    Optional<Inventory> findByIdAndCharacterId(Long id, Long characterId);
    long countByCategoryEntity(Category category);
}
