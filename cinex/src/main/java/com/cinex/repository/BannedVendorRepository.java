package com.cinex.repository;

import com.cinex.entity.BannedVendor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BannedVendorRepository extends JpaRepository<BannedVendor, Long> {
    boolean existsByEmail(String email);
    Optional<BannedVendor> findByEmail(String email);
    List<BannedVendor> findAllByOrderByBannedAtDesc();
}
