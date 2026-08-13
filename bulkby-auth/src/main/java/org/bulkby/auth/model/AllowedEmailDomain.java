package org.bulkby.auth.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "allowed_email_domains", 
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_allowed_domain", columnNames = "domain")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AllowedEmailDomain {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 255)
    private String domain; // e.g., "gmail.com", "company.com"
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @Column(length = 500)
    private String description; // Optional description
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
