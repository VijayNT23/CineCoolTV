package com.cinecooltv.backend.auth.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class OtpService {

    private final Map<String, OtpData> otpStore = new HashMap<>();

    private static class OtpData {
        String otp;
        LocalDateTime expiryTime;

        OtpData(String otp, LocalDateTime expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
    }

    public String generateOtp(String email) {
        Random random = new Random();
        String otp = String.format("%06d", random.nextInt(999999));

        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(5);
        otpStore.put(email, new OtpData(otp, expiryTime));

        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        OtpData otpData = otpStore.get(email);

        if (otpData == null) {
            return false;
        }

        if (LocalDateTime.now().isAfter(otpData.expiryTime)) {
            otpStore.remove(email);
            return false;
        }

        boolean isValid = otpData.otp.equals(otp);

        if (isValid) {
            otpStore.remove(email);
        }

        return isValid;
    }

    public void clearOtp(String email) {
        otpStore.remove(email);
    }
}