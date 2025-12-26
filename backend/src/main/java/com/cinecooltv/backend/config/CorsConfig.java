package com.cinecooltv.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Allow credentials
        config.setAllowCredentials(true);

        // ✅ Specific allowed origins (not wildcard when using credentials)
        config.addAllowedOrigin("https://cine-cool-tv.vercel.app");
        config.addAllowedOrigin("http://localhost:3000");

        // ❌ REMOVED: config.addAllowedHeader("*");
        // ✅ CHANGE TO: Specific allowed headers only
        config.addAllowedHeader("Authorization");
        config.addAllowedHeader("Content-Type");
        config.addAllowedHeader("X-Requested-With");
        config.addAllowedHeader("Accept");
        config.addAllowedHeader("Origin");

        // Allow specific methods
        config.addAllowedMethod("OPTIONS");
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("PATCH");

        // Expose specific headers to client
        config.addExposedHeader("Authorization");
        config.addExposedHeader("Content-Type");
        config.addExposedHeader("Access-Control-Allow-Origin");
        config.addExposedHeader("Access-Control-Allow-Credentials");

        // Set max age for preflight requests
        config.setMaxAge(3600L); // 1 hour

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}