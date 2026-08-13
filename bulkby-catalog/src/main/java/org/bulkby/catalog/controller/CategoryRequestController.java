package org.bulkby.catalog.controller;

import org.bulkby.auth.service.ProfileService;
import org.bulkby.catalog.dto.CategoryRequestDTO;
import org.bulkby.catalog.service.CategoryRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/seller/category-requests")
public class CategoryRequestController {
    
    @Autowired
    private CategoryRequestService categoryRequestService;
    
    @Autowired
    private ProfileService profileService;
    
    /**
     * Request a new category (seller)
     */
    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<CategoryRequestDTO> requestCategory(@Valid @RequestBody CategoryRequestDTO requestDTO) {
        Long sellerId = profileService.getCurrentUser().getId();
        CategoryRequestDTO created = categoryRequestService.requestCategory(sellerId, requestDTO);
        return ResponseEntity.ok(created);
    }
    
    /**
     * Get all category requests for current seller
     */
    @GetMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<List<CategoryRequestDTO>> getSellerRequests() {
        Long sellerId = profileService.getCurrentUser().getId();
        List<CategoryRequestDTO> requests = categoryRequestService.getSellerRequests(sellerId);
        return ResponseEntity.ok(requests);
    }
}
