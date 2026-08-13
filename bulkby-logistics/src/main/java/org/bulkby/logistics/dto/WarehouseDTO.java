package org.bulkby.logistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseDTO {
    private Long id;
    private String name;
    // Address fields - city and state are fetched from pincode when needed
    private String street; // Street address
    private String pincode; // 6-digit pincode - city and state are fetched from this
    private Long cityId; // Auto-fetched from pincode for location grouping
    private Long stateId; // Auto-fetched from pincode for location grouping
    // Display fields (fetched from pincode lookup, not stored)
    private String city; // Fetched from pincode lookup for display
    private String state; // Fetched from pincode lookup for display
    private String phone;
    private String hoursOfOperation;
    private Boolean active;
}
