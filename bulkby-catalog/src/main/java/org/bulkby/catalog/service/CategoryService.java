package org.bulkby.catalog.service;

import org.bulkby.catalog.dto.CategoryDTO;

import java.util.List;

public interface CategoryService {
    List<CategoryDTO> getAllCategories();
    List<CategoryDTO> getAllCategoriesForAdmin();
    List<CategoryDTO> getAllCategoriesFlat();
    CategoryDTO getCategoryById(Long id);
    CategoryDTO createCategory(CategoryDTO categoryDTO);
    CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO);
    void deleteCategory(Long id);
}
