package org.bulkby.order.controller;

import org.bulkby.auth.repository.UserRepository;
import org.bulkby.order.dto.SellerFulfillmentRequest;
import org.bulkby.order.dto.SellerOrderDTO;
import org.bulkby.order.service.SellerOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/seller/orders")
@PreAuthorize("hasRole('SELLER')")
public class SellerOrderController {
    
    @Autowired
    private SellerOrderService sellerOrderService;
    
    @Autowired
    private UserRepository userRepository;
    
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new RuntimeException("User not authenticated");
        }
        String contact = authentication.getName();
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
    
    /**
     * Get all orders for the current seller
     */
    @GetMapping
    public ResponseEntity<List<SellerOrderDTO>> getMySellerOrders() {
        Long sellerId = getCurrentUserId();
        List<SellerOrderDTO> orders = sellerOrderService.getSellerOrdersBySellerId(sellerId);
        return ResponseEntity.ok(orders);
    }
    
    /**
     * Get a specific seller order by ID (only if it belongs to the current seller)
     */
    @GetMapping("/{id}")
    public ResponseEntity<SellerOrderDTO> getSellerOrder(@PathVariable("id") Long sellerOrderId) {
        Long sellerId = getCurrentUserId();
        List<SellerOrderDTO> allOrders = sellerOrderService.getSellerOrdersBySellerId(sellerId);
        
        SellerOrderDTO order = allOrders.stream()
                .filter(o -> o.getId().equals(sellerOrderId))
                .findFirst()
                .orElse(null);
        
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(order);
    }
    
    /**
     * Update fulfillment status: confirm order (PLACED → CONFIRMED) or mark as shipped (CONFIRMED/PLACED → SHIPPED).
     * When marking as shipped, trackingId is required.
     */
    @PutMapping("/{id}/fulfillment")
    public ResponseEntity<SellerOrderDTO> updateFulfillment(@PathVariable("id") Long sellerOrderId,
                                                           @RequestBody SellerFulfillmentRequest request) {
        Long sellerId = getCurrentUserId();
        SellerOrderDTO updated = sellerOrderService.updateSellerOrderFulfillment(sellerOrderId, sellerId, request);
        return ResponseEntity.ok(updated);
    }
}
