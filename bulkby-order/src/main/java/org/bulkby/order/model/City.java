package org.bulkby.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "cities", indexes = {
    @Index(name = "idx_city_name", columnList = "name"),
    @Index(name = "idx_city_state_id", columnList = "state_id"),
    @Index(name = "idx_city_active", columnList = "active"),
    @Index(name = "idx_city_name_state", columnList = "name, state_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_city_name_state", columnNames = {"name", "state_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class City {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name; // e.g., "Chennai", "Varanasi"
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "state_id", nullable = false)
    private State state;
    
    @Column(nullable = false)
    private Boolean active = true;
}
