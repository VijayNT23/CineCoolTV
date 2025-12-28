package com.cinecooltv.backend.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailService {

    private static final String BREVO_API_URL =
            "https://api.brevo.com/v3/smtp/email";

    @Value("${BREVO_API_KEY}")
    private String apiKey;

    @Value("${BREVO_SENDER_EMAIL}")
    private String senderEmail;

    @Value("${BREVO_SENDER_NAME}")
    private String senderName;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            Map<String, Object> payload = new HashMap<>();
            payload.put("sender", Map.of(
                    "email", senderEmail,
                    "name", senderName
            ));

            payload.put("to", List.of(
                    Map.of("email", toEmail)
            ));

            payload.put("subject", "Your CineCoolTV OTP Code");

            payload.put("htmlContent",
                    "<h2>CineCoolTV OTP Verification</h2>" +
                            "<p>Your OTP is:</p>" +
                            "<h1>" + otp + "</h1>" +
                            "<p>This OTP will expire in <b>5 minutes</b>.</p>" +
                            "<br/>" +
                            "<p>If you did not request this, please ignore this email.</p>"
            );

            HttpEntity<Map<String, Object>> entity =
                    new HttpEntity<>(payload, headers);

            ResponseEntity<String> response =
                    restTemplate.postForEntity(
                            BREVO_API_URL,
                            entity,
                            String.class
                    );

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("❌ Brevo API error: {}", response.getBody());
                throw new RuntimeException("Brevo email API failed");
            }

            log.info("✅ OTP email sent via Brevo API to {}", toEmail);

        } catch (Exception e) {
            log.error("❌ Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Unable to send OTP email. Please try again.");
        }
    }
}
