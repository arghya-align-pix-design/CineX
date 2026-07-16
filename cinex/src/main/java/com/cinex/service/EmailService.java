package com.cinex.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${cinex.mail.from:noreply@cinex.com}")
    private String mailFrom;

    @Value("${cinex.mail.sender-name:CineX No-Reply}")
    private String senderName;

    @Value("${cinex.app.portal-url:http://localhost:5173/login}")
    private String portalUrl;

    @Async
    public void sendInvitationEmail(String toEmail, String tempPassword) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(senderName + " <" + mailFrom + ">");
            helper.setTo(toEmail);
            helper.setSubject("Welcome to CineX - Vendor Invitation");

            String htmlContent = "<div style=\"background-color: #09090B; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #D4D4D8; text-align: center;\">" +
                    "  <div style=\"max-width: 550px; margin: 0 auto; background-color: #121214; border: 1px solid #27272A; border-top: 4px solid #E8B84B; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); text-align: left;\">" +
                    "    <div style=\"text-align: center; margin-bottom: 30px;\">" +
                    "      <span style=\"font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #E8B84B;\">CINEX</span>" +
                    "      <div style=\"font-size: 11px; color: #71717A; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 5px;\">Vendor Administration Portal</div>" +
                    "    </div>" +
                    "    <h2 style=\"color: #FFFFFF; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 15px;\">You have been invited!</h2>" +
                    "    <p style=\"font-size: 14px; line-height: 1.6; color: #A1A1AA; margin-bottom: 25px;\">" +
                    "      The CineX platform administration has invited you to list your theatres, screens, and manage live shows on the CineX ticketing network." +
                    "    </p>" +
                    "    <div style=\"background-color: #18181B; border: 1px solid #27272A; border-radius: 8px; padding: 20px; margin-bottom: 30px;\">" +
                    "      <div style=\"font-size: 11px; text-transform: uppercase; color: #71717A; font-weight: 600; letter-spacing: 1px; margin-bottom: 8px;\">Your Temporary Access Credentials</div>" +
                    "      <div style=\"font-size: 14px; margin-bottom: 10px;\">" +
                    "        <span style=\"color: #71717A; width: 80px; display: inline-block;\">Email:</span>" +
                    "        <strong style=\"color: #FFFFFF; font-family: monospace;\">" + toEmail + "</strong>" +
                    "      </div>" +
                    "      <div style=\"font-size: 14px;\">" +
                    "        <span style=\"color: #71717A; width: 80px; display: inline-block;\">Password:</span>" +
                    "        <strong style=\"color: #E8B84B; font-family: monospace; font-size: 16px;\">" + tempPassword + "</strong>" +
                    "      </div>" +
                    "    </div>" +
                    "    <p style=\"font-size: 13px; line-height: 1.5; color: #71717A; margin-bottom: 25px;\">" +
                    "      *Upon your first login, you will be prompted to replace this temporary password with a secure password of your choice to complete activation." +
                    "    </p>" +
                    "    <div style=\"text-align: center; margin-bottom: 25px;\">" +
                    "      <a href=\"" + portalUrl + "\" style=\"display: inline-block; background-color: #E8B84B; color: #09090B; font-weight: 700; text-decoration: none; padding: 12px 36px; border-radius: 8px; font-size: 14px; transition: background-color 0.2s;\">" +
                    "        Access Control Panel" +
                    "      </a>" +
                    "    </div>" +
                    "    <hr style=\"border: 0; border-top: 1px solid #27272A; margin: 30px 0;\" />" +
                    "    <div style=\"font-size: 11px; color: #52525B; text-align: center;\">" +
                    "      If you did not request this invite, please contact administrator support. This is an automated email notification." +
                    "    </div>" +
                    "  </div>" +
                    "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            log.info("Invitation email successfully sent to vendor: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send vendor invitation email to {}. Exception details: {}", toEmail, e.getMessage());
        }
    }
}
