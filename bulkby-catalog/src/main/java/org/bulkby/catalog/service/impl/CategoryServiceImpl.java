package org.bulkby.catalog.service.impl;

import org.bulkby.catalog.dto.CategoryDTO;
import org.bulkby.catalog.model.Category;
import org.bulkby.catalog.repository.CategoryRepository;
import org.bulkby.catalog.repository.ProductRepository;
import org.bulkby.catalog.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    private CategoryDTO convertToDTO(Category category) {
        return convertToDTO(category, null);
    }
    
    private CategoryDTO convertToDTO(Category category, String parentPath) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setImageUrl(category.getImageUrl());
        dto.setActive(category.getActive());
        dto.setCreatedAt(category.getCreatedAt());
        
        // Build path and breadcrumbs
        String currentPath = parentPath != null ? parentPath + " > " + category.getName() : category.getName();
        dto.setPath(currentPath);
        
        List<String> breadcrumbs = new ArrayList<>();
        if (parentPath != null) {
            breadcrumbs.addAll(Arrays.asList(parentPath.split(" > ")));
        }
        breadcrumbs.add(category.getName());
        dto.setBreadcrumbs(breadcrumbs);
        
        if (category.getParent() != null) {
            dto.setParentId(category.getParent().getId());
            dto.setParentName(category.getParent().getName());
        }
        
        // Initialize children collection to trigger lazy loading if needed
        Set<Category> childrenSet = category.getChildren();
        if (childrenSet != null) {
            // Access the collection to trigger lazy loading
            childrenSet.size();
        }
        
        // Convert children recursively FIRST (to get their counts calculated)
        List<CategoryDTO> childrenDTOs = new ArrayList<>();
        if (childrenSet != null && !childrenSet.isEmpty()) {
            childrenDTOs = childrenSet.stream()
                    .filter(c -> c.getActive())
                    .map(child -> {
                        // Ensure child's children are also loaded
                        if (child.getChildren() != null) {
                            child.getChildren().size();
                        }
                        return convertToDTO(child, currentPath);
                    })
                    .collect(Collectors.toList());
        }
        dto.setChildren(childrenDTOs);
        
        // Get product count for this category (direct products only)
        Long productCount = productRepository.countByCategoryId(category.getId());
        productCount = productCount != null ? productCount : 0L;
        
        // Add counts from children (recursive - children already have their counts including sub-children)
        for (CategoryDTO childDTO : childrenDTOs) {
            if (childDTO.getProductCount() != null) {
                productCount += childDTO.getProductCount();
            }
        }
        dto.setProductCount(productCount);
        
        return dto;
    }
    
    private Category convertToEntity(CategoryDTO dto) {
        Category category = new Category();
        if (dto.getId() != null) {
            category.setId(dto.getId());
        }
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new RuntimeException("Category name is required");
        }
        category.setName(dto.getName().trim());
        category.setDescription(dto.getDescription() != null && !dto.getDescription().trim().isEmpty() ? dto.getDescription().trim() : null);
        category.setImageUrl(dto.getImageUrl() != null && !dto.getImageUrl().trim().isEmpty() ? dto.getImageUrl().trim() : null);
        category.setActive(dto.getActive() != null ? dto.getActive() : true);
        
        // Set parent if provided
        if (dto.getParentId() != null) {
            Category parent = categoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found with id: " + dto.getParentId()));
            category.setParent(parent);
        }
        
        return category;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        // Return only top-level categories (no parent) with their children
        // Use fetch join to ensure children are loaded
        List<Category> topLevelCategories;
        try {
            topLevelCategories = categoryRepository.findByActiveTrueAndParentIsNullWithChildren();
        } catch (Exception e) {
            // Fallback to regular query if fetch join doesn't work
            topLevelCategories = categoryRepository.findByActiveTrueAndParentIsNull();
        }
        return topLevelCategories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategoriesForAdmin() {
        // Return all categories including inactive ones, with full hierarchy
        // Load all categories first, then build the hierarchy
        List<Category> allCategories = categoryRepository.findAll();
        
        // Build a map of category ID to Category entity for quick lookup
        Map<Long, Category> categoryMap = allCategories.stream()
                .collect(Collectors.toMap(Category::getId, cat -> cat));
        
        // Build a map of parent ID to children for efficient lookup
        Map<Long, List<Category>> childrenMap = allCategories.stream()
                .filter(cat -> cat.getParent() != null)
                .collect(Collectors.groupingBy(cat -> cat.getParent().getId()));
        
        // Build a map of category ID to DTO to avoid recreating DTOs
        Map<Long, CategoryDTO> dtoMap = new HashMap<>();
        
        // Convert all categories to DTOs first (without children)
        for (Category category : allCategories) {
            CategoryDTO dto = new CategoryDTO();
            dto.setId(category.getId());
            dto.setName(category.getName());
            dto.setDescription(category.getDescription());
            dto.setImageUrl(category.getImageUrl());
            dto.setActive(category.getActive());
            dto.setCreatedAt(category.getCreatedAt());
            
            if (category.getParent() != null) {
                dto.setParentId(category.getParent().getId());
                dto.setParentName(category.getParent().getName());
            }
            
            dtoMap.put(category.getId(), dto);
        }
        
        // Now set children and build paths recursively
        for (Category category : allCategories) {
            CategoryDTO dto = dtoMap.get(category.getId());
            List<Category> childrenList = childrenMap.getOrDefault(category.getId(), new ArrayList<>());
            
            // Convert children to DTOs
            List<CategoryDTO> childrenDTOs = childrenList.stream()
                    .map(child -> dtoMap.get(child.getId()))
                    .collect(Collectors.toList());
            dto.setChildren(childrenDTOs);
            
            // Build path and breadcrumbs
            String path = buildPath(category, categoryMap, dtoMap, new HashSet<>());
            dto.setPath(path);
            dto.setBreadcrumbs(Arrays.asList(path.split(" > ")));
            
            // Calculate product count
            Long productCount = productRepository.countByCategoryId(category.getId());
            productCount = productCount != null ? productCount : 0L;
            for (CategoryDTO childDTO : childrenDTOs) {
                if (childDTO.getProductCount() != null) {
                    productCount += childDTO.getProductCount();
                }
            }
            dto.setProductCount(productCount);
        }
        
        // Get top-level categories (no parent)
        return allCategories.stream()
                .filter(cat -> cat.getParent() == null)
                .map(cat -> dtoMap.get(cat.getId()))
                .collect(Collectors.toList());
    }
    
    private String buildPath(Category category, Map<Long, Category> categoryMap, Map<Long, CategoryDTO> dtoMap, Set<Long> visited) {
        if (category.getParent() == null) {
            return category.getName();
        }
        
        // Prevent circular references
        if (visited.contains(category.getId())) {
            return category.getName(); // Return just the name if we've seen this category before
        }
        visited.add(category.getId());
        
        Category parent = category.getParent();
        CategoryDTO parentDTO = dtoMap.get(parent.getId());
        if (parentDTO != null && parentDTO.getPath() != null) {
            return parentDTO.getPath() + " > " + category.getName();
        }
        // If parent path not set yet, build it recursively
        String parentPath = buildPath(parent, categoryMap, dtoMap, visited);
        return parentPath + " > " + category.getName();
    }
    
    private CategoryDTO convertToDTOForAdmin(Category category, String parentPath) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setImageUrl(category.getImageUrl());
        dto.setActive(category.getActive());
        dto.setCreatedAt(category.getCreatedAt());
        
        // Build path and breadcrumbs
        String currentPath = parentPath != null ? parentPath + " > " + category.getName() : category.getName();
        dto.setPath(currentPath);
        
        List<String> breadcrumbs = new ArrayList<>();
        if (parentPath != null) {
            breadcrumbs.addAll(Arrays.asList(parentPath.split(" > ")));
        }
        breadcrumbs.add(category.getName());
        dto.setBreadcrumbs(breadcrumbs);
        
        if (category.getParent() != null) {
            dto.setParentId(category.getParent().getId());
            dto.setParentName(category.getParent().getName());
        }
        
        // Initialize children collection to trigger lazy loading if needed
        Set<Category> childrenSet = category.getChildren();
        if (childrenSet != null) {
            // Access the collection to trigger lazy loading
            childrenSet.size();
        }
        
        // Convert children recursively FIRST (including inactive ones for admin)
        // This ensures children counts are calculated before we add them to parent
        List<CategoryDTO> childrenDTOs = new ArrayList<>();
        if (childrenSet != null && !childrenSet.isEmpty()) {
            childrenDTOs = childrenSet.stream()
                    .map(child -> {
                        // Ensure child's children are also loaded
                        if (child.getChildren() != null) {
                            child.getChildren().size();
                        }
                        return convertToDTOForAdmin(child, currentPath);
                    })
                    .collect(Collectors.toList());
        }
        dto.setChildren(childrenDTOs);
        
        // Get product count for this category (direct products only)
        Long productCount = productRepository.countByCategoryId(category.getId());
        productCount = productCount != null ? productCount : 0L;
        
        // Add counts from children (recursive - children already have their counts including sub-children)
        for (CategoryDTO childDTO : childrenDTOs) {
            if (childDTO.getProductCount() != null) {
                productCount += childDTO.getProductCount();
            }
        }
        dto.setProductCount(productCount);
        
        return dto;
    }
    
    @Override
    public List<CategoryDTO> getAllCategoriesFlat() {
        // Return all categories in a flat list (for dropdowns)
        return categoryRepository.findAll()
                .stream()
                .map(cat -> {
                    CategoryDTO dto = new CategoryDTO();
                    dto.setId(cat.getId());
                    dto.setName(cat.getName());
                    dto.setDescription(cat.getDescription());
                    dto.setImageUrl(cat.getImageUrl());
                    dto.setActive(cat.getActive());
                    dto.setCreatedAt(cat.getCreatedAt());
                    if (cat.getParent() != null) {
                        dto.setParentId(cat.getParent().getId());
                        dto.setParentName(cat.getParent().getName());
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    @Override
    public CategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return convertToDTO(category);
    }
    
    @Override
    @Transactional
    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        // Check if category with same name already exists
        if (categoryRepository.findByName(categoryDTO.getName()).isPresent()) {
            throw new RuntimeException("Category with name '" + categoryDTO.getName() + "' already exists");
        }
        Category category = convertToEntity(categoryDTO);
        category = categoryRepository.save(category);
        return convertToDTO(category);
    }
    
    @Override
    @Transactional
    public CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        
        // Prevent circular reference - category cannot be its own parent
        if (categoryDTO.getParentId() != null && categoryDTO.getParentId().equals(id)) {
            throw new RuntimeException("Category cannot be its own parent");
        }
        
        // Check if name is being changed and if new name already exists
        if (!category.getName().equals(categoryDTO.getName())) {
            if (categoryRepository.findByName(categoryDTO.getName()).isPresent()) {
                throw new RuntimeException("Category with name '" + categoryDTO.getName() + "' already exists");
            }
        }
        
        category.setName(categoryDTO.getName());
        category.setDescription(categoryDTO.getDescription());
        category.setImageUrl(categoryDTO.getImageUrl());
        if (categoryDTO.getActive() != null) {
            category.setActive(categoryDTO.getActive());
        }
        
        // Update parent
        if (categoryDTO.getParentId() != null) {
            Category parent = categoryRepository.findById(categoryDTO.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found with id: " + categoryDTO.getParentId()));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
        
        category = categoryRepository.save(category);
        return convertToDTO(category);
    }
    
    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        category.setActive(false);
        categoryRepository.save(category);
    }
}
