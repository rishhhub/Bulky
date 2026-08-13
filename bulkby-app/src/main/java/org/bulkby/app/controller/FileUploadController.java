package org.bulkby.app.controller;

import org.bulkby.app.service.FileStorage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/uploads")
@CrossOrigin(origins = "*")
public class FileUploadController {
    
    @Autowired
    private FileStorage fileStorage;
    
    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String fileUrl = fileStorage.storeFile(file);
            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("message", "File uploaded successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/images")
    public ResponseEntity<Map<String, Object>> uploadImages(@RequestParam("files") MultipartFile[] files) {
        try {
            List<String> urls = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            
            for (MultipartFile file : files) {
                try {
                    String fileUrl = fileStorage.storeFile(file);
                    urls.add(fileUrl);
                } catch (RuntimeException e) {
                    errors.add(file.getOriginalFilename() + ": " + e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("urls", urls);
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }
            response.put("message", "Files uploaded successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @DeleteMapping("/image")
    public ResponseEntity<Map<String, String>> deleteImage(@RequestParam("url") String fileUrl) {
        try {
            fileStorage.deleteFile(fileUrl);
            Map<String, String> response = new HashMap<>();
            response.put("message", "File deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
