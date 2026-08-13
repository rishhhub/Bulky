package org.bulkby.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pincodes", indexes = {
    @Index(name = "idx_pincode_code", columnList = "code"),
    @Index(name = "idx_pincode_city_id", columnList = "city_id"),
    @Index(name = "idx_pincode_serviceable", columnList = "serviceable"),
    @Index(name = "idx_pincode_active", columnList = "active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pincode {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false, length = 6)
    private String code; // 6-digit pincode, e.g., "600001"
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;
    
    @Column(nullable = false)
    private Boolean serviceable = true; // Only serviceable pincodes can be used
    
    @Column(nullable = false)
    private Boolean active = true;
}
