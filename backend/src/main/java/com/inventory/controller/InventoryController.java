package com.inventory.controller;

import com.inventory.dto.InventoryRequest;
import com.inventory.dto.InventoryResponse;
import com.inventory.dto.UpdateQuantityRequest;
import com.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/characters/{characterId}/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<List<InventoryResponse>> getInventory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxWeight,
            @RequestParam(required = false) String itemName) {
        return ResponseEntity.ok(inventoryService.getInventoryByCharacter(
                userDetails.getUsername(), characterId, category, minPrice, maxWeight, itemName));
    }

    @PostMapping
    public ResponseEntity<InventoryResponse> createInventory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @Valid @RequestBody InventoryRequest request) {
        InventoryResponse created = inventoryService.createInventory(
                userDetails.getUsername(), characterId, request);
        return ResponseEntity.created(URI.create("/api/characters/" + characterId + "/inventory/" + created.getId())).body(created);
    }

    @PutMapping("/{inventoryId}")
    public ResponseEntity<InventoryResponse> updateInventory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @PathVariable Long inventoryId,
            @Valid @RequestBody InventoryRequest request) {
        return ResponseEntity.ok(inventoryService.updateInventory(
                userDetails.getUsername(), characterId, inventoryId, request));
    }

    @DeleteMapping("/{inventoryId}")
    public ResponseEntity<Void> removeInventory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @PathVariable Long inventoryId,
            @RequestBody Map<String, String> request) {
        inventoryService.removeInventory(
                userDetails.getUsername(), characterId, inventoryId, 
                request.get("removalText"));
        return ResponseEntity.ok().build();
    }
    
    @PatchMapping("/{inventoryId}/quantity")
    public ResponseEntity<InventoryResponse> updateQuantity(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @PathVariable Long inventoryId,
            @Valid @RequestBody UpdateQuantityRequest request) {
        return ResponseEntity.ok(inventoryService.updateQuantity(
                userDetails.getUsername(), characterId, inventoryId,
                request.getQuantityChange(), request.getReason()));
    }
    
    @GetMapping("/{inventoryId}/contents")
    public ResponseEntity<List<InventoryResponse>> getContainerContents(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @PathVariable Long inventoryId) {
        return ResponseEntity.ok(inventoryService.getItemsInContainer(
                userDetails.getUsername(), characterId, inventoryId));
    }
    
    @GetMapping("/{inventoryId}/total-weight")
    public ResponseEntity<Map<String, Double>> getTotalWeight(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @PathVariable Long inventoryId) {
        Double totalWeight = inventoryService.calculateTotalWeight(
                userDetails.getUsername(), characterId, inventoryId);
        return ResponseEntity.ok(Map.of("totalWeight", totalWeight));
    }
    
    @PostMapping("/{inventoryId}/clone")
    public ResponseEntity<Map<String, Object>> cloneInventory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @PathVariable Long inventoryId,
            @RequestParam(required = false, defaultValue = "false") boolean includeContents) {
        Map<String, Object> result = inventoryService.cloneInventoryItem(
                userDetails.getUsername(), characterId, inventoryId, includeContents);
        return ResponseEntity.created(URI.create("/api/characters/" + characterId + "/inventory")).body(result);
    }
}
