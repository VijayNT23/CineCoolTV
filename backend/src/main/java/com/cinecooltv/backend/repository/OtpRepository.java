package com.cinecooltv.backend.repository;

import com.cinecooltv.backend.model.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findByEmail(String email);

    void deleteByEmail(String email); // ✅ REQUIRED

    void deleteByExpiryBefore(LocalDateTime time); // ✅ REQUIRED
}
