package com.cinecooltv.backend.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${BREVO_SENDER_EMAIL}")
    private String senderEmail;

    @Value("${BREVO_SENDER_NAME}")
    private String senderName;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderName + " <" + senderEmail + ">");
            message.setTo(toEmail);
            message.setSubject("Your CineCoolTV OTP Code");
            message.setText(
                    "Your OTP Code: " + otp + "\n\n" +
                            "This OTP expires in 5 minutes.\n\n" +
                            "If you did not request this, ignore this email."
            );

            mailSender.send(message);
            log.info("✅ OTP email sent to {}", toEmail);

        } catch (Exception e) {
            log.error("❌ Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Unable to send OTP email. Please try again.");
        }
    }
}
