package com.cinecooltv.backend.auth.service;

import com.cinecooltv.backend.model.OtpVerification;
import com.cinecooltv.backend.model.User;
import com.cinecooltv.backend.repository.OtpRepository;
import com.cinecooltv.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MAX_ATTEMPTS = 5;
    private static final int OTP_VALIDITY_MINUTES = 10;

    // 🔐 Generate secure 6-digit OTP
    private String generateOtp() {
        return String.valueOf(100000 + RANDOM.nextInt(900000));
    }

    // ✅ Create OTP without sending email
    @Transactional
    public String createOtp(String email) {
        // Cleanup old OTPs for this email
        otpRepository.deleteByEmail(email);

        String otp = generateOtp();

        OtpVerification entity = OtpVerification.builder()
                .email(email)
                .otp(otp)
                .expiry(LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES))
                .attempts(0)
                .verified(false)
                .used(false)
                .build();

        otpRepository.save(entity);
        return otp;
    }

    // 📩 Create & send OTP
    @Transactional
    public void createAndSendOtp(String email) {
        String otp = createOtp(email);
        emailService.sendOtpEmail(email, otp);
    }

    // ✅ Send login OTP (separate from signup OTP if needed)
    @Transactional
    public void sendLoginOtp(String email) {
        String otp = createOtp(email);
        emailService.sendOtpEmail(email, otp);
    }

    // ✅ CRITICAL FIX: Verify OTP without auto-verifying user
    @Transactional
    public void verifyOtp(String email, String otp) {
        OtpVerification record = otpRepository
                .findTopByEmailOrderByExpiryDesc(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "OTP not found"
                ));

        // Check if OTP is already used
        if (record.isUsed()) {
            otpRepository.delete(record);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP already used"
            );
        }

        // Check if OTP is expired
        if (record.getExpiry().isBefore(LocalDateTime.now())) {
            otpRepository.delete(record);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP expired"
            );
        }

        // Check if OTP matches
        if (!record.getOtp().equals(otp)) {
            int attempts = record.getAttempts() + 1;
            record.setAttempts(attempts);

            if (attempts >= MAX_ATTEMPTS) {
                otpRepository.delete(record);
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Too many failed attempts. Request a new OTP."
                );
            }

            otpRepository.save(record);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid OTP"
            );
        }

        // ✅ OTP is valid - mark as used but DON'T delete immediately
        record.setUsed(true);
        otpRepository.save(record);

        // ✅ CRITICAL: Do NOT auto-verify the user here
        // User verification is now handled by AuthService in verifySignupOtp() or verifyLoginOtp()
    }

    // 🧹 Cleanup expired and used OTPs
    @Transactional
    public void cleanupExpiredOtps() {
        // Delete expired OTPs
        otpRepository.deleteByExpiryBefore(LocalDateTime.now());

        // Also cleanup used OTPs older than 1 hour
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        otpRepository.deleteByUsedTrueAndUpdatedAtBefore(oneHourAgo);
    }

    // 🔍 Check if OTP exists and is valid (without verifying)
    public boolean isOtpValid(String email, String otp) {
        return otpRepository.findTopByEmailOrderByExpiryDesc(email)
                .map(record -> {
                    if (record.isUsed()) return false;
                    if (record.getExpiry().isBefore(LocalDateTime.now())) return false;
                    return record.getOtp().equals(otp);
                })
                .orElse(false);
    }
}