package com.cinex.service;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cinex.entity.User;
import com.cinex.repo.UserRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VendorInviteService {
    private final UserRepo userRepository;
    private final PasswordEncoder passwordEncoder;

    public String inviteVendor(String email){
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        String tempPassword = UUID.randomUUID().toString().substring(0, 8);

        User vendor = new User();
        vendor.setEmail(email);
        vendor.setPasswordHash(passwordEncoder.encode(tempPassword));
        vendor.setRole(User.Role.VENDOR);
        vendor.setApproved(true);
        vendor.setFirstLogin(true);

        userRepository.save(vendor);

        // In production this would send an email
        // For now we return temp password directly so you can test in Postman
        return "Vendor created. Temp password: " + tempPassword;
    }

    public void changePassword(String email, String newPassword){
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User Not Found!!"));
        
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setFirstLogin(false);
        userRepository.save(user);
    }

}
