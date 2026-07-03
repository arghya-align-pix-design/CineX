package com.cinex;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.cinex.entity.BannedVendor;
import com.cinex.entity.User;
import com.cinex.repository.*;
import com.cinex.service.AdminService;
import com.cinex.service.VendorInviteService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@ExtendWith(MockitoExtension.class)
public class AdminDashboardTest {

    @Mock
    private BannedVendorRepository bannedVendorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TheatreRepository theatreRepository;

    @Mock
    private ShowRepository showRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private MovieRepository movieRepository;

    @Mock
    private com.cinex.service.EmailService emailService;

    @InjectMocks
    private VendorInviteService vendorInviteService;

    @InjectMocks
    private AdminService adminService;

    @Test
    public void testInviteVendorBannedEmailThrowsException() {
        String email = "scammer@badvendor.com";
        when(bannedVendorRepository.existsByEmail(email)).thenReturn(true);

        Exception exception = assertThrows(RuntimeException.class, () -> {
            vendorInviteService.inviteVendor(email);
        });

        assertTrue(exception.getMessage().contains("permanently banned"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void testBanVendorDeletesAndBlacklists() {
        Long vendorId = 42L;
        String email = "vendor@cinex.com";
        User user = new User();
        user.setId(vendorId);
        user.setEmail(email);

        when(userRepository.findById(vendorId)).thenReturn(Optional.of(user));

        adminService.banVendor(vendorId, "Malicious activity", "admin@cinex.com");

        verify(bannedVendorRepository, times(1)).save(any(BannedVendor.class));
        verify(userRepository, times(1)).deleteById(vendorId);
        verify(theatreRepository, times(1)).deleteByVendorId(vendorId);
    }
}
