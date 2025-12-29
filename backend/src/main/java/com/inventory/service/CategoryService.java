package com.inventory.service;

import com.inventory.entity.Category;
import com.inventory.dto.CategoryRequest;
import com.inventory.repository.CategoryRepository;
import com.inventory.repository.InventoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;

    public CategoryService(CategoryRepository categoryRepository, InventoryRepository inventoryRepository) {
        this.categoryRepository = categoryRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new RuntimeException("Category already exists");
        }
        
        Category category = new Category();
        category.setName(request.getName());
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getName().equals(request.getName()) && 
            categoryRepository.existsByName(request.getName())) {
            throw new RuntimeException("Category name already exists");
        }

        category.setName(request.getName());
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        // Check if category is in use
        long count = inventoryRepository.countByCategoryEntity(category);
        if (count > 0) {
            throw new RuntimeException("Cannot delete category that is in use");
        }

        categoryRepository.delete(category);
    }
}
