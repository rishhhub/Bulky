package org.bulkby.auth.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "seller_profiles",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_seller_profile_user", columnNames = "user_id"),
           @UniqueConstraint(name = "uk_seller_profile_pan", columnNames = "pan_number"),
           @UniqueConstraint(name = "uk_seller_profile_gstin", columnNames = "gstin")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(name = "company_name", nullable = false, length = 200)
    @Size(max = 200, message = "Company name must not exceed 200 characters")
    private String companyName;
    
    @Column(name = "company_address", columnDefinition = "TEXT")
    private String companyAddress;
    
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message = "PAN must be in format: ABCDE1234F")
    @Column(name = "pan_number", length = 10, unique = true)
    private String panNumber;
    
    @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", message = "GSTIN must be in format: 22AAAAA0000A1Z5")
    @Column(name = "gstin", length = 15, unique = true)
    private String gstin;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "profile_status", nullable = false)
    private ProfileStatus profileStatus = ProfileStatus.PENDING;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;
    
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum ProfileStatus {
        PENDING, APPROVED, REJECTED
    }
}
