package com.cinex.repository;

import com.cinex.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByTokenAndRevokedFalse(String token);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.family = :family")
    void revokeAllByFamily(@Param("family") String family);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.userEmail = :email")
    void deleteByUserEmail(@Param("email") String email);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") Instant now);
}
