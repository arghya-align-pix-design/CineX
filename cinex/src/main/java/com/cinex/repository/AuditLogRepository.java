package com.cinex.repository;

import com.cinex.entity.AuditAction;
import com.cinex.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByTimestampDesc();

    List<AuditLog> findByActionOrderByTimestampDesc(AuditAction action);

    List<AuditLog> findByActorEmailOrderByTimestampDesc(String actorEmail);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:actor IS NULL OR a.actorEmail = :actor) AND " +
           "(:from IS NULL OR a.timestamp >= :from) AND " +
           "(:to IS NULL OR a.timestamp <= :to) " +
           "ORDER BY a.timestamp DESC")
    List<AuditLog> findWithFilters(
        @Param("action") AuditAction action,
        @Param("actor") String actor,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );
}
