package com.inventory.controller;

import com.inventory.dto.InventoryRequest;
import com.inventory.entity.Inventory;
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
        try {
            return ResponseEntity.ok(inventoryService.getInventoryByCharacter(
                    userDetails.getUsername(), characterId, category, minPrice, maxWeight));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Inventory> createInventory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @Valid @RequestBody InventoryRequest request) {
        try {
            return ResponseEntity.ok(inventoryService.createInventory(
                    userDetails.getUsername(), characterId, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{inventoryId}")
    public ResponseEntity<Inventory> updateInventory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @PathVariable Long inventoryId,
            @Valid @RequestBody InventoryRequest request) {
        try {
            return ResponseEntity.ok(inventoryService.updateInventory(
                    userDetails.getUsername(), characterId, inventoryId, request));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{inventoryId}")
    public ResponseEntity<Void> removeInventory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @PathVariable Long inventoryId,
            @RequestBody Map<String, String> request) {
        try {
            inventoryService.removeInventory(
                    userDetails.getUsername(), characterId, inventoryId, 
                    request.get("removalText"));
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PatchMapping("/{inventoryId}/quantity")
    public ResponseEntity<Inventory> updateQuantity(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @PathVariable Long inventoryId,
            @RequestBody Map<String, Integer> request) {
        try {
            Integer quantityChange = request.get("quantityChange");
            if (quantityChange == null) {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok(inventoryService.updateQuantity(
                    userDetails.getUsername(), characterId, inventoryId, quantityChange));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{inventoryId}/contents")
    public ResponseEntity<List<Inventory>> getContainerContents(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @PathVariable Long inventoryId) {
        try {
            return ResponseEntity.ok(inventoryService.getItemsInContainer(
                    userDetails.getUsername(), characterId, inventoryId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{inventoryId}/total-weight")
    public ResponseEntity<Map<String, Double>> getTotalWeight(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long characterId,
            @PathVariable Long inventoryId) {
        try {
            Double totalWeight = inventoryService.calculateTotalWeight(
                    userDetails.getUsername(), characterId, inventoryId);
            return ResponseEntity.ok(Map.of("totalWeight", totalWeight));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
