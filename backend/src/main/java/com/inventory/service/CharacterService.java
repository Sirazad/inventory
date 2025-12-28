package com.inventory.service;

import com.inventory.dto.CharacterRequest;
import com.inventory.dto.CharacterResponse;
import com.inventory.entity.Character;
import com.inventory.entity.User;
import com.inventory.repository.CharacterRepository;
import com.inventory.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CharacterService {

    private final CharacterRepository characterRepository;
    private final UserRepository userRepository;
    private final PyarrCalendarService calendarService;

    public CharacterService(CharacterRepository characterRepository, 
                          UserRepository userRepository,
                          PyarrCalendarService calendarService) {
        this.characterRepository = characterRepository;
        this.userRepository = userRepository;
        this.calendarService = calendarService;
    }

    public List<CharacterResponse> getCharactersByUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Character> characters = characterRepository.findByUserId(user.getId());
        return characters.stream()
                .map(c -> new CharacterResponse(c, calendarService))
                .collect(Collectors.toList());
    }

    public CharacterResponse createCharacter(String username, CharacterRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (characterRepository.existsByNameAndUserId(request.getName(), user.getId())) {
            throw new RuntimeException("Character name already exists");
        }

        Character character = new Character();
        character.setName(request.getName());
        character.setUser(user);

        Character saved = characterRepository.save(character);
        return new CharacterResponse(saved, calendarService);
    }

    public void deleteCharacter(String username, Long characterId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new RuntimeException("Character not found"));

        characterRepository.delete(character);
    }

    public CharacterResponse incrementDay(String username, Long characterId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new RuntimeException("Character not found"));

        Map<String, Integer> newDate = calendarService.incrementDay(
                character.getCurrentYear(), 
                character.getCurrentDay());
        
        character.setCurrentYear(newDate.get("year"));
        character.setCurrentDay(newDate.get("day"));
        
        Character saved = characterRepository.save(character);
        return new CharacterResponse(saved, calendarService);
    }

    public CharacterResponse decrementDay(String username, Long characterId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new RuntimeException("Character not found"));

        Map<String, Integer> newDate = calendarService.decrementDay(
                character.getCurrentYear(), 
                character.getCurrentDay());
        
        character.setCurrentYear(newDate.get("year"));
        character.setCurrentDay(newDate.get("day"));
        
        Character saved = characterRepository.save(character);
        return new CharacterResponse(saved, calendarService);
    }
}
