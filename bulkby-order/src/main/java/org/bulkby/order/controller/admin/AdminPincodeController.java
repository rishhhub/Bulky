package org.bulkby.order.controller.admin;

import org.bulkby.common.dto.PincodeInfo;
import org.bulkby.order.dto.PincodeDTO;
import org.bulkby.order.model.City;
import org.bulkby.order.model.Pincode;
import org.bulkby.order.repository.CityRepository;
import org.bulkby.order.repository.PincodeRepository;
import org.bulkby.common.service.PincodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/pincodes")
@CrossOrigin(origins = "*")
public class AdminPincodeController {

    @Autowired
    private PincodeRepository pincodeRepository;
    
    @Autowired
    private CityRepository cityRepository;
    
    @Autowired
    private PincodeService pincodeService;

    @GetMapping
    public ResponseEntity<List<PincodeInfo>> getAllPincodes(
            @RequestParam(required = false) Long cityId,
            @RequestParam(required = false) Boolean serviceable) {
        List<Pincode> pincodes;
        if (cityId != null) {
            pincodes = pincodeRepository.findByCityId(cityId);
        } else {
            pincodes = pincodeRepository.findAll();
        }
        
        if (serviceable != null) {
            pincodes = pincodes.stream()
                    .filter(p -> p.getServiceable().equals(serviceable))
                    .collect(Collectors.toList());
        }
        
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

    @PostMapping
    public ResponseEntity<PincodeDTO> createPincode(@RequestBody Pincode pincode) {
        if (pincode.getCity() == null || pincode.getCity().getId() == null) {
            throw new RuntimeException("City is required");
        }
        City city = cityRepository.findById(pincode.getCity().getId())
                .orElseThrow(() -> new RuntimeException("City not found with id: " + pincode.getCity().getId()));
        pincode.setCity(city);
        Pincode saved = pincodeRepository.save(pincode);
        return ResponseEntity.ok(convertToDTO(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PincodeDTO> updatePincode(@PathVariable Long id, @RequestBody Pincode pincode) {
        Pincode existing = pincodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pincode not found with id: " + id));
        existing.setCode(pincode.getCode());
        if (pincode.getCity() != null && pincode.getCity().getId() != null) {
            City city = cityRepository.findById(pincode.getCity().getId())
                    .orElseThrow(() -> new RuntimeException("City not found with id: " + pincode.getCity().getId()));
            existing.setCity(city);
        }
        existing.setServiceable(pincode.getServiceable());
        existing.setActive(pincode.getActive());
        Pincode saved = pincodeRepository.save(existing);
        return ResponseEntity.ok(convertToDTO(saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PincodeDTO> getPincodeById(@PathVariable Long id) {
        Pincode pincode = pincodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pincode not found with id: " + id));
        return ResponseEntity.ok(convertToDTO(pincode));
    }
    
    private PincodeDTO convertToDTO(Pincode pincode) {
        PincodeDTO dto = new PincodeDTO();
        dto.setId(pincode.getId());
        dto.setCode(pincode.getCode());
        dto.setServiceable(pincode.getServiceable());
        dto.setActive(pincode.getActive());
        if (pincode.getCity() != null) {
            dto.setCityId(pincode.getCity().getId());
            dto.setCityName(pincode.getCity().getName());
            if (pincode.getCity().getState() != null) {
                dto.setStateId(pincode.getCity().getState().getId());
                dto.setStateName(pincode.getCity().getState().getName());
                dto.setStateCode(pincode.getCity().getState().getCode());
            }
        }
        return dto;
    }

    @PostMapping("/bulk-import")
    public ResponseEntity<String> bulkImportPincodes(@RequestBody List<Pincode> pincodes) {
        int imported = 0;
        for (Pincode pincode : pincodes) {
            try {
                if (pincode.getCity() != null && pincode.getCity().getId() != null) {
                    City city = cityRepository.findById(pincode.getCity().getId())
                            .orElse(null);
                    if (city != null) {
                        pincode.setCity(city);
                        pincodeRepository.save(pincode);
                        imported++;
                    }
                }
            } catch (Exception e) {
                // Skip invalid pincodes
            }
        }
        return ResponseEntity.ok("Imported " + imported + " pincodes");
    }

    @PostMapping("/cities/{cityId}/mark-serviceable")
    public ResponseEntity<String> markCityServiceable(@PathVariable Long cityId) {
        List<Pincode> pincodes = pincodeRepository.findByCityId(cityId);
        for (Pincode pincode : pincodes) {
            pincode.setServiceable(true);
            pincodeRepository.save(pincode);
        }
        return ResponseEntity.ok("Marked all pincodes in city as serviceable");
    }
}
