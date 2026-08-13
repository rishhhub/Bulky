package org.bulkby.order.controller.admin;

import org.bulkby.order.model.State;
import org.bulkby.order.repository.StateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/states")
@CrossOrigin(origins = "*")
public class StateController {

    @Autowired
    private StateRepository stateRepository;

    @GetMapping
    public ResponseEntity<List<State>> getAllStates() {
        List<State> states = stateRepository.findAll();
        return ResponseEntity.ok(states);
    }

    @PostMapping
    public ResponseEntity<State> createState(@RequestBody State state) {
        State saved = stateRepository.save(state);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<State> updateState(@PathVariable Long id, @RequestBody State state) {
        State existing = stateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("State not found with id: " + id));
        existing.setCode(state.getCode());
        existing.setName(state.getName());
        existing.setActive(state.getActive());
        State saved = stateRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<State> getStateById(@PathVariable Long id) {
        State state = stateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("State not found with id: " + id));
        return ResponseEntity.ok(state);
    }
}
