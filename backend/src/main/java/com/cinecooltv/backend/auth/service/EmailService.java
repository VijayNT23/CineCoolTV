package com.cinecooltv.backend.auth.service;

import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
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

            Map<String, Object> body = new HashMap<>();
            body.put("sender", Map.of(
                    "email", senderEmail,
                    "name", senderName
            ));
            body.put("to", List.of(
                    Map.of("email", toEmail)
            ));
            body.put("subject", "Your CineCoolTV OTP Code");
            body.put("htmlContent",
                    "<h2>Your OTP Code</h2>" +
                            "<p><b>" + otp + "</b></p>" +
                            "<p>This OTP expires in 5 minutes.</p>"
            );

            HttpEntity<Map<String, Object>> entity =
                    new HttpEntity<>(body, headers);

            ResponseEntity<String> response =
                    restTemplate.postForEntity(
                            BREVO_API_URL,
                            entity,
                            String.class
                    );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Brevo API failed");
            }

            log.info("✅ OTP email sent to {}", toEmail);

        } catch (Exception e) {
            log.error("❌ Brevo email failed for {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send OTP email");
        }
    }
}
