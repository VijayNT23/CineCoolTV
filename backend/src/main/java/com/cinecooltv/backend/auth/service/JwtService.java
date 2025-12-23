package com.cinecooltv.backend.auth.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expiration;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration
    ) {

        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET must be at least 32 characters long"
            );
        }

        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    // =========================
    // 🔐 GENERATE TOKEN
    // =========================
    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // =========================
    // 📩 EXTRACT EMAIL
    // =========================
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // =========================
    // ✅ TOKEN VALIDATION
    // =========================
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // =========================
    // 🔍 GENERIC CLAIM EXTRACTION
    // =========================
    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    // =========================
    // 📦 PARSE JWT
    // =========================
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
