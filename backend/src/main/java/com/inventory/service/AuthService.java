package com.inventory.service;

import com.inventory.dto.AuthResponse;
import com.inventory.dto.LoginRequest;
import com.inventory.dto.RegisterRequest;
import com.inventory.entity.User;
import com.inventory.exception.DuplicateResourceException;
import com.inventory.exception.InvalidOperationException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.repository.UserRepository;
import com.inventory.security.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                      JwtUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        log.info("Attempting to register user: {}", request.getUsername());
        
        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("Registration failed: username already exists - {}", request.getUsername());
            throw new DuplicateResourceException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed: email already exists - {}", request.getEmail());
            throw new DuplicateResourceException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);
        log.info("User registered successfully: {}", request.getUsername());

        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername(), user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        log.info("User login attempt: {}", request.getUsername());
        
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        log.info("User logged in successfully: {}", request.getUsername());
        
        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername(), user.getEmail());
    }

    public void deleteAccount(String username, String password) {
        log.info("Account deletion requested for user: {}", username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("Account deletion failed: invalid password for user {}", username);
            throw new InvalidOperationException("Invalid password");
        }

        userRepository.delete(user);
        log.info("Account deleted successfully: {}", username);
    }
}
