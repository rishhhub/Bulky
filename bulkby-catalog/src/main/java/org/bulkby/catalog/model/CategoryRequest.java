package org.bulkby.catalog.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bulkby.auth.model.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "category_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;
    
    @NotBlank(message = "Category name is required")
    @Size(max = 200, message = "Category name must not exceed 200 characters")
    @Column(name = "category_name", nullable = false, length = 200)
    private String categoryName;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;
    
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
    
    public enum RequestStatus {
        PENDING, APPROVED, REJECTED
    }
}
