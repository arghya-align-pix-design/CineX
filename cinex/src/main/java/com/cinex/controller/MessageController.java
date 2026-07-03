package com.cinex.controller;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.cinex.dto.MessageResponse;
import com.cinex.dto.SendMessageRequest;
import com.cinex.service.MessageService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/messages")
@PreAuthorize("hasAnyRole('VENDOR', 'ADMIN')")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping
    public List<MessageResponse> getInbox(Authentication authentication) {
        return messageService.getInbox(authentication.getName());
    }

    @PostMapping
    public MessageResponse sendMessage(@RequestBody SendMessageRequest request, Authentication authentication) {
        return messageService.sendMessage(
            authentication.getName(),
            request.getRecipientId(),
            request.getSubject(),
            request.getContent()
        );
    }

    @PutMapping("/{id}/read")
    public String markAsRead(@PathVariable Long id, Authentication authentication) {
        messageService.markAsRead(id, authentication.getName());
        return "Message marked as read";
    }

    @GetMapping("/unread-count")
    public long getUnreadCount(Authentication authentication) {
        return messageService.getUnreadCount(authentication.getName());
    }

    @PostMapping("/broadcast-reports")
    @PreAuthorize("hasRole('ADMIN')")
    public String broadcastReports(Authentication authentication) {
        messageService.broadcastMonthlyReports(authentication.getName());
        return "Monthly performance reports generated and broadcasted to all active vendors successfully";
    }
}
