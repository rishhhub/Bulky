package org.bulkby.app.controller.admin;

import org.bulkby.auth.dto.SellerProfileDTO;
import org.bulkby.auth.service.ProfileService;
import org.bulkby.auth.service.SellerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/sellers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSellerController {

    @Autowired
    private SellerService sellerService;

    @Autowired
    private ProfileService profileService;

    @GetMapping
    public ResponseEntity<List<SellerProfileDTO>> getAllSellers() {
        List<SellerProfileDTO> sellers = sellerService.getAllSellers();
        return ResponseEntity.ok(sellers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SellerProfileDTO> getSellerDetails(@PathVariable("id") Long sellerId) {
        SellerProfileDTO seller = sellerService.getSellerProfile(sellerId);
        return ResponseEntity.ok(seller);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<SellerProfileDTO> approveSeller(@PathVariable("id") Long sellerId) {
        Long adminId = profileService.getCurrentUser().getId();
        SellerProfileDTO approved = sellerService.approveSeller(sellerId, adminId);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<SellerProfileDTO> rejectSeller(
            @PathVariable("id") Long sellerId,
            @RequestBody Map<String, String> request) {
        Long adminId = profileService.getCurrentUser().getId();
        String rejectionReason = request.get("rejectionReason");
        SellerProfileDTO rejected = sellerService.rejectSeller(sellerId, adminId, rejectionReason);
        return ResponseEntity.ok(rejected);
    }
}
