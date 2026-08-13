package org.bulkby.order.repository;

import org.bulkby.order.model.City;
import org.bulkby.order.model.Pincode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PincodeRepository extends JpaRepository<Pincode, Long> {
    Optional<Pincode> findByCode(String code);
    List<Pincode> findByCity(City city);
    List<Pincode> findByCityId(Long cityId);
    List<Pincode> findByServiceableTrue();
    List<Pincode> findByServiceableAndActiveTrue(Boolean serviceable);
    
    @Query("SELECT p FROM Pincode p WHERE p.city.id = :cityId AND p.serviceable = true AND p.active = true ORDER BY p.code")
    List<Pincode> findServiceablePincodesByCityId(@Param("cityId") Long cityId);
    
    @Query("SELECT p FROM Pincode p JOIN p.city c JOIN c.state s " +
           "WHERE p.code = :code AND p.serviceable = true AND p.active = true " +
           "AND c.active = true AND s.active = true")
    Optional<Pincode> findServiceableByCode(@Param("code") String code);
    
    @Query("SELECT p FROM Pincode p JOIN p.city c JOIN c.state s " +
           "WHERE p.code = :code AND p.active = true AND c.active = true AND s.active = true")
    Optional<Pincode> findByCodeWithLocation(@Param("code") String code);
}
