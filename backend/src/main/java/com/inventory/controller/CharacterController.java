package com.inventory.controller;

import com.inventory.dto.CharacterRequest;
import com.inventory.dto.CharacterResponse;
import com.inventory.service.CharacterService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/characters")
public class CharacterController {

    private final CharacterService characterService;

    public CharacterController(CharacterService characterService) {
        this.characterService = characterService;
    }

    @GetMapping
    public ResponseEntity<List<CharacterResponse>> getCharacters(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(characterService.getCharactersByUser(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<CharacterResponse> createCharacter(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CharacterRequest request) {
        CharacterResponse created = characterService.createCharacter(userDetails.getUsername(), request);
        return ResponseEntity.created(URI.create("/api/characters/" + created.getId())).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCharacter(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        characterService.deleteCharacter(userDetails.getUsername(), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/increment-day")
    public ResponseEntity<CharacterResponse> incrementDay(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(characterService.incrementDay(userDetails.getUsername(), id));
    }

    @PostMapping("/{id}/decrement-day")
    public ResponseEntity<CharacterResponse> decrementDay(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(characterService.decrementDay(userDetails.getUsername(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CharacterResponse> updateCharacter(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CharacterRequest request) {
        return ResponseEntity.ok(characterService.updateCharacter(userDetails.getUsername(), id, request));
    }
}
