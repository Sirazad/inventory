package com.inventory.controller;

import com.inventory.dto.InventoryResponse;
import com.inventory.dto.TemplateRequest;
import com.inventory.dto.TemplateResponse;
import com.inventory.service.TemplateService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public ResponseEntity<Page<TemplateResponse>> getAllTemplates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        return ResponseEntity.ok(templateService.getAllTemplates(page, size, sortBy, sortDir));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<TemplateResponse>> searchTemplates(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Boolean isContainer,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        return ResponseEntity.ok(templateService.searchTemplates(
            name, isContainer, category, page, size, sortBy, sortDir));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TemplateResponse> getTemplate(@PathVariable Long id) {
        return ResponseEntity.ok(templateService.getTemplate(id));
    }

    @PostMapping
    public ResponseEntity<TemplateResponse> createTemplate(
            @Valid @RequestBody TemplateRequest request) {
        return ResponseEntity.ok(templateService.createTemplate(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TemplateResponse> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody TemplateRequest request) {
        return ResponseEntity.ok(templateService.updateTemplate(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        templateService.deleteTemplate(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{templateId}/add-to-character/{characterId}")
    public ResponseEntity<InventoryResponse> addTemplateToInventory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @PathVariable Long templateId) {
        return ResponseEntity.ok(templateService.addTemplateToInventory(
                userDetails.getUsername(), characterId, templateId));
    }
}
