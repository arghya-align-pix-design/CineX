package com.cinex.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cinex.dto.MessageResponse;
import com.cinex.entity.Message;
import com.cinex.entity.User;
import com.cinex.repository.BookingRepository;
import com.cinex.repository.MessageRepository;
import com.cinex.repository.ShowRepository;
import com.cinex.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ShowRepository showRepository;
    private final BookingRepository bookingRepository;

    public List<MessageResponse> getInbox(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Message> messages = messageRepository.findConversationsForUser(user.getId());
        List<MessageResponse> responses = new ArrayList<>();

        for (Message m : messages) {
            MessageResponse resp = new MessageResponse();
            resp.setId(m.getId());
            resp.setSenderId(m.getSender().getId());
            resp.setSenderEmail(m.getSender().getEmail());
            if (m.getRecipient() != null) {
                resp.setRecipientId(m.getRecipient().getId());
                resp.setRecipientEmail(m.getRecipient().getEmail());
            }
            resp.setContent(m.getContent());
            resp.setMessageType(m.getMessageType().name());
            resp.setSubject(m.getSubject());
            resp.setReportPeriod(m.getReportPeriod());
            resp.setTotalBookings(m.getTotalBookings());
            resp.setTotalRevenue(m.getTotalRevenue());
            resp.setTotalShows(m.getTotalShows());
            resp.setSentAt(m.getSentAt());
            resp.setRead(m.isRead());
            responses.add(resp);
        }
        return responses;
    }

    @Transactional
    public MessageResponse sendMessage(String senderEmail, Long recipientId, String subject, String content) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User recipient = null;
        if (recipientId != null && recipientId > 0) {
            recipient = userRepository.findById(recipientId)
                    .orElseThrow(() -> new RuntimeException("Recipient not found"));
        } else {
            // Find first ADMIN if recipient is not specified (vendor sending to admin)
            List<User> admins = userRepository.findByRole(User.Role.ADMIN);
            if (admins.isEmpty()) {
                throw new RuntimeException("No admin user found to receive message");
            }
            recipient = admins.get(0);
        }

        Message message = new Message();
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setSubject(subject != null ? subject : "Direct Message");
        message.setContent(content);
        message.setMessageType(Message.MessageType.TEXT);
        message.setSentAt(LocalDateTime.now());
        message.setRead(false);

        Message saved = messageRepository.save(message);
        
        return new MessageResponse(
            saved.getId(),
            saved.getSender().getId(),
            saved.getSender().getEmail(),
            saved.getRecipient().getId(),
            saved.getRecipient().getEmail(),
            saved.getContent(),
            saved.getMessageType().name(),
            saved.getSubject(),
            null, null, null, null,
            saved.getSentAt(),
            saved.isRead()
        );
    }

    @Transactional
    public void markAsRead(Long messageId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        // Only mark as read if the current user is the recipient
        if (message.getRecipient() != null && message.getRecipient().getId().equals(user.getId())) {
            message.setRead(true);
            messageRepository.save(message);
        }
    }

    public long getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return messageRepository.countByRecipientIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public void broadcastMonthlyReports(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        List<User> vendors = userRepository.findByRole(User.Role.VENDOR);
        LocalDateTime now = LocalDateTime.now();
        String period = now.format(DateTimeFormatter.ofPattern("MMMM yyyy"));

        for (User vendor : vendors) {
            if (!vendor.isApproved()) {
                continue; // skip suspended/unapproved vendors
            }

            long totalShows = showRepository.countByTheatreVendorId(vendor.getId());
            long totalBookings = bookingRepository.countConfirmedByVendorId(vendor.getId());
            double totalRevenue = bookingRepository.sumRevenueByVendorId(vendor.getId());

            String content = String.format(
                "CineX Platform Invoice & Usage Report for %s.\n\n" +
                "Summary:\n" +
                "- Active Shows: %d\n" +
                "- Total Tickets Booked: %d\n" +
                "- Accumulated Gross Revenue: $%.2f\n\n" +
                "Thank you for listing your screens with CineX! Please review the figures above. Your monthly system licensing fee is calculated based on these parameters.",
                period, totalShows, totalBookings, totalRevenue
            );

            Message report = new Message();
            report.setSender(admin);
            report.setRecipient(vendor);
            report.setSubject("CineX Monthly Business & Usage Report - " + period);
            report.setContent(content);
            report.setMessageType(Message.MessageType.REPORT);
            report.setReportPeriod(period);
            report.setTotalShows(totalShows);
            report.setTotalBookings(totalBookings);
            report.setTotalRevenue(totalRevenue);
            report.setSentAt(LocalDateTime.now());
            report.setRead(false);

            messageRepository.save(report);
        }
    }
}
