package org.bulkby.notification.controller;

import org.bulkby.auth.repository.UserRepository;
import org.bulkby.notification.dto.NotificationDTO;
import org.bulkby.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserRepository userRepository;
    
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getMyNotifications() {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<NotificationDTO> notifications = notificationService.getUserNotifications(user.getId());
        return ResponseEntity.ok(notifications);
    }
    
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Long count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(count);
    }
    
    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable("id") Long id) {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead() {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        ((org.bulkby.notification.service.impl.NotificationServiceImpl) notificationService).markAllAsRead(user.getId());
        return ResponseEntity.ok().build();
    }
    
    private String getCurrentUserContact() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }
}
