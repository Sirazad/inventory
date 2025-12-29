package com.inventory.controller;

import com.inventory.dto.BackupData;
import com.inventory.service.BackupService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/backup")
public class BackupController {
    
    private final BackupService backupService;
    
    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }
    
    @GetMapping
    public ResponseEntity<BackupData> createBackup(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            BackupData backup = backupService.createBackup(userDetails.getUsername());
            return ResponseEntity.ok(backup);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
