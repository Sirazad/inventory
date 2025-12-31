package com.inventory.controller;

import com.inventory.dto.InventoryRequest;
import com.inventory.entity.Inventory;
import com.inventory.exception.InvalidOperationException;
import com.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<List<Inventory>> getInventory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxWeight) {
        return ResponseEntity.ok(inventoryService.getInventoryByCharacter(
                userDetails.getUsername(), characterId, category, minPrice, maxWeight));
    }

    @PostMapping
    public ResponseEntity<Inventory> createInventory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @Valid @RequestBody InventoryRequest request) {
        return ResponseEntity.ok(inventoryService.createInventory(
                userDetails.getUsername(), characterId, request));
    }

    @PutMapping("/{inventoryId}")
    public ResponseEntity<Inventory> updateInventory(
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
    public ResponseEntity<Inventory> updateQuantity(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @PathVariable Long inventoryId,
            @RequestBody Map<String, Integer> request) {
        Integer quantityChange = request.get("quantityChange");
        if (quantityChange == null) {
            throw new InvalidOperationException("Quantity change is required");
        }
        return ResponseEntity.ok(inventoryService.updateQuantity(
                userDetails.getUsername(), characterId, inventoryId, quantityChange));
    }
    
    @GetMapping("/{inventoryId}/contents")
    public ResponseEntity<List<Inventory>> getContainerContents(
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
}
