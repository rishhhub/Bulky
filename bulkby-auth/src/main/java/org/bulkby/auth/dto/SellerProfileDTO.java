package org.bulkby.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bulkby.auth.model.SellerProfile;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerProfileDTO {
    private Long id;
    private Long userId;
    private String companyName;
    private String companyAddress;
    private String panNumber;
    private String gstin;
    private SellerProfile.ProfileStatus profileStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
}
