package com.cinecooltv.backend.auth.service;

import com.cinecooltv.backend.model.OtpVerification;
import com.cinecooltv.backend.repository.OtpRepository;
import com.cinecooltv.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpService {

    private final OtpRepository otpRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // ✅ MANUAL CONSTRUCTOR (NO LOMBOK)
    public OtpService(
            OtpRepository otpRepository,
            UserRepository userRepository,
            EmailService emailService
    ) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

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
        // Delete old OTPs for this email
        otpRepository.deleteByEmail(email);

        String otp = generateOtp();

        // ❌ NO BUILDER (Lombok removed)
        OtpVerification entity = new OtpVerification();
        entity.setEmail(email);
        entity.setOtp(otp);
        entity.setExpiry(LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES));
        entity.setAttempts(0);
        entity.setVerified(false);
        entity.setUsed(false);

        otpRepository.save(entity);
        return otp;
    }

    // 📩 Create & send OTP
    @Transactional
    public void createAndSendOtp(String email) {
        String otp = createOtp(email);
        emailService.sendOtpEmail(email, otp);
    }

    // 📩 Login OTP
    @Transactional
    public void sendLoginOtp(String email) {
        String otp = createOtp(email);
        emailService.sendOtpEmail(email, otp);
    }

    // ✅ Verify OTP (NO auto user verification)
    @Transactional
    public void verifyOtp(String email, String otp) {

        OtpVerification record = otpRepository
                .findTopByEmailOrderByExpiryDesc(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "OTP not found"
                ));

        // Already used
        if (record.isUsed()) {
            otpRepository.delete(record);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP already used"
            );
        }

        // Expired
        if (record.getExpiry().isBefore(LocalDateTime.now())) {
            otpRepository.delete(record);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP expired"
            );
        }

        // Wrong OTP
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

        // ✅ Correct OTP
        record.setUsed(true);
        otpRepository.save(record);
    }

    // 🧹 Cleanup expired OTPs ONLY (SAFE)
    @Transactional
    public void cleanupExpiredOtps() {
        otpRepository.deleteByExpiryBefore(LocalDateTime.now());
    }

    // 🔍 Check OTP validity without consuming it
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
