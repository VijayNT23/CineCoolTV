package com.cinecooltv.backend.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailService {

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendOtpEmail(String toEmail, String otp) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        Map<String, Object> body = Map.of(
                "sender", Map.of(
                        "email", senderEmail,
                        "name", senderName
                ),
                "to", List.of(
                        Map.of("email", toEmail)
                ),
                "subject", "Your CineCoolTV OTP",
                "htmlContent",
                "<h2>Your OTP</h2>" +
                        "<p><b>" + otp + "</b></p>" +
                        "<p>This OTP expires in 5 minutes.</p>"
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response =
                    restTemplate.postForEntity(BREVO_API_URL, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Brevo API failed");
            }

            log.info("✅ OTP email sent to {}", toEmail);

        } catch (Exception e) {
            log.error("❌ Brevo email failed: {}", e.getMessage());
            throw new RuntimeException("Unable to send OTP email");
        }
    }
}
