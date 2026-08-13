package org.bulkby.order.repository;

import org.bulkby.order.model.State;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StateRepository extends JpaRepository<State, Long> {
    Optional<State> findByCode(String code);
    Optional<State> findByName(String name);
    List<State> findByActiveTrue();
    List<State> findByActive(Boolean active);
}
