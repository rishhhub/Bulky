package org.bulkby.app.controller.admin;

import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.catalog.service.SellerProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.bulkby.auth.service.ProfileService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/seller-products")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSellerProductController {

    @Autowired
    private SellerProductService sellerProductService;

    @Autowired
    private ProfileService profileService;

    @GetMapping("/pending")
    public ResponseEntity<List<ProductDTO>> getPendingProductApprovals() {
        List<ProductDTO> products = sellerProductService.getPendingProductApprovals();
        return ResponseEntity.ok(products);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ProductDTO> approveProduct(@PathVariable("id") Long productId) {
        Long adminId = profileService.getCurrentUser().getId();
        ProductDTO approved = sellerProductService.approveProduct(productId, adminId);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ProductDTO> rejectProduct(
            @PathVariable("id") Long productId,
            @RequestBody Map<String, String> request) {
        Long adminId = profileService.getCurrentUser().getId();
        String rejectionReason = request.get("rejectionReason");
        ProductDTO rejected = sellerProductService.rejectProduct(productId, adminId, rejectionReason);
        return ResponseEntity.ok(rejected);
    }
}
