package com.cinex.dto;

import lombok.Data;

@Data
public class SendMessageRequest {
    private Long recipientId;
    private String subject;
    private String content;
}
