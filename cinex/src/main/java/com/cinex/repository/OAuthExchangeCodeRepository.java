package com.cinex.repository;

import com.cinex.entity.OAuthExchangeCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface OAuthExchangeCodeRepository extends JpaRepository<OAuthExchangeCode, Long> {
    Optional<OAuthExchangeCode> findByCodeAndUsedFalse(String code);

    @Modifying
    @Query("DELETE FROM OAuthExchangeCode c WHERE c.expiresAt < :now")
    int deleteExpiredCodes(@Param("now") Instant now);
}
