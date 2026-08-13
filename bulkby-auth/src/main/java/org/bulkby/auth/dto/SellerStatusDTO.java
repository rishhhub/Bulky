package org.bulkby.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bulkby.auth.model.SellerProfile;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerStatusDTO {
    private boolean isSeller;
    private SellerProfile.ProfileStatus profileStatus;
    private boolean profileComplete;
    private String message;
}
