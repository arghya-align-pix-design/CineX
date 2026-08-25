package com.cinex.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cinex.config.JwtUtil;
import com.cinex.dto.AuthResponse;
import com.cinex.dto.RegisterRequest;
import com.cinex.dto.TokenPair;
import com.cinex.entity.OAuthExchangeCode;
import com.cinex.entity.PasswordResetToken;
import com.cinex.entity.RefreshToken;
import com.cinex.entity.User;
import com.cinex.repository.BannedVendorRepository;
import com.cinex.repository.OAuthExchangeCodeRepository;
import com.cinex.repository.PasswordResetTokenRepository;
import com.cinex.repository.RefreshTokenRepository;
import com.cinex.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final BannedVendorRepository bannedVendorRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OAuthExchangeCodeRepository oAuthExchangeCodeRepository;
    private final EmailService emailService;

    @Value("${cinex.app.reset-url:https://arghyadip.store/reset-password}")
    private String resetBaseUrl;

    @Transactional
    public TokenPair register(RegisterRequest request) {
        if (bannedVendorRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("This email has been permanently banned from the platform");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.CONSUMER);
        user.setApproved(true);
        user.setFirstLogin(false);

        userRepository.save(user);

        return createTokenPair(user, false, null);
    }

    @Transactional
    public TokenPair login(String email, String password) {
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

        return createTokenPair(user, false, null);
    }

    @Transactional
    public TokenPair demoLogin() {
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

        return createTokenPair(user, true, null);
    }

    @Transactional
    public TokenPair createTokenPairForUser(User user, boolean isDemo) {
        return createTokenPair(user, isDemo, null);
    }

    @Transactional
    public TokenPair refreshToken(String refreshTokenStr) {
        if (refreshTokenStr == null || refreshTokenStr.isBlank()) {
            throw new RuntimeException("Refresh token is required");
        }

        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(refreshTokenStr);

        if (tokenOpt.isEmpty()) {
            throw new RuntimeException("Invalid or expired refresh token");
        }

        RefreshToken token = tokenOpt.get();

        // Refresh Token Reuse Detection
        if (token.isRevoked()) {
            log.warn("SECURITY ALERT: Attempted reuse of revoked refresh token family: {}", token.getFamily());
            refreshTokenRepository.revokeAllByFamily(token.getFamily());
            throw new RuntimeException("Revoked refresh token presented. All sessions in family terminated.");
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            throw new RuntimeException("Expired refresh token");
        }

        String email = token.getUserEmail();
        if (bannedVendorRepository.existsByEmail(email)) {
            throw new RuntimeException("This email has been permanently banned from the platform");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Revoke the current refresh token (single-use rotation)
        token.setRevoked(true);
        refreshTokenRepository.save(token);

        // Continue the SAME token family
        return createTokenPair(user, false, token.getFamily());
    }

    @Transactional
    public void logout(String refreshTokenStr) {
        if (refreshTokenStr != null && !refreshTokenStr.isBlank()) {
            refreshTokenRepository.findByToken(refreshTokenStr).ifPresent(token -> {
                refreshTokenRepository.revokeAllByFamily(token.getFamily());
            });
        }
    }

    @Transactional
    public String createOAuthExchangeCode(User user) {
        String code = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plusSeconds(60);
        OAuthExchangeCode entity = new OAuthExchangeCode(code, user.getEmail(), expiresAt);
        oAuthExchangeCodeRepository.save(entity);
        return code;
    }

    @Transactional
    public TokenPair exchangeOAuthCode(String code) {
        if (code == null || code.isBlank()) {
            throw new RuntimeException("Exchange code is required");
        }

        OAuthExchangeCode exchangeCode = oAuthExchangeCodeRepository.findByCodeAndUsedFalse(code)
                .orElseThrow(() -> new RuntimeException("Invalid or expired OAuth exchange code"));

        if (exchangeCode.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("OAuth exchange code expired");
        }

        exchangeCode.setUsed(true);
        oAuthExchangeCodeRepository.save(exchangeCode);

        User user = userRepository.findByEmail(exchangeCode.getUserEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return createTokenPair(user, false, null);
    }

    private TokenPair createTokenPair(User user, boolean isDemo, String existingFamily) {
        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), isDemo);
        String refreshTokenStr = UUID.randomUUID().toString();
        String family = (existingFamily != null) ? existingFamily : UUID.randomUUID().toString();

        Instant now = Instant.now();
        Instant refreshExpiresAt = isDemo ? now.plusSeconds(86400) : now.plusSeconds(86400 * 7); // 7 days

        RefreshToken refreshToken = new RefreshToken(refreshTokenStr, user.getEmail(), now, refreshExpiresAt, family);
        refreshTokenRepository.save(refreshToken);

        return new TokenPair(accessToken, refreshTokenStr, user.getRole().name(), user.getEmail(), user.isFirstLogin(), isDemo);
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