package com.inventory.service;

import com.inventory.dto.CharacterRequest;
import com.inventory.entity.Character;
import com.inventory.entity.User;
import com.inventory.repository.CharacterRepository;
import com.inventory.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CharacterService {

    private final CharacterRepository characterRepository;
    private final UserRepository userRepository;

    public CharacterService(CharacterRepository characterRepository, UserRepository userRepository) {
        this.characterRepository = characterRepository;
        this.userRepository = userRepository;
    }

    public List<Character> getCharactersByUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return characterRepository.findByUserId(user.getId());
    }

    public Character createCharacter(String username, CharacterRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = new Character();
        character.setName(request.getName());
        character.setUser(user);

        return characterRepository.save(character);
    }

    public void deleteCharacter(String username, Long characterId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Character character = characterRepository.findByIdAndUserId(characterId, user.getId())
                .orElseThrow(() -> new RuntimeException("Character not found"));

        characterRepository.delete(character);
    }
}
