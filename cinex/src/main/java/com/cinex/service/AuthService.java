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

import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;

import com.cinex.entity.PasswordResetToken;
import com.cinex.repository.PasswordResetTokenRepository;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final BannedVendorRepository bannedVendorRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    @Value("${cinex.app.reset-url:https://arghyadip.store/reset-password}")
    private String resetBaseUrl;

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

    public AuthResponse demoLogin() {
        String demoEmail = "demo@cinex.com";
        User user = userRepository.findByEmail(demoEmail)
                .orElseGet(() -> {
                    User u = new User();
                    u.setEmail(demoEmail);
                    u.setPasswordHash(passwordEncoder.encode("demo123"));
                    u.setRole(User.Role.CONSUMER);
                    u.setApproved(true);
                    u.setFirstLogin(false);
                    return userRepository.save(u);
                });

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), true);
        AuthResponse response = new AuthResponse(token, user.getRole().name(), true);
        response.setFirstLogin(false);
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

    public String forgotPassword(String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email entered is not registered."));

        if (user.getRole() != User.Role.CONSUMER) {
            throw new RuntimeException("Password reset via email is currently available for Consumer accounts only.");
        }

        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);

        PasswordResetToken resetToken = new PasswordResetToken(token, user.getEmail(), expiresAt);
        passwordResetTokenRepository.save(resetToken);

        String resetLink = resetBaseUrl + "?token=" + token;
        emailService.sendPasswordResetLink(user.getEmail(), resetLink);

        return "Password reset link sent to your email. Please check your inbox (active for 15 minutes).";
    }

    public String resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Reset token is required");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters long");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("This reset link has expired or is invalid."));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("This reset link has expired or has already been used.");
        }

        User user = userRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new RuntimeException("User account not found"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        return "Password updated successfully. You can now sign in with your new password.";
    }
}