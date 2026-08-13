package org.bulkby.auth.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_methods")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethod {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethodType type;
    
    @Column(nullable = false)
    private String provider; // Visa, Mastercard, PayPal, PhonePe, GooglePay, etc.
    
    @Column(name = "last_four_digits")
    private String lastFourDigits;
    
    @Column(name = "upi_id")
    private String upiId; // For UPI payments
    
    @Column(name = "card_expiry")
    private String cardExpiry; // MM/YY format for cards
    
    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;
    
    @Column(columnDefinition = "TEXT")
    private String metadata; // JSON for additional info (tokenized card ID, etc.)
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
