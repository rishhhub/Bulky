package org.bulkby.catalog.service.impl;

import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.catalog.model.Category;
import org.bulkby.catalog.model.Product;
import org.bulkby.catalog.repository.CategoryRepository;
import org.bulkby.catalog.repository.ProductRepository;
import org.bulkby.catalog.service.ProductService;
import org.bulkby.catalog.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private ReviewService reviewService;
    
    /**
     * Get all category IDs including the given category and all its descendants (recursive)
     */
    private List<Long> getCategoryIdsIncludingChildren(Long categoryId) {
        List<Long> categoryIds = new ArrayList<>();
        categoryIds.add(categoryId);
        
        // Get all direct children
        List<Category> children = categoryRepository.findByParentId(categoryId);
        for (Category child : children) {
            if (child.getActive()) {
                // Recursively add children and their descendants
                categoryIds.addAll(getCategoryIdsIncludingChildren(child.getId()));
            }
        }
        
        return categoryIds;
    }
    
    private ProductDTO convertToDTO(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setMinOrderQuantity(product.getMinOrderQuantity());
        dto.setSourceUrl(product.getSourceUrl());
        dto.setSellerInfo(product.getSellerInfo());
        dto.setImageUrl(product.getImageUrl());
        
        // Handle multiple images - use imageUrls if available, otherwise fall back to imageUrl
        if (product.getImageUrls() != null && !product.getImageUrls().isEmpty()) {
            dto.setImageUrls(product.getImageUrls());
            // Set first image as imageUrl for backward compatibility
            if (dto.getImageUrl() == null && !product.getImageUrls().isEmpty()) {
                dto.setImageUrl(product.getImageUrls().get(0));
            }
        } else if (product.getImageUrl() != null) {
            // If only imageUrl exists, create a list with it
            List<String> imageUrls = new ArrayList<>();
            imageUrls.add(product.getImageUrl());
            dto.setImageUrls(imageUrls);
        }
        
        // Category information
        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getId());
            dto.setCategoryName(product.getCategory().getName());
            
            // Build category path and breadcrumbs
            Category category = product.getCategory();
            List<String> breadcrumbs = new ArrayList<>();
            Category current = category;
            while (current != null) {
                breadcrumbs.add(0, current.getName()); // Add to beginning
                current = current.getParent();
            }
            dto.setCategoryBreadcrumbs(breadcrumbs);
            dto.setCategoryPath(String.join(" > ", breadcrumbs));
        }
        
        dto.setActive(product.getActive());
        dto.setBaseDeliveryCost(product.getBaseDeliveryCost());
        dto.setWeightPerUnit(product.getWeightPerUnit());
        dto.setCreatedAt(product.getCreatedAt());
        
        // Seller-related fields (needed for order placement and amount-to-pay-seller calculation)
        dto.setCostPerUnit(product.getCostPerUnit());
        dto.setDeliveryCostPerMinOrder(product.getDeliveryCostPerMinOrder());
        dto.setPlatformFee(product.getPlatformFee());
        dto.setListedPrice(product.getListedPrice());
        dto.setCreatedBy(product.getCreatedBy());
        dto.setRequiresApproval(product.getRequiresApproval());
        dto.setApprovalStatus(product.getApprovalStatus());
        dto.setApprovedAt(product.getApprovedAt());
        dto.setRejectedAt(product.getRejectedAt());
        dto.setRejectionReason(product.getRejectionReason());
        if (product.getSeller() != null) {
            dto.setSellerId(product.getSeller().getId());
            dto.setSellerName(product.getSeller().getFullName());
        }
        
        // Calculate average rating and review count
        dto.setAverageRating(reviewService.getAverageRating(product.getId()));
        dto.setReviewCount(reviewService.getReviewCount(product.getId()));
        
        return dto;
    }
    
    private Product convertToEntity(ProductDTO dto) {
        Product product = new Product();
        if (dto.getId() != null) {
            product.setId(dto.getId());
        }
        // Validate required fields
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new RuntimeException("Product name is required");
        }
        if (dto.getPrice() == null || dto.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Product price must be greater than 0");
        }
        if (dto.getMinOrderQuantity() == null || dto.getMinOrderQuantity() < 1) {
            throw new RuntimeException("Minimum order quantity must be at least 1");
        }
        if (dto.getCategoryId() == null) {
            throw new RuntimeException("Category is required. Products cannot be created without a category.");
        }
        
        // Sanitize input to prevent XSS
        product.setName(org.bulkby.common.util.InputSanitizer.sanitize(dto.getName()));
        product.setDescription(dto.getDescription() != null && !dto.getDescription().trim().isEmpty() 
            ? org.bulkby.common.util.InputSanitizer.sanitizeAllowBasicFormatting(dto.getDescription().trim()) : null);
        product.setPrice(dto.getPrice());
        product.setMinOrderQuantity(dto.getMinOrderQuantity());
        product.setSourceUrl(dto.getSourceUrl() != null && !dto.getSourceUrl().trim().isEmpty() 
            ? org.bulkby.common.util.InputSanitizer.sanitizeUrl(dto.getSourceUrl().trim()) : null);
        product.setSellerInfo(dto.getSellerInfo() != null && !dto.getSellerInfo().trim().isEmpty() 
            ? org.bulkby.common.util.InputSanitizer.sanitize(dto.getSellerInfo().trim()) : null);
        
        // Handle images - prefer imageUrls, fall back to imageUrl
        // Sanitize image URLs to prevent XSS
        if (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty()) {
            product.setImageUrls(dto.getImageUrls().stream()
                    .filter(url -> url != null && !url.trim().isEmpty())
                    .map(url -> org.bulkby.common.util.InputSanitizer.sanitizeUrl(url.trim()))
                    .filter(url -> url != null) // Remove invalid URLs
                    .collect(Collectors.toList()));
            // Set first image as imageUrl for backward compatibility
            if (!product.getImageUrls().isEmpty()) {
                product.setImageUrl(product.getImageUrls().get(0));
            }
        } else if (dto.getImageUrl() != null && !dto.getImageUrl().trim().isEmpty()) {
            String sanitizedUrl = org.bulkby.common.util.InputSanitizer.sanitizeUrl(dto.getImageUrl().trim());
            if (sanitizedUrl != null) {
                product.setImageUrl(sanitizedUrl);
                List<String> imageUrls = new ArrayList<>();
                imageUrls.add(product.getImageUrl());
                product.setImageUrls(imageUrls);
            }
        }
        
        // Category - required
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + dto.getCategoryId()));
        product.setCategory(category);
        
        product.setActive(dto.getActive() != null ? dto.getActive() : true);
        product.setBaseDeliveryCost(dto.getBaseDeliveryCost() != null ? dto.getBaseDeliveryCost() : BigDecimal.ZERO);
        product.setWeightPerUnit(dto.getWeightPerUnit() != null ? dto.getWeightPerUnit() : BigDecimal.ONE);
        return product;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getAllProducts() {
        // Return all active products - minOrderQuantity is just informational (seller's minimum)
        return productRepository.findByActiveTrue()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> searchProducts(String searchTerm, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, 
                                          String sortBy, String sortOrder) {
        Specification<Product> spec = Specification.where(null);
        
        // Only show active products for public search
        spec = spec.and((root, query, cb) -> cb.equal(root.get("active"), true));
        
        // Search term filter
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String searchPattern = "%" + searchTerm.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> 
                cb.or(
                    cb.like(cb.lower(root.get("name")), searchPattern),
                    cb.like(cb.lower(root.get("description")), searchPattern)
                )
            );
        }
        
        // Category filter - include subcategories (hierarchical filtering)
        if (categoryId != null) {
            // Get all category IDs including the selected category and all its descendants
            List<Long> categoryIds = getCategoryIdsIncludingChildren(categoryId);
            spec = spec.and((root, query, cb) -> 
                root.get("category").get("id").in(categoryIds)
            );
        }
        
        // Price range filter
        if (minPrice != null) {
            spec = spec.and((root, query, cb) -> 
                cb.greaterThanOrEqualTo(root.get("price"), minPrice)
            );
        }
        if (maxPrice != null) {
            spec = spec.and((root, query, cb) -> 
                cb.lessThanOrEqualTo(root.get("price"), maxPrice)
            );
        }
        
        // Sorting
        Sort sort = Sort.by(Sort.Direction.ASC, "name"); // default
        if (sortBy != null && !sortBy.trim().isEmpty()) {
            Sort.Direction direction = "desc".equalsIgnoreCase(sortOrder) ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, sortBy);
        }
        
        return productRepository.findAll(spec, sort)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getAllProductsForAdmin() {
        return productRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return convertToDTO(product);
    }
    
    @Override
    @Transactional
    public ProductDTO createProduct(ProductDTO productDTO) {
        Product product = convertToEntity(productDTO);
        product = productRepository.save(product);
        return convertToDTO(product);
    }
    
    @Override
    @Transactional
    public ProductDTO updateProduct(Long id, ProductDTO productDTO) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        
        product.setName(productDTO.getName());
        product.setDescription(productDTO.getDescription());
        product.setPrice(productDTO.getPrice());
        product.setMinOrderQuantity(productDTO.getMinOrderQuantity());
        product.setSourceUrl(productDTO.getSourceUrl());
        product.setSellerInfo(productDTO.getSellerInfo());
        
        // Handle images
        if (productDTO.getImageUrls() != null && !productDTO.getImageUrls().isEmpty()) {
            product.setImageUrls(productDTO.getImageUrls().stream()
                    .filter(url -> url != null && !url.trim().isEmpty())
                    .collect(Collectors.toList()));
            if (!product.getImageUrls().isEmpty()) {
                product.setImageUrl(product.getImageUrls().get(0));
            }
        } else if (productDTO.getImageUrl() != null && !productDTO.getImageUrl().trim().isEmpty()) {
            product.setImageUrl(productDTO.getImageUrl());
            List<String> imageUrls = new ArrayList<>();
            imageUrls.add(product.getImageUrl());
            product.setImageUrls(imageUrls);
        }
        
        // Category
        if (productDTO.getCategoryId() != null) {
            Category category = categoryRepository.findById(productDTO.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + productDTO.getCategoryId()));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }
        
        if (productDTO.getActive() != null) {
            product.setActive(productDTO.getActive());
        }
        if (productDTO.getBaseDeliveryCost() != null) {
            product.setBaseDeliveryCost(productDTO.getBaseDeliveryCost());
        }
        if (productDTO.getWeightPerUnit() != null) {
            product.setWeightPerUnit(productDTO.getWeightPerUnit());
        }
        
        product = productRepository.save(product);
        return convertToDTO(product);
    }
    
    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        product.setActive(false);
        productRepository.save(product);
    }
}
