package org.bulkby.auth.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bulkby.auth.validation.AtLeastOneContact;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users", 
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_user_email", columnNames = "email"),
           @UniqueConstraint(name = "uk_user_phone", columnNames = "phone")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@AtLeastOneContact
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = true)
    private String email;
    
    @Column(unique = true, nullable = true)
    private String phone;
    
    @Column(nullable = true)
    private String passwordHash;
    
    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must not exceed 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "First name can only contain letters, spaces, hyphens, and apostrophes")
    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;
    
    @Size(max = 50, message = "Middle name must not exceed 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']*$", message = "Middle name can only contain letters, spaces, hyphens, and apostrophes")
    @Column(name = "middle_name", nullable = true, length = 50)
    private String middleName;
    
    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Last name can only contain letters, spaces, hyphens, and apostrophes")
    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "primary_contact_type", nullable = false)
    private PrimaryContactType primaryContactType;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_login_methods", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "login_method")
    @Enumerated(EnumType.STRING)
    private Set<LoginMethod> loginMethods = new HashSet<>();
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;
    
    @Column(nullable = false)
    private Boolean enabled = true;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserContact> contacts = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserAddress> addresses = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<PaymentMethod> paymentMethods = new HashSet<>();
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private SellerProfile sellerProfile;
    
    @AssertTrue(message = "Either email or phone must be provided")
    public boolean isEmailOrPhonePresent() {
        return (email != null && !email.trim().isEmpty()) || 
               (phone != null && !phone.trim().isEmpty());
    }
    
    /**
     * Get full name as a single string for display purposes.
     * Format: "FirstName MiddleName LastName" or "FirstName LastName" if middle name is null.
     */
    public String getFullName() {
        StringBuilder fullName = new StringBuilder();
        if (firstName != null) {
            fullName.append(firstName.trim());
        }
        if (middleName != null && !middleName.trim().isEmpty()) {
            if (fullName.length() > 0) {
                fullName.append(" ");
            }
            fullName.append(middleName.trim());
        }
        if (lastName != null) {
            if (fullName.length() > 0) {
                fullName.append(" ");
            }
            fullName.append(lastName.trim());
        }
        return fullName.toString();
    }
    
    public enum Role {
        USER, ADMIN, SELLER
    }
    
    /**
     * Check if user is a seller (has SELLER role)
     */
    public boolean isSeller() {
        return role == Role.SELLER;
    }
}
