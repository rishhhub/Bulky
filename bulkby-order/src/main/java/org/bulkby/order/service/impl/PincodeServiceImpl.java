package org.bulkby.order.service.impl;

import org.bulkby.common.dto.PincodeInfo;
import org.bulkby.common.service.PincodeService;
import org.bulkby.order.model.City;
import org.bulkby.order.model.Pincode;
import org.bulkby.order.repository.CityRepository;
import org.bulkby.order.repository.PincodeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PincodeServiceImpl implements PincodeService {

    private static final Logger logger = LoggerFactory.getLogger(PincodeServiceImpl.class);

    @Autowired
    private PincodeRepository pincodeRepository;
    
    @Autowired
    private CityRepository cityRepository;

    @Override
    @Transactional(readOnly = true)
    public PincodeInfo lookupByPincode(String pincode) {
        if (!isValidPincodeFormat(pincode)) {
            logger.warn("Invalid pincode format: {}", pincode);
            return null;
        }

        Pincode pincodeEntity = pincodeRepository.findByCodeWithLocation(pincode)
                .orElse(null);

        if (pincodeEntity == null) {
            logger.debug("Pincode not found: {}", pincode);
            return null;
        }

        City city = pincodeEntity.getCity();
        if (city == null) {
            logger.warn("City not found for pincode: {}", pincode);
            return null;
        }

        PincodeInfo info = new PincodeInfo();
        info.setPincode(pincodeEntity.getCode());
        info.setCityId(city.getId());
        info.setCityName(city.getName());
        
        if (city.getState() != null) {
            info.setStateId(city.getState().getId());
            info.setStateName(city.getState().getName());
            info.setStateCode(city.getState().getCode());
        }
        
        info.setServiceable(pincodeEntity.getServiceable() && 
                           pincodeEntity.getActive() && 
                           city.getActive() && 
                           (city.getState() == null || city.getState().getActive()));

        return info;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isServiceable(String pincode) {
        if (!isValidPincodeFormat(pincode)) {
            return false;
        }

        return pincodeRepository.findServiceableByCode(pincode).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List getServiceablePincodesByCity(Long cityId) {
        return pincodeRepository.findServiceablePincodesByCityId(cityId);
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List getCitiesByState(Long stateId) {
        if (stateId == null) {
            return cityRepository.findByActiveTrue();
        }
        return cityRepository.findActiveCitiesByStateId(stateId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Object getCityById(Long cityId) {
        return cityRepository.findById(cityId).orElse(null);
    }

    @Override
    public boolean isValidPincodeFormat(String pincode) {
        if (pincode == null || pincode.trim().isEmpty()) {
            return false;
        }
        // Must be exactly 6 digits
        return pincode.matches("^\\d{6}$");
    }
}
