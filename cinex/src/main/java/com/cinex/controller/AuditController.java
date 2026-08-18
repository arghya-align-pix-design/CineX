package com.cinex.controller;

import com.cinex.entity.AuditAction;
import com.cinex.entity.AuditLog;
import com.cinex.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin/audit-log")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuditLog> getAuditLogs(
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        if (action == null && actor == null && from == null && to == null) {
            return auditService.getAll();
        }
        return auditService.getFiltered(action, actor, from, to);
    }
}
