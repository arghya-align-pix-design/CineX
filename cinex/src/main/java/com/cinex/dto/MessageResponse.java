package com.cinex.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private Long id;
    private Long senderId;
    private String senderEmail;
    private Long recipientId;
    private String recipientEmail;
    private String content;
    private String messageType;
    private String subject;
    private String reportPeriod;
    private Long totalBookings;
    private Double totalRevenue;
    private Long totalShows;
    private LocalDateTime sentAt;
    private boolean read;
}
