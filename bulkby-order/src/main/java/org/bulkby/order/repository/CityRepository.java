package org.bulkby.order.repository;

import org.bulkby.order.model.City;
import org.bulkby.order.model.State;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityRepository extends JpaRepository<City, Long> {
    Optional<City> findByNameAndState(String name, State state);
    Optional<City> findByNameAndStateId(String name, Long stateId);
    List<City> findByState(State state);
    List<City> findByStateId(Long stateId);
    List<City> findByStateIdAndActiveTrue(Long stateId);
    List<City> findByActiveTrue();
    List<City> findByActive(Boolean active);
    
    @Query("SELECT c FROM City c JOIN FETCH c.state WHERE c.state.id = :stateId AND c.active = true ORDER BY c.name")
    List<City> findActiveCitiesByStateId(@Param("stateId") Long stateId);
    
    @Query("SELECT c FROM City c JOIN FETCH c.state WHERE c.active = true ORDER BY c.name")
    List<City> findByActiveTrueWithState();
    
    @Query("SELECT c FROM City c JOIN FETCH c.state ORDER BY c.name")
    List<City> findAllWithState();
    
    @Query("SELECT c FROM City c JOIN FETCH c.state WHERE c.state.id = :stateId ORDER BY c.name")
    List<City> findByStateIdWithState(@Param("stateId") Long stateId);
}
