package com.inventory.controller;

import com.inventory.service.SystemBackupService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/system/backup")
public class SystemBackupController {
    
    private final SystemBackupService systemBackupService;
    
    @Value("${system.backup.token:}")
    private String systemBackupToken;
    
    public SystemBackupController(SystemBackupService systemBackupService) {
        this.systemBackupService = systemBackupService;
    }
    
    /**
     * Create a full database backup
     * Requires system backup token in X-System-Token header
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> createBackup(
            @RequestHeader(value = "X-System-Token", required = false) String token) {
        
        if (!isValidSystemToken(token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            Path backupPath = systemBackupService.createDatabaseBackup();
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("backupFile", backupPath.getFileName().toString());
            response.put("backupPath", backupPath.toString());
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * List all available backups
     * Requires system backup token in X-System-Token header
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listBackups(
            @RequestHeader(value = "X-System-Token", required = false) String token) {
        
        if (!isValidSystemToken(token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            List<Path> backups = systemBackupService.listBackups();
            List<String> backupFiles = backups.stream()
                    .map(path -> path.getFileName().toString())
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("backups", backupFiles);
            response.put("count", backupFiles.size());
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Download a specific backup file
     * Requires system backup token in X-System-Token header
     */
    @GetMapping("/download/{filename}")
    public ResponseEntity<Resource> downloadBackup(
            @PathVariable String filename,
            @RequestHeader(value = "X-System-Token", required = false) String token) {
        
        if (!isValidSystemToken(token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            List<Path> backups = systemBackupService.listBackups();
            Path backupPath = backups.stream()
                    .filter(path -> path.getFileName().toString().equals(filename))
                    .findFirst()
                    .orElse(null);
            
            if (backupPath == null) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(backupPath);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Cleanup old backups, keeping only the most recent ones
     * Requires system backup token in X-System-Token header
     */
    @DeleteMapping("/cleanup")
    public ResponseEntity<Map<String, String>> cleanupBackups(
            @RequestParam(defaultValue = "5") int keep,
            @RequestHeader(value = "X-System-Token", required = false) String token) {
        
        if (!isValidSystemToken(token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            systemBackupService.cleanupOldBackups(keep);
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Old backups cleaned up, keeping " + keep + " most recent");
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Validates the system backup token
     */
    private boolean isValidSystemToken(String token) {
        if (systemBackupToken == null || systemBackupToken.isEmpty()) {
            // If no token is configured, system backups are disabled
            return false;
        }
        return systemBackupToken.equals(token);
    }
}
