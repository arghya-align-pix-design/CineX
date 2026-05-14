package com.cinex.service;

import com.cinex.config.JwtUtil;
import com.cinex.entity.User;
import com.cinex.repo.UserRepo;
import com.cinex.service.TotpService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepo userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TotpService totpService;
    private final JwtUtil jwtUtil;

    public String setupAdmin(String email, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Admin already exists");
        }

        String secret = totpService.generateSecret();

        User admin = new User();
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(User.Role.ADMIN);
        admin.setApproved(true);
        admin.setFirstLogin(false);
        admin.setTotpSecret(secret);

        userRepository.save(admin);

        return "Admin created. TOTP Secret: " + secret;
    }

    public String verifyTotp(String email, int code) {
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (admin.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Not an admin account");
        }

        boolean valid = totpService.validateCode(admin.getTotpSecret(), code);
        if (!valid) {
            throw new RuntimeException("Invalid OTP code");
        }

        return jwtUtil.generateToken(admin.getEmail(), admin.getRole().name());
    }
}