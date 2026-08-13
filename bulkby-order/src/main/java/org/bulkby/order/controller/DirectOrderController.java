package org.bulkby.order.controller;

import org.bulkby.order.dto.DirectOrderRequest;
import org.bulkby.order.dto.InterestDTO;
import org.bulkby.order.service.DirectOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/direct-order")
public class DirectOrderController {
    
    @Autowired
    private DirectOrderService directOrderService;
    
    @Autowired
    private org.bulkby.auth.repository.UserRepository userRepository;
    
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
    
    @PostMapping
    public ResponseEntity<InterestDTO> placeDirectOrder(@Valid @RequestBody DirectOrderRequest request) {
        Long userId = getCurrentUserId();
        InterestDTO interest = directOrderService.placeDirectOrder(userId, request);
        return ResponseEntity.ok(interest);
    }
}
