package org.bulkby.auth.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verifications", indexes = {
    @Index(name = "idx_contact_purpose", columnList = "contact_value, purpose")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OtpVerification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "contact_value", nullable = false)
    private String contactValue;
    
    @Column(nullable = false, length = 6)
    private String otp;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OtpPurpose purpose;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(nullable = false)
    private Boolean verified = false;
    
    @Column(name = "attempts", nullable = false)
    private Integer attempts = 0;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
