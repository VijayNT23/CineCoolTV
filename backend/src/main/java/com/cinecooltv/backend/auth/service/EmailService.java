package com.cinecooltv.backend.auth.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${BREVO_SENDER_EMAIL}")
    private String fromEmail;

    @Value("${BREVO_SENDER_NAME}")
    private String fromName;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(new InternetAddress(fromEmail, fromName));
            helper.setTo(toEmail);
            helper.setSubject("Your CineCoolTV OTP Code");

            helper.setText("""
                <h2>Welcome to CineCoolTV 🎬</h2>
                <p>Your OTP code is:</p>
                <h1>%s</h1>
                <p>This OTP is valid for 5 minutes.</p>
            """.formatted(otp), true);

            mailSender.send(message);
            log.info("✅ OTP email sent to {}", toEmail);

        } catch (Exception e) {
            log.error("❌ OTP email failed for {}", toEmail, e);
            throw new RuntimeException("Unable to send OTP email");
        }
    }
}
