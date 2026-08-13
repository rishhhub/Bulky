package org.bulkby.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long id; // User ID (not sensitive, just an identifier)
    private String email;
    private String phone;
    private String firstName;
    private String middleName;
    private String lastName;
    private String fullName; // Computed full name for convenience
    private String role;
}
