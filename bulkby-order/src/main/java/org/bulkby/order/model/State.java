package org.bulkby.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "states", indexes = {
    @Index(name = "idx_state_code", columnList = "code"),
    @Index(name = "idx_state_active", columnList = "active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class State {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false, length = 10)
    private String code; // e.g., "TN", "UP", "MH"
    
    @Column(unique = true, nullable = false)
    private String name; // e.g., "Tamil Nadu", "Uttar Pradesh"
    
    @Column(nullable = false)
    private Boolean active = true;
}
