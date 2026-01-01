package com.inventory.controller;

import com.inventory.dto.InventoryResponse;
import com.inventory.dto.TemplateItemResponse;
import com.inventory.dto.TemplateRequest;
import com.inventory.dto.TemplateResponse;
import com.inventory.service.TemplateService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public ResponseEntity<List<TemplateResponse>> searchTemplates(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String name) {
        return ResponseEntity.ok(templateService.searchTemplates(userDetails.getUsername(), name));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TemplateResponse> getTemplate(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(templateService.getTemplate(userDetails.getUsername(), id));
    }

    @GetMapping("/{id}/contents")
    public ResponseEntity<List<TemplateItemResponse>> getTemplateContents(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(templateService.getTemplateContents(userDetails.getUsername(), id));
    }

    @PostMapping
    public ResponseEntity<TemplateResponse> createTemplate(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TemplateRequest request) {
        return ResponseEntity.ok(templateService.createTemplate(userDetails.getUsername(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        templateService.deleteTemplate(userDetails.getUsername(), id);
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
