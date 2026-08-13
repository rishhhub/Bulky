package org.bulkby.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bulkby.auth.model.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "grievances")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Grievance {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "order_id", nullable = false)
    private Long orderId; // Reference to Order entity
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Buyer
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GrievanceType type;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GrievanceStatus status = GrievanceStatus.PENDING;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String resolution;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    public enum GrievanceType {
        DEFECTIVE, REFUND, REPLACEMENT
    }
    
    public enum GrievanceStatus {
        PENDING, IN_PROGRESS, RESOLVED, REJECTED
    }
}
