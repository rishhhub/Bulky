package org.bulkby.app.controller.admin;

import org.bulkby.catalog.dto.CategoryRequestDTO;
import org.bulkby.catalog.service.CategoryRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.bulkby.auth.service.ProfileService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/category-requests")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryRequestController {

    @Autowired
    private CategoryRequestService categoryRequestService;

    @Autowired
    private ProfileService profileService;

    @GetMapping
    public ResponseEntity<List<CategoryRequestDTO>> getAllCategoryRequests() {
        List<CategoryRequestDTO> requests = categoryRequestService.getAllPendingRequests();
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<CategoryRequestDTO> approveCategoryRequest(@PathVariable("id") Long requestId) {
        Long adminId = profileService.getCurrentUser().getId();
        CategoryRequestDTO approved = categoryRequestService.approveRequest(requestId, adminId);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<CategoryRequestDTO> rejectCategoryRequest(
            @PathVariable("id") Long requestId,
            @RequestBody Map<String, String> request) {
        Long adminId = profileService.getCurrentUser().getId();
        String rejectionReason = request.get("rejectionReason");
        CategoryRequestDTO rejected = categoryRequestService.rejectRequest(requestId, adminId, rejectionReason);
        return ResponseEntity.ok(rejected);
    }
}
