package com.inventory.controller;

import com.inventory.dto.CharacterRequest;
import com.inventory.entity.Character;
import com.inventory.service.CharacterService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/characters")
public class CharacterController {

    private final CharacterService characterService;

    public CharacterController(CharacterService characterService) {
        this.characterService = characterService;
    }

    @GetMapping
    public ResponseEntity<List<Character>> getCharacters(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(characterService.getCharactersByUser(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<?> createCharacter(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CharacterRequest request) {
        try {
            return ResponseEntity.ok(characterService.createCharacter(userDetails.getUsername(), request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCharacter(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        try {
            characterService.deleteCharacter(userDetails.getUsername(), id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
