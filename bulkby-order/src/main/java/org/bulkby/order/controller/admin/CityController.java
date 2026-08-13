package org.bulkby.order.controller.admin;

import org.bulkby.order.dto.CityDTO;
import org.bulkby.order.model.City;
import org.bulkby.order.model.State;
import org.bulkby.order.repository.CityRepository;
import org.bulkby.order.repository.StateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/cities")
@CrossOrigin(origins = "*")
public class CityController {

    @Autowired
    private CityRepository cityRepository;
    
    @Autowired
    private StateRepository stateRepository;

    @GetMapping
    public ResponseEntity<List<CityDTO>> getAllCities(@RequestParam(required = false) Long stateId) {
        List<City> cities;
        if (stateId != null) {
            cities = cityRepository.findByStateIdWithState(stateId);
        } else {
            cities = cityRepository.findAllWithState();
        }
        List<CityDTO> cityDTOs = cities.stream()
                .map(city -> {
                    CityDTO dto = new CityDTO();
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

    @PostMapping
    public ResponseEntity<City> createCity(@RequestBody City city) {
        if (city.getState() == null || city.getState().getId() == null) {
            throw new RuntimeException("State is required");
        }
        State state = stateRepository.findById(city.getState().getId())
                .orElseThrow(() -> new RuntimeException("State not found with id: " + city.getState().getId()));
        city.setState(state);
        City saved = cityRepository.save(city);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<City> updateCity(@PathVariable Long id, @RequestBody City city) {
        City existing = cityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("City not found with id: " + id));
        existing.setName(city.getName());
        if (city.getState() != null && city.getState().getId() != null) {
            State state = stateRepository.findById(city.getState().getId())
                    .orElseThrow(() -> new RuntimeException("State not found with id: " + city.getState().getId()));
            existing.setState(state);
        }
        existing.setActive(city.getActive());
        City saved = cityRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CityDTO> getCityById(@PathVariable Long id) {
        City city = cityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("City not found with id: " + id));
        // Force load state if not already loaded
        if (city.getState() != null) {
            city.getState().getName(); // Trigger lazy loading
        }
        CityDTO dto = new CityDTO();
        dto.setId(city.getId());
        dto.setName(city.getName());
        dto.setActive(city.getActive());
        if (city.getState() != null) {
            dto.setStateId(city.getState().getId());
            dto.setStateName(city.getState().getName());
            dto.setStateCode(city.getState().getCode());
        }
        return ResponseEntity.ok(dto);
    }
}
