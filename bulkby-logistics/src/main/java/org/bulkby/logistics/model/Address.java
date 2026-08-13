package org.bulkby.logistics.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Shared Address entity for both user and warehouse addresses.
 * Only stores pincode - city and state are fetched from pincode lookup when needed.
 */
@Entity
@Table(name = "addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Address {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String street; // Street address, building name, area, etc.
    
    @Column(name = "pincode", length = 6, nullable = false)
    private String pincode; // 6-digit pincode - city and state are fetched from this
    
    @Column(name = "city_id")
    private Long cityId; // Auto-fetched from pincode for location grouping
    
    @Column(name = "state_id")
    private Long stateId; // Auto-fetched from pincode for location grouping
    
    // Note: city and state names are NOT stored here - they are fetched from pincode lookup when needed
}
