package org.bulkby.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private Boolean active;
    private LocalDateTime createdAt;
    private Long parentId;
    private String parentName;
    private java.util.List<CategoryDTO> children;
    private Long productCount; // Number of products in this category (including subcategories)
    private String path; // Full path like "Electronics > Computers > Laptops"
    private java.util.List<String> breadcrumbs; // List of category names in path
}
