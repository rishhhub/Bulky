package org.bulkby.catalog.service;

import org.bulkby.catalog.dto.CategoryRequestDTO;

import java.util.List;

public interface CategoryRequestService {
    
    /**
     * Request a new category (seller)
     */
    CategoryRequestDTO requestCategory(Long sellerId, CategoryRequestDTO requestDTO);
    
    /**
     * Get all category requests for a seller
     */
    List<CategoryRequestDTO> getSellerRequests(Long sellerId);
    
    /**
     * Get all pending category requests (admin)
     */
    List<CategoryRequestDTO> getAllPendingRequests();
    
    /**
     * Approve a category request and create the category (admin)
     */
    CategoryRequestDTO approveRequest(Long requestId, Long adminId);
    
    /**
     * Reject a category request (admin)
     */
    CategoryRequestDTO rejectRequest(Long requestId, Long adminId, String rejectionReason);
}
