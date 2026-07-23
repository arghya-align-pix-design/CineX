package com.cinex.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cinex.config.JwtUtil;
import com.cinex.dto.PlatformStatsResponse;
import com.cinex.dto.VendorResponse;
import com.cinex.entity.BannedVendor;
import com.cinex.entity.User;
import com.cinex.entity.Theatre;
import com.cinex.entity.Show;
import com.cinex.repository.UserRepository;
import com.cinex.repository.BannedVendorRepository;
import com.cinex.repository.TheatreRepository;
import com.cinex.repository.ShowRepository;
import com.cinex.repository.BookingRepository;
import com.cinex.repository.MovieRepository;

import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TotpService totpService;
    private final JwtUtil jwtUtil;
    private final BannedVendorRepository bannedVendorRepository;
    private final TheatreRepository theatreRepository;
    private final ShowRepository showRepository;
    private final BookingRepository bookingRepository;
    private final MovieRepository movieRepository;

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

    public List<VendorResponse> listVendors() {
        return userRepository.findByRole(User.Role.VENDOR).stream()
                .map(u -> new VendorResponse(u.getId(), u.getEmail(), u.isApproved(), u.isFirstLogin()))
                .toList();
    }

    public void suspendVendor(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
        user.setApproved(false);
        userRepository.save(user);
    }

    public void reactivateVendor(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
        user.setApproved(true);
        userRepository.save(user);
    }

    @Transactional
    public void banVendor(Long id, String reason, String adminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        BannedVendor bannedVendor = new BannedVendor();
        bannedVendor.setEmail(user.getEmail());
        bannedVendor.setReason(reason);
        bannedVendor.setBannedAt(LocalDateTime.now());
        bannedVendor.setBannedBy(adminEmail);
        bannedVendorRepository.save(bannedVendor);

        deleteVendorCascade(id);
    }

    @Transactional
    public void deleteVendor(Long id) {
        deleteVendorCascade(id);
    }

    private void deleteVendorCascade(Long vendorId) {
        List<Theatre> theatres = theatreRepository.findByVendorId(vendorId);
        for (Theatre theatre : theatres) {
            List<Show> shows = showRepository.findByTheatreId(theatre.getId());
            for (Show show : shows) {
                bookingRepository.deleteByShowId(show.getId());
            }
            showRepository.deleteByTheatreId(theatre.getId());
        }
        theatreRepository.deleteByVendorId(vendorId);
        userRepository.deleteById(vendorId);
    }

    public List<BannedVendor> listBannedVendors() {
        return bannedVendorRepository.findAllByOrderByBannedAtDesc();
    }

    public PlatformStatsResponse getStats() {
        long totalVendors = userRepository.countByRole(User.Role.VENDOR);
        long activeVendors = userRepository.countByRoleAndApprovedTrue(User.Role.VENDOR);
        long suspendedVendors = userRepository.countByRoleAndApprovedFalse(User.Role.VENDOR);
        long bannedVendors = bannedVendorRepository.count();
        long totalMovies = movieRepository.count();
        long activeMovies = movieRepository.countByIsActiveTrue();

        return new PlatformStatsResponse(
            totalVendors,
            activeVendors,
            suspendedVendors,
            bannedVendors,
            totalMovies,
            activeMovies
        );
    }

    public Map<String, Object> loginStep1(String email, String password) {
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Unauthorized role. This portal is for Administrators only.");
        }

        if (!passwordEncoder.matches(password, admin.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("role", "ADMIN");
        response.put("firstLogin", admin.isFirstLogin());
        response.put("status", "MFA_CHALLENGE");
        return response;
    }
}