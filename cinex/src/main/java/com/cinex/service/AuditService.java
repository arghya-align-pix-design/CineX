package com.cinex.service;

import com.cinex.entity.AuditAction;
import com.cinex.entity.AuditLog;
import com.cinex.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Audit logging service.
 * 
 * The log() method runs ASYNCHRONOUSLY (@Async) so it never slows down
 * the actual business operation. If the audit insert fails for some reason,
 * the main action (ban, delete, etc.) still completes successfully.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository auditLogRepository;

    /**
     * Record an audit event asynchronously.
     * 
     * @param action     what happened (e.g., VENDOR_BANNED)
     * @param actorEmail who did it (e.g., "admin@cinex.com")
     * @param targetType what kind of thing was affected (e.g., "VENDOR", "MOVIE")
     * @param targetId   identifier of the affected thing (e.g., vendor email, movie title)
     * @param details    human-readable description
     */
    @Async
    public void log(AuditAction action, String actorEmail, String targetType, String targetId, String details) {
        try {
            AuditLog entry = new AuditLog();
            entry.setAction(action);
            entry.setActorEmail(actorEmail);
            entry.setTargetType(targetType);
            entry.setTargetId(targetId);
            entry.setDetails(details);
            entry.setTimestamp(LocalDateTime.now());
            auditLogRepository.save(entry);
        } catch (Exception e) {
            // Never let audit logging crash the main operation
            log.error("Failed to write audit log: {} by {} on {}", action, actorEmail, targetId, e);
        }
    }

    public List<AuditLog> getAll() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    public List<AuditLog> getFiltered(AuditAction action, String actor, LocalDateTime from, LocalDateTime to) {
        return auditLogRepository.findWithFilters(action, actor, from, to);
    }
}
