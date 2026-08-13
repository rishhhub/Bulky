package org.bulkby.catalog.service.impl;

import org.bulkby.auth.model.User;
import org.bulkby.auth.repository.UserRepository;
import org.bulkby.auth.service.SellerService;
import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.catalog.model.Category;
import org.bulkby.catalog.model.Product;
import org.bulkby.catalog.repository.CategoryRepository;
import org.bulkby.catalog.repository.ProductRepository;
import org.bulkby.catalog.service.SellerProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SellerProductServiceImpl implements SellerProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SellerService sellerService;
    
    @Value("${logistics.weight-multiplier:2.5}")
    private Double weightMultiplier;
    
    @Override
    @Transactional
    public ProductDTO createProduct(Long sellerId, ProductDTO productDTO) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));
        
        // Check if seller profile is complete
        if (!sellerService.isProfileComplete(sellerId)) {
            throw new RuntimeException("Seller profile must be complete (company, PAN, GSTIN) before adding products");
        }
        
        // Validate required fields
        if (productDTO.getCostPerUnit() == null || productDTO.getCostPerUnit().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Cost per unit is required and must be greater than 0");
        }
        if (productDTO.getDeliveryCostPerMinOrder() == null || productDTO.getDeliveryCostPerMinOrder().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Delivery cost per minimum order is required and must be non-negative");
        }
        if (productDTO.getMinOrderQuantity() == null || productDTO.getMinOrderQuantity() < 1) {
            throw new RuntimeException("Minimum order quantity must be at least 1");
        }
        if (productDTO.getWeightPerUnit() == null || productDTO.getWeightPerUnit().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Weight per unit is required and must be greater than 0");
        }
        
        // Calculate listed price
        BigDecimal listedPrice = calculateListedPrice(
            productDTO.getCostPerUnit(),
            productDTO.getDeliveryCostPerMinOrder(),
            productDTO.getMinOrderQuantity()
        );
        
        // Calculate platform fee
        BigDecimal platformFee = calculatePlatformFee(productDTO.getCostPerUnit());
        
        // Create product
        Product product = new Product();
        product.setName(productDTO.getName());
        product.setDescription(productDTO.getDescription());
        product.setPrice(listedPrice); // Set calculated listed price
        product.setMinOrderQuantity(productDTO.getMinOrderQuantity());
        product.setSourceUrl(productDTO.getSourceUrl());
        product.setSellerInfo(productDTO.getSellerInfo());
        product.setImageUrl(productDTO.getImageUrl());
        product.setImageUrls(productDTO.getImageUrls() != null ? productDTO.getImageUrls() : new ArrayList<>());
        product.setActive(false); // Inactive until approved
        product.setBaseDeliveryCost(BigDecimal.ZERO); // Will be set on approval
        product.setWeightPerUnit(productDTO.getWeightPerUnit());
        
        // Set category
        if (productDTO.getCategoryId() != null) {
            Category category = categoryRepository.findById(productDTO.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);
        }
        
        // Set seller-related fields
        product.setSeller(seller);
        product.setCreatedBy(Product.CreatedBy.SELLER);
        product.setRequiresApproval(true);
        product.setApprovalStatus(Product.ApprovalStatus.PENDING);
        product.setCostPerUnit(productDTO.getCostPerUnit());
        product.setDeliveryCostPerMinOrder(productDTO.getDeliveryCostPerMinOrder());
        product.setPlatformFee(platformFee);
        product.setListedPrice(listedPrice);
        
        product = productRepository.save(product);
        
        return convertToDTO(product);
    }
    
    @Override
    public BigDecimal calculateListedPrice(BigDecimal costPerUnit, BigDecimal deliveryCostPerMinOrder, Integer minOrderQuantity) {
        if (costPerUnit == null || deliveryCostPerMinOrder == null || minOrderQuantity == null || minOrderQuantity <= 0) {
            throw new RuntimeException("Invalid parameters for price calculation");
        }
        
        // Calculate delivery cost per unit
        BigDecimal deliveryCostPerUnit = deliveryCostPerMinOrder
            .divide(BigDecimal.valueOf(minOrderQuantity), 4, RoundingMode.HALF_UP);
        
        // Calculate platform fee
        BigDecimal platformFee = calculatePlatformFee(costPerUnit);
        
        // Total listed price
        BigDecimal listedPrice = costPerUnit
            .add(deliveryCostPerUnit)
            .add(platformFee)
            .setScale(2, RoundingMode.HALF_UP);
        
        return listedPrice;
    }
    
    private BigDecimal calculatePlatformFee(BigDecimal costPerUnit) {
        // Platform fee = min(10% of costPerUnit, 100)
        BigDecimal tenPercent = costPerUnit.multiply(new BigDecimal("0.10"));
        BigDecimal maxFee = new BigDecimal("100");
        return tenPercent.min(maxFee).setScale(2, RoundingMode.HALF_UP);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getSellerProducts(Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));
        
        List<Product> products = productRepository.findBySeller(seller);
        return products.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public ProductDTO updateProduct(Long sellerId, Long productId, ProductDTO productDTO) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        // Verify product belongs to seller
        if (product.getSeller() == null || !product.getSeller().getId().equals(sellerId)) {
            throw new RuntimeException("Product does not belong to this seller");
        }
        
        // Don't allow updates if product is approved (unless admin)
        if (product.getApprovalStatus() == Product.ApprovalStatus.APPROVED) {
            throw new RuntimeException("Cannot update approved product. Contact admin for changes.");
        }
        
        // Update fields
        if (productDTO.getName() != null) {
            product.setName(productDTO.getName());
        }
        if (productDTO.getDescription() != null) {
            product.setDescription(productDTO.getDescription());
        }
        if (productDTO.getCostPerUnit() != null) {
            product.setCostPerUnit(productDTO.getCostPerUnit());
        }
        if (productDTO.getDeliveryCostPerMinOrder() != null) {
            product.setDeliveryCostPerMinOrder(productDTO.getDeliveryCostPerMinOrder());
        }
        if (productDTO.getMinOrderQuantity() != null) {
            product.setMinOrderQuantity(productDTO.getMinOrderQuantity());
        }
        if (productDTO.getWeightPerUnit() != null) {
            product.setWeightPerUnit(productDTO.getWeightPerUnit());
        }
        if (productDTO.getCategoryId() != null) {
            Category category = categoryRepository.findById(productDTO.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);
        }
        
        // Recalculate listed price if cost or delivery cost changed
        if (productDTO.getCostPerUnit() != null || productDTO.getDeliveryCostPerMinOrder() != null) {
            BigDecimal listedPrice = calculateListedPrice(
                product.getCostPerUnit(),
                product.getDeliveryCostPerMinOrder(),
                product.getMinOrderQuantity()
            );
            product.setListedPrice(listedPrice);
            product.setPrice(listedPrice);
            product.setPlatformFee(calculatePlatformFee(product.getCostPerUnit()));
        }
        
        // Reset approval status if product was rejected
        if (product.getApprovalStatus() == Product.ApprovalStatus.REJECTED) {
            product.setApprovalStatus(Product.ApprovalStatus.PENDING);
            product.setRejectedAt(null);
            product.setRejectionReason(null);
        }
        
        product = productRepository.save(product);
        
        return convertToDTO(product);
    }
    
    @Override
    @Transactional
    public void deleteProduct(Long sellerId, Long productId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        // Verify product belongs to seller
        if (product.getSeller() == null || !product.getSeller().getId().equals(sellerId)) {
            throw new RuntimeException("Product does not belong to this seller");
        }
        
        productRepository.delete(product);
    }
    
    @Override
    @Transactional
    public ProductDTO approveProduct(Long productId, Long adminId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        if (product.getApprovalStatus() == Product.ApprovalStatus.APPROVED) {
            throw new RuntimeException("Product is already approved");
        }
        
        // Set baseDeliveryCost based on weightPerUnit
        if (product.getWeightPerUnit() != null) {
            BigDecimal baseDeliveryCost = product.getWeightPerUnit()
                .multiply(BigDecimal.valueOf(weightMultiplier))
                .setScale(2, RoundingMode.HALF_UP);
            product.setBaseDeliveryCost(baseDeliveryCost);
        }
        
        product.setApprovalStatus(Product.ApprovalStatus.APPROVED);
        product.setApprovedAt(LocalDateTime.now());
        product.setActive(true); // Activate product
        product.setRejectedAt(null);
        product.setRejectionReason(null);
        
        product = productRepository.save(product);
        
        return convertToDTO(product);
    }
    
    @Override
    @Transactional
    public ProductDTO rejectProduct(Long productId, Long adminId, String rejectionReason) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setApprovalStatus(Product.ApprovalStatus.REJECTED);
        product.setRejectedAt(LocalDateTime.now());
        product.setRejectionReason(rejectionReason);
        product.setActive(false);
        product.setApprovedAt(null);
        
        product = productRepository.save(product);
        
        return convertToDTO(product);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getPendingProductApprovals() {
        List<Product> products = productRepository.findAll().stream()
                .filter(p -> p.getSeller() != null && 
                            p.getRequiresApproval() != null && 
                            p.getRequiresApproval() &&
                            p.getApprovalStatus() == Product.ApprovalStatus.PENDING)
                .collect(Collectors.toList());
        
        return products.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
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
        dto.setImageUrls(product.getImageUrls() != null ? product.getImageUrls() : new ArrayList<>());
        dto.setActive(product.getActive());
        dto.setBaseDeliveryCost(product.getBaseDeliveryCost());
        dto.setWeightPerUnit(product.getWeightPerUnit());
        dto.setCreatedAt(product.getCreatedAt());
        
        // Category information
        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getId());
            dto.setCategoryName(product.getCategory().getName());
        }
        
        // Seller-related fields
        if (product.getSeller() != null) {
            dto.setSellerId(product.getSeller().getId());
            dto.setSellerName(product.getSeller().getFullName());
        }
        dto.setCreatedBy(product.getCreatedBy());
        dto.setRequiresApproval(product.getRequiresApproval());
        dto.setApprovalStatus(product.getApprovalStatus());
        dto.setCostPerUnit(product.getCostPerUnit());
        dto.setDeliveryCostPerMinOrder(product.getDeliveryCostPerMinOrder());
        dto.setPlatformFee(product.getPlatformFee());
        dto.setListedPrice(product.getListedPrice());
        dto.setApprovedAt(product.getApprovedAt());
        dto.setRejectedAt(product.getRejectedAt());
        dto.setRejectionReason(product.getRejectionReason());
        
        return dto;
    }
}
