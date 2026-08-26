package com.cinex.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import com.cinex.dto.AdminSetupRequest;
import com.cinex.dto.AuthResponse;
import com.cinex.dto.BanRequest;
import com.cinex.dto.LoginRequest;
import com.cinex.dto.MovieRequest;
import com.cinex.dto.MovieAdminResponse;
import com.cinex.dto.PlatformStatsResponse;
import com.cinex.dto.TotpVerifyRequest;
import com.cinex.dto.VendorInviteRequest;
import com.cinex.dto.VendorResponse;
import com.cinex.entity.BannedVendor;
import com.cinex.entity.Movie;
import com.cinex.service.AdminService;
import com.cinex.service.VendorInviteService;
import com.cinex.service.MovieService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final VendorInviteService vendorInviteService;
    private final MovieService movieService;

    // Only use this once to create first admin
    // Remove or secure this endpoint in production
    @PostMapping("/setup")
    public Map<String, String> setupAdmin(@Valid @RequestBody AdminSetupRequest request) {
        return adminService.setupAdmin(request.getEmail(), request.getPassword());
    }

    private final com.cinex.config.CookieUtil cookieUtil;

    @PostMapping("/verify-totp")
    public AuthResponse verifyTotp(@Valid @RequestBody TotpVerifyRequest request,
                                   jakarta.servlet.http.HttpServletResponse response) {
        com.cinex.dto.TokenPair pair = adminService.verifyTotp(request.getEmail(), request.getCode());
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookieUtil.createAccessCookie(pair.getAccessToken(), false).toString());
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookieUtil.createRefreshCookie(pair.getRefreshToken()).toString());
        return new AuthResponse(pair.getAccessToken(), pair.getRole());
    }

    @PostMapping("/login-step1")
    public Map<String, Object> loginStep1(@Valid @RequestBody LoginRequest request) {
        return adminService.loginStep1(request.getEmail(), request.getPassword());
    }

    @GetMapping("/vendors")
    @PreAuthorize("hasRole('ADMIN')")
    public List<VendorResponse> getAllVendors() {
        return adminService.listVendors();
    }

    @PostMapping("/vendors/invite")
    @PreAuthorize("hasRole('ADMIN')")
    public String inviteVendor(@Valid @RequestBody VendorInviteRequest request) {
        return vendorInviteService.inviteVendor(request.getEmail());
    }

    @PutMapping("/vendors/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public String suspendVendor(@PathVariable Long id, Authentication authentication) {
        adminService.suspendVendor(id, authentication.getName());
        return "Vendor account suspended successfully";
    }

    @PutMapping("/vendors/{id}/reactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public String reactivateVendor(@PathVariable Long id, Authentication authentication) {
        adminService.reactivateVendor(id, authentication.getName());
        return "Vendor account reactivated successfully";
    }

    @PostMapping("/vendors/{id}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    public String banVendor(@PathVariable Long id, @RequestBody BanRequest banRequest, Authentication authentication) {
        adminService.banVendor(id, banRequest.getReason(), authentication.getName());
        return "Vendor banned and deleted successfully";
    }

    @DeleteMapping("/vendors/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String deleteVendor(@PathVariable Long id, Authentication authentication) {
        adminService.deleteVendor(id, authentication.getName());
        return "Vendor deleted successfully";
    }

    @GetMapping("/vendors/banned")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BannedVendor> getBannedVendors() {
        return adminService.listBannedVendors();
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public PlatformStatsResponse getStats() {
        return adminService.getStats();
    }

    // Movie management endpoints for Admin
    @GetMapping("/movies")
    @PreAuthorize("hasRole('ADMIN')")
    public List<MovieAdminResponse> getAllMovies() {
        return movieService.getAllMoviesWithStats();
    }

    @PostMapping("/movies")
    @PreAuthorize("hasRole('ADMIN')")
    public Movie createMovie(@Valid @RequestBody MovieRequest request, Authentication authentication) {
        return movieService.createMovie(request, authentication.getName());
    }

    @PutMapping("/movies/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Movie updateMovie(@PathVariable Long id, @Valid @RequestBody MovieRequest request, Authentication authentication) {
        return movieService.updateMovie(id, request, authentication.getName());
    }

    @PutMapping("/movies/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public Movie toggleMovieActive(@PathVariable Long id, Authentication authentication) {
        return movieService.toggleMovieActive(id, authentication.getName());
    }
}