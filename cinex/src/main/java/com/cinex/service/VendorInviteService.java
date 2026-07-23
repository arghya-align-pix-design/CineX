package com.cinex.service;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cinex.entity.User;
import com.cinex.repository.UserRepository;
import com.cinex.repository.BannedVendorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VendorInviteService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BannedVendorRepository bannedVendorRepository;
    private final EmailService emailService;

    public String inviteVendor(String email){
        if (bannedVendorRepository.existsByEmail(email)) {
            throw new RuntimeException("This email has been permanently banned from the platform");
        }

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

        // Dispatch invitation email asynchronously
        emailService.sendInvitationEmail(email, tempPassword);

        return "Vendor invited successfully. Invitation email dispatched to " + email + ". Temp password: " + tempPassword;
    }

    public void changePassword(String email, String newPassword){
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User Not Found!!"));
        
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setFirstLogin(false);
        userRepository.save(user);
    }

}
