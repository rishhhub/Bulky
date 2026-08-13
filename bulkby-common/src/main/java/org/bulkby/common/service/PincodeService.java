package org.bulkby.common.service;

import org.bulkby.common.dto.PincodeInfo;

import java.util.List;

public interface PincodeService {
    /**
     * Lookup city and state by pincode
     * @param pincode 6-digit pincode
     * @return PincodeInfo with city and state details, or null if not found
     */
    PincodeInfo lookupByPincode(String pincode);
    
    /**
     * Validate if pincode is serviceable
     * @param pincode 6-digit pincode
     * @return true if serviceable, false otherwise
     */
    boolean isServiceable(String pincode);
    
    /**
     * Get all serviceable pincodes for a city
     * @param cityId City ID
     * @return List of serviceable pincodes
     */
    @SuppressWarnings("rawtypes")
    List getServiceablePincodesByCity(Long cityId);
    
    /**
     * Get all cities in a state
     * @param stateId State ID (null to get all cities)
     * @return List of cities
     */
    @SuppressWarnings("rawtypes")
    List getCitiesByState(Long stateId);
    
    /**
     * Get city by ID
     * @param cityId City ID
     * @return City entity, or null if not found
     */
    Object getCityById(Long cityId);
    
    /**
     * Validate pincode format (6 digits)
     * @param pincode Pincode to validate
     * @return true if valid format, false otherwise
     */
    boolean isValidPincodeFormat(String pincode);
}
