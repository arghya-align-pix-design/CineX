package com.cinex.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cinex.config.JwtUtil;
import com.cinex.dto.AuthResponse;
import com.cinex.dto.RegisterRequest;
import com.cinex.entity.User;
import com.cinex.repository.UserRepository;
import com.cinex.repository.BannedVendorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final BannedVendorRepository bannedVendorRepository;

    public AuthResponse register(RegisterRequest request) {
        if (bannedVendorRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("This email has been permanently banned from the platform");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.CONSUMER); // Default role, can be changed later by admin
        user.setApproved(true);
        user.setFirstLogin(false);

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getRole().name());
    }

    public AuthResponse login(String email, String password) {
        if (bannedVendorRepository.existsByEmail(email)) {
            throw new RuntimeException("This email has been permanently banned from the platform");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.ADMIN) {
            throw new RuntimeException("Administrators must authenticate via the secure Admin Portal.");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid password");
        }

        if (!user.isApproved()) {
            throw new RuntimeException("Account not approved yet");
        }
        
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        
        AuthResponse response = new AuthResponse(token, user.getRole().name());
        response.setFirstLogin(user.isFirstLogin());
        return response;
    }

    public AuthResponse refreshToken(String token) {
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Refresh token is required");
        }

        if (!jwtUtil.isTokenValidOrExpired(token)) {
            throw new RuntimeException("Invalid token");
        }

        String email = jwtUtil.extractEmailFromAnyToken(token);
        if (bannedVendorRepository.existsByEmail(email)) {
            throw new RuntimeException("This email has been permanently banned from the platform");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String refreshedToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        AuthResponse response = new AuthResponse(refreshedToken, user.getRole().name());
        response.setFirstLogin(user.isFirstLogin());
        return response;
    }
}