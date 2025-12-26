package com.cinecooltv.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.json.*;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Value("${tmdb.api.key}")
    private String tmdbKey;

    @Value("${GROQ_API_KEY}")
    private String groqApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // ------------------------------
    // 🧠 Conversation Memory (Last 10 Messages) - Per Session
    // ------------------------------
    private final Map<String, List<String>> conversationSessions = new HashMap<>();

    @PostMapping("/ask")
    public ResponseEntity<Map<String, Object>> askAI(@RequestBody Map<String, Object> request) {
        System.out.println("==========================================");
        System.out.println("▶ RECEIVED AI REQUEST: " + request);

        // 🔥🔥🔥 STEP 1: Add this line at the TOP of askAI()
        System.out.println("🔥🔥🔥 GROQ KEY LOADED: " + groqApiKey);

        // Debug: Check if API key is loaded
        System.out.println("▶ GROQ API KEY LOADED: " + (groqApiKey != null && !groqApiKey.isEmpty() ? "YES (first 10 chars): " + groqApiKey.substring(0, Math.min(10, groqApiKey.length())) : "NO"));

        String question = (String) request.get("question");
        String sessionId = (String) request.get("sessionId");

        if (sessionId == null) sessionId = "default";

        conversationSessions.putIfAbsent(sessionId, new ArrayList<>());
        List<String> conversationHistory = conversationSessions.get(sessionId);

        if (question == null || question.trim().isEmpty()) {
            System.out.println("❌ EMPTY QUESTION RECEIVED");
            return ResponseEntity.badRequest().body(Map.of(
                    "answer", "Please enter a valid movie/series question.",
                    "movies", new ArrayList<>()
            ));
        }

        System.out.println("▶ PROCESSING QUESTION: " + question);

        // Add question
        conversationHistory.add("User: " + question);
        if (conversationHistory.size() > 10) conversationHistory.remove(0);

        try {
            // Build conversation for Groq
            JSONArray messages = new JSONArray();

            // System prompt
            messages.put(new JSONObject()
                    .put("role", "system")
                    .put("content", """
                        You are CineCoolAI — an intelligent movie & series analyst.
                        
                        Your abilities:
                        • Understand ANY question type (comparison, why, how, what, rankings, reviews, summaries).
                        • Automatically adapt response structure based on question type.
                        • Use conversation memory to continue context — NEVER ask the user to repeat.
                        • Provide deep reasoning, cinematic insights, and clear explanations.
                        • Keep responses clean, compact, and mobile-friendly.
                        • Use small emojis only — avoid BIG headers or oversized text.
                        
                        General Style:
                        • Short paragraphs, clean bullet points.
                        • No overuse of bold; clarity is priority.
                        • Use emojis like 🎬 ⭐ 🔍 🥇 🎭 📺 💡
                        • For comparisons → provide detailed head-to-head breakdowns.
                        • For follow-up questions → continue naturally using stored memory.
                        """));

            // Add previous memory (excluding current question which is already added)
            for (String entry : conversationHistory) {
                if (entry.startsWith("User:") && !entry.equals("User: " + question)) {
                    messages.put(new JSONObject()
                            .put("role", "user")
                            .put("content", entry.substring(6)));
                } else if (entry.startsWith("AI:")) {
                    messages.put(new JSONObject()
                            .put("role", "assistant")
                            .put("content", entry.substring(4)));
                }
            }

            // Add current user question
            messages.put(new JSONObject()
                    .put("role", "user")
                    .put("content", question));

            // Build request body
            JSONObject body = new JSONObject();
            body.put("model", "llama-3.1-8b-instant");
            body.put("messages", messages);
            body.put("temperature", 0.7);
            body.put("max_tokens", 1024);

            // 🔥🔥🔥 STEP 2: Add this line before sending request
            System.out.println("🔥🔥🔥 SENDING BODY TO GROQ: " + body.toString());

            // Debug: Print the request body being sent to Groq
            System.out.println("▶ SENDING TO GROQ API:");
            System.out.println("URL: https://api.groq.com/openai/v1/chat/completions");
            System.out.println("HEADERS: Authorization: Bearer " + (groqApiKey != null ? "PRESENT" : "MISSING"));
            System.out.println("BODY LENGTH: " + body.toString().length() + " chars");
            System.out.println("MESSAGE COUNT: " + messages.length());

            // Setup HTTP request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + groqApiKey);

            HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

            System.out.println("▶ CALLING GROQ API...");

            // Call Groq API
            ResponseEntity<String> groqResponse = restTemplate.postForEntity(
                    "https://api.groq.com/openai/v1/chat/completions",
                    entity,
                    String.class
            );

            System.out.println("✅ GROQ RESPONSE STATUS: " + groqResponse.getStatusCode());
            System.out.println("✅ GROQ RESPONSE HEADERS: " + groqResponse.getHeaders());

            // Parse Groq response
            JSONObject resJson = new JSONObject(groqResponse.getBody());
            String aiResponse = resJson
                    .getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content");

            // Save AI response in memory
            conversationHistory.add("AI: " + aiResponse);
            if (conversationHistory.size() > 10) conversationHistory.remove(0);

            // Extract movies from response
            List<Map<String, Object>> movies = extractMoviesFromText(aiResponse);

            Map<String, Object> response = new HashMap<>();
            response.put("answer", aiResponse);
            response.put("movies", movies);

            System.out.println("✅ SUCCESS! Groq Response (first 150 chars): " +
                    aiResponse.substring(0, Math.min(150, aiResponse.length())) + "...");
            System.out.println("✅ Movies extracted: " + movies.size());
            System.out.println("==========================================");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            // ✅ THE CORRECT FIX - Option 1 (BEST)
            System.out.println("🔥🔥🔥 GROQ ERROR: " + e.getMessage());
            System.out.println("🔥🔥🔥 ERROR TYPE: " + e.getClass().getSimpleName());
            e.printStackTrace();

            String fallbackResponse =
                    "I'm CineCoolAI! I can help you analyze movies and TV shows. " +
                            "Based on your question: \"" + question + "\", " +
                            "I would recommend checking out popular streaming platforms " +
                            "and audience reviews. (Groq API unavailable)";

            conversationHistory.add("AI: " + fallbackResponse);
            if (conversationHistory.size() > 10) conversationHistory.remove(0);

            System.out.println("⚠️ USING FALLBACK RESPONSE");
            System.out.println("==========================================");

            return ResponseEntity.ok(Map.of(
                    "answer", fallbackResponse,
                    "movies", new ArrayList<>()
            ));
        }
    }

    // --------------------------------------------------------------------
    // 🎬 TMDB Search Logic
    // --------------------------------------------------------------------
    private List<Map<String, Object>> extractMoviesFromText(String text) {
        List<Map<String, Object>> resultsList = new ArrayList<>();

        List<String> titles = new ArrayList<>();
        String[] parts = text.split("\"");

        for (int i = 1; i < parts.length; i += 2) {
            titles.add(parts[i]);
        }

        if (titles.isEmpty()) return resultsList;

        List<String> limited = titles.subList(0, Math.min(5, titles.size()));

        for (String title : limited) {
            try {
                String url = String.format(
                        "https://api.themoviedb.org/3/search/multi?api_key=%s&query=%s",
                        tmdbKey, title.replace(" ", "%20")
                );

                String response = restTemplate.getForObject(url, String.class);
                JSONObject json = new JSONObject(response);

                JSONArray arr = json.getJSONArray("results");
                if (arr.length() == 0) continue;

                JSONObject item = arr.getJSONObject(0);

                Map<String, Object> m = new HashMap<>();
                m.put("title", item.optString("title", item.optString("name", "Unknown")));
                m.put("rating", item.optDouble("vote_average", 0));
                m.put("poster", "https://image.tmdb.org/t/p/w500" + item.optString("poster_path", ""));
                m.put("url", "https://www.themoviedb.org/" + item.optString("media_type", "movie") + "/" + item.getInt("id"));

                resultsList.add(m);

            } catch (Exception ignore) {
                // Ignore errors for individual movie searches
                System.out.println("⚠️ Failed to search for movie: " + title);
            }
        }

        return resultsList;
    }

    // --------------------------------------------------------------------
    // 🆕 Session Management Endpoints
    // --------------------------------------------------------------------
    @PostMapping("/session/new")
    public ResponseEntity<Map<String, String>> createNewSession() {
        String newSessionId = "session_" + System.currentTimeMillis();
        conversationSessions.put(newSessionId, new ArrayList<>());
        return ResponseEntity.ok(Map.of("sessionId", newSessionId));
    }

    @DeleteMapping("/session/{sessionId}")
    public ResponseEntity<Map<String, String>> clearSession(@PathVariable String sessionId) {
        conversationSessions.remove(sessionId);
        return ResponseEntity.ok(Map.of("status", "Session cleared"));
    }

    // --------------------------------------------------------------------
    // ❤️ Health check
    // --------------------------------------------------------------------
    @GetMapping("/health")
    public Map<String, String> health() {
        boolean groqLoaded = groqApiKey != null && !groqApiKey.isBlank();
        boolean tmdbLoaded = tmdbKey != null && !tmdbKey.isBlank();

        System.out.println("🔍 HEALTH CHECK:");
        System.out.println("   - Groq API Key Loaded: " + groqLoaded);
        System.out.println("   - TMDB API Key Loaded: " + tmdbLoaded);
        System.out.println("   - Active Sessions: " + conversationSessions.size());

        return Map.of(
                "status", "OK",
                "groqConfigured", groqLoaded ? "YES" : "NO",
                "tmdbConfigured", tmdbLoaded ? "YES" : "NO",
                "activeSessions", String.valueOf(conversationSessions.size())
        );
    }
}