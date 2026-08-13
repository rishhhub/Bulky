package org.bulkby.catalog.service.impl;

import org.bulkby.auth.model.User;
import org.bulkby.auth.repository.UserRepository;
import org.bulkby.catalog.dto.CategoryRequestDTO;
import org.bulkby.catalog.model.Category;
import org.bulkby.catalog.model.CategoryRequest;
import org.bulkby.catalog.repository.CategoryRepository;
import org.bulkby.catalog.repository.CategoryRequestRepository;
import org.bulkby.catalog.service.CategoryRequestService;
import org.bulkby.catalog.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryRequestServiceImpl implements CategoryRequestService {
    
    @Autowired
    private CategoryRequestRepository categoryRequestRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CategoryService categoryService;
    
    @Override
    @Transactional
    public CategoryRequestDTO requestCategory(Long sellerId, CategoryRequestDTO requestDTO) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));
        
        // Check if category with same name already exists
        if (categoryRepository.existsByNameIgnoreCase(requestDTO.getCategoryName())) {
            throw new RuntimeException("Category with this name already exists");
        }
        
        // Check if there's already a pending request with same name
        List<CategoryRequest> existingRequests = categoryRequestRepository.findByStatus(
            CategoryRequest.RequestStatus.PENDING);
        for (CategoryRequest req : existingRequests) {
            if (req.getCategoryName().equalsIgnoreCase(requestDTO.getCategoryName())) {
                throw new RuntimeException("A pending request for this category name already exists");
            }
        }
        
        CategoryRequest categoryRequest = new CategoryRequest();
        categoryRequest.setSeller(seller);
        categoryRequest.setCategoryName(requestDTO.getCategoryName());
        categoryRequest.setDescription(requestDTO.getDescription());
        categoryRequest.setStatus(CategoryRequest.RequestStatus.PENDING);
        
        categoryRequest = categoryRequestRepository.save(categoryRequest);
        
        return convertToDTO(categoryRequest);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CategoryRequestDTO> getSellerRequests(Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));
        
        List<CategoryRequest> requests = categoryRequestRepository.findBySeller(seller);
        return requests.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CategoryRequestDTO> getAllPendingRequests() {
        List<CategoryRequest> requests = categoryRequestRepository.findByStatus(
            CategoryRequest.RequestStatus.PENDING);
        return requests.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public CategoryRequestDTO approveRequest(Long requestId, Long adminId) {
        CategoryRequest request = categoryRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Category request not found"));
        
        if (request.getStatus() != CategoryRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Category request is not pending");
        }
        
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        // Check if category already exists
        if (categoryRepository.existsByNameIgnoreCase(request.getCategoryName())) {
            throw new RuntimeException("Category with this name already exists");
        }
        
        // Create the category
        org.bulkby.catalog.dto.CategoryDTO categoryDTO = new org.bulkby.catalog.dto.CategoryDTO();
        categoryDTO.setName(request.getCategoryName());
        categoryDTO.setDescription(request.getDescription());
        categoryDTO.setActive(true);
        categoryService.createCategory(categoryDTO);
        
        // Update request status
        request.setStatus(CategoryRequest.RequestStatus.APPROVED);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(admin);
        request.setRejectionReason(null);
        
        request = categoryRequestRepository.save(request);
        
        return convertToDTO(request);
    }
    
    @Override
    @Transactional
    public CategoryRequestDTO rejectRequest(Long requestId, Long adminId, String rejectionReason) {
        CategoryRequest request = categoryRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Category request not found"));
        
        if (request.getStatus() != CategoryRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Category request is not pending");
        }
        
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        request.setStatus(CategoryRequest.RequestStatus.REJECTED);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(admin);
        request.setRejectionReason(rejectionReason);
        
        request = categoryRequestRepository.save(request);
        
        return convertToDTO(request);
    }
    
    private CategoryRequestDTO convertToDTO(CategoryRequest request) {
        CategoryRequestDTO dto = new CategoryRequestDTO();
        dto.setId(request.getId());
        dto.setSellerId(request.getSeller().getId());
        dto.setSellerName(request.getSeller().getFullName());
        dto.setCategoryName(request.getCategoryName());
        dto.setDescription(request.getDescription());
        dto.setStatus(request.getStatus());
        dto.setCreatedAt(request.getCreatedAt());
        dto.setReviewedAt(request.getReviewedAt());
        if (request.getReviewedBy() != null) {
            dto.setReviewedBy(request.getReviewedBy().getId());
            dto.setReviewedByName(request.getReviewedBy().getFullName());
        }
        dto.setRejectionReason(request.getRejectionReason());
        return dto;
    }
}
