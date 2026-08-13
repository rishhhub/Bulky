package org.bulkby.order.controller;

import org.bulkby.common.dto.PincodeInfo;
import org.bulkby.order.model.City;
import org.bulkby.order.model.Pincode;
import org.bulkby.order.model.State;
import org.bulkby.order.repository.CityRepository;
import org.bulkby.order.repository.PincodeRepository;
import org.bulkby.order.repository.StateRepository;
import org.bulkby.common.service.PincodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/pincodes")
@CrossOrigin(origins = "*")
public class PincodeController {

    @Autowired
    private PincodeService pincodeService;
    
    @Autowired
    private StateRepository stateRepository;
    
    @Autowired
    private CityRepository cityRepository;
    
    @Autowired
    private PincodeRepository pincodeRepository;

    @GetMapping("/{pincode}")
    public ResponseEntity<PincodeInfo> lookupPincode(@PathVariable String pincode) {
        PincodeInfo info = pincodeService.lookupByPincode(pincode);
        if (info == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(info);
    }

    @GetMapping("/serviceable")
    public ResponseEntity<List<PincodeInfo>> getServiceablePincodes() {
        List<Pincode> pincodes = pincodeRepository.findByServiceableAndActiveTrue(true);
        List<PincodeInfo> infoList = pincodes.stream()
                .map(p -> {
                    PincodeInfo info = new PincodeInfo();
                    info.setPincode(p.getCode());
                    if (p.getCity() != null) {
                        info.setCityId(p.getCity().getId());
                        info.setCityName(p.getCity().getName());
                        if (p.getCity().getState() != null) {
                            info.setStateId(p.getCity().getState().getId());
                            info.setStateName(p.getCity().getState().getName());
                            info.setStateCode(p.getCity().getState().getCode());
                        }
                    }
                    info.setServiceable(p.getServiceable());
                    return info;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(infoList);
    }

    @GetMapping("/states")
    public ResponseEntity<List<State>> getStates() {
        List<State> states = stateRepository.findByActiveTrue();
        return ResponseEntity.ok(states);
    }

    @GetMapping("/cities")
    public ResponseEntity<List<org.bulkby.order.dto.CityDTO>> getCities(@RequestParam(required = false) Long stateId) {
        List<City> cities;
        if (stateId != null) {
            cities = cityRepository.findByStateIdWithState(stateId);
        } else {
            cities = cityRepository.findByActiveTrueWithState();
        }
        List<org.bulkby.order.dto.CityDTO> cityDTOs = cities.stream()
                .map(city -> {
                    org.bulkby.order.dto.CityDTO dto = new org.bulkby.order.dto.CityDTO();
                    dto.setId(city.getId());
                    dto.setName(city.getName());
                    dto.setActive(city.getActive());
                    if (city.getState() != null) {
                        dto.setStateId(city.getState().getId());
                        dto.setStateName(city.getState().getName());
                        dto.setStateCode(city.getState().getCode());
                    }
                    return dto;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(cityDTOs);
    }

    @GetMapping("/cities/{cityId}/pincodes")
    public ResponseEntity<List<PincodeInfo>> getPincodesByCity(@PathVariable Long cityId) {
        @SuppressWarnings("unchecked")
        List<Pincode> pincodes = (List<Pincode>) pincodeService.getServiceablePincodesByCity(cityId);
        List<PincodeInfo> infoList = pincodes.stream()
                .map(p -> {
                    PincodeInfo info = new PincodeInfo();
                    info.setPincode(p.getCode());
                    if (p.getCity() != null) {
                        info.setCityId(p.getCity().getId());
                        info.setCityName(p.getCity().getName());
                        if (p.getCity().getState() != null) {
                            info.setStateId(p.getCity().getState().getId());
                            info.setStateName(p.getCity().getState().getName());
                            info.setStateCode(p.getCity().getState().getCode());
                        }
                    }
                    info.setServiceable(p.getServiceable());
                    return info;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(infoList);
    }
}
