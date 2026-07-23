package com.cinex.controller;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinex.service.VendorInviteService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/vendor")
@RequiredArgsConstructor
public class VendorController {
    private final VendorInviteService vendorInviteService;

    @PostMapping("/invite")
    @PreAuthorize("hasRole('ADMIN')")
    public String inviteVendor(@RequestBody Map<String, String> body) {
        return vendorInviteService.inviteVendor(body.get("email"));
    }

    @PostMapping("/change-password")
    @PreAuthorize("hasRole('VENDOR')")
    public String changePassword(@RequestBody Map<String, String> body,
                                  Authentication authentication) {
        vendorInviteService.changePassword(authentication.getName(), body.get("newPassword"));
        return "Password updated successfully";
    }

}
