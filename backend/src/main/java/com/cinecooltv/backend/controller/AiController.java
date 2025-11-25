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

    @Value("${gemini.api.key}")
    private String geminiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private static final String MODEL = "gemini-2.0-flash";

    // ------------------------------
    // 🧠 Conversation Memory (Last 10 Messages) - Per Session
    // ------------------------------
    private final Map<String, List<String>> conversationSessions = new HashMap<>();
    private String currentSessionId = "default";

    @PostMapping("/ask")
    public ResponseEntity<Map<String, Object>> askAI(@RequestBody Map<String, Object> request) {

        String question = (String) request.get("question");
        Integer variation = (Integer) request.get("variation");
        String sessionId = (String) request.get("sessionId");

        if (sessionId == null) {
            sessionId = "default";
        }
        currentSessionId = sessionId;

        // Initialize session if not exists
        conversationSessions.putIfAbsent(sessionId, new ArrayList<>());
        List<String> conversationHistory = conversationSessions.get(sessionId);

        if (question == null || question.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "answer", "Please enter a valid movie/series question.",
                    "movies", new ArrayList<>()
            ));
        }

        if (geminiKey == null || geminiKey.isBlank()) {
            return ResponseEntity.status(500).body(Map.of(
                    "answer", "❌ Gemini API key missing on backend.",
                    "movies", new ArrayList<>()
            ));
        }

        // Handle regeneration - don't add to history if it's a regeneration
        boolean isRegeneration = variation != null && variation > 0;

        if (!isRegeneration) {
            // Add question to memory only for new questions, not regenerations
            conversationHistory.add("User: " + question);
            if (conversationHistory.size() > 10) {
                conversationHistory.remove(0);
            }
        }

        try {
            String aiResponse = callGemini(question, conversationHistory, isRegeneration, variation);

            if (!isRegeneration) {
                // Store AI response in memory only for new questions
                conversationHistory.add("AI: " + aiResponse);
                if (conversationHistory.size() > 10) {
                    conversationHistory.remove(0);
                }
            }

            List<Map<String, Object>> movies = extractMoviesFromText(aiResponse);

            Map<String, Object> response = new HashMap<>();
            response.put("answer", aiResponse);
            response.put("movies", movies);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "answer", "⚠️ Gemini API error: " + e.getMessage(),
                    "movies", new ArrayList<>()
            ));
        }
    }

    // --------------------------------------------------------------------
    // 🔥 SMART UNIVERSAL PROMPT + MEMORY INCLUDED + REGENERATION SUPPORT
    // --------------------------------------------------------------------
    private String callGemini(String question, List<String> conversationHistory, boolean isRegeneration, Integer variation) {

        String systemPrompt = """
You are CineCoolAI — an intelligent movie & series analyst.

Your abilities:
• Understand ANY question type (comparison, why, how, what, rankings, reviews, summaries).
• Automatically adapt response structure based on question type.
• Use conversation memory to continue context — NEVER ask the user to repeat.
• Provide deep reasoning, cinematic insights, and clear explanations.
• Keep responses clean, compact, and mobile-friendly.
• Use small emojis only — avoid BIG headers or oversized text.

IMPORTANT REGENERATION BEHAVIOR:
• When user requests regeneration, provide a DIFFERENT perspective or analysis
• Use different examples, different structure, or different emphasis
• Never say "I already answered this" or "as I mentioned before"
• Treat each regeneration as a fresh opportunity to explore the topic

General Style:
• Short paragraphs, clean bullet points.
• No overuse of bold; clarity is priority.
• Use emojis like 🎬 ⭐ 🔍 🥇 🎭 📺 💡
• For comparisons → provide detailed head-to-head breakdowns.
• For follow-up questions → continue naturally using stored memory.

-------------------------
⭐ UNIVERSAL FORMAT RULE
-------------------------

You must decide the structure based on the question:
1. If comparison → Overview, Key Differences, Similarities, Strengths, Verdict.
2. If "why" → cause → effect explanation.
3. If "how" → step-by-step logic.
4. If "what" → definition + context + examples.
5. If recommendations → genre insights + reasoning.
6. If story/theme → summary + analysis.
7. If ranking → clear list + short value notes.

""";

        // Build conversation memory block (exclude for regenerations to avoid repetition detection)
        StringBuilder memoryBlock = new StringBuilder();
        if (!isRegeneration && !conversationHistory.isEmpty()) {
            memoryBlock.append("\nConversation history:\n");
            for (String entry : conversationHistory) {
                memoryBlock.append(entry).append("\n");
            }
        }

        // Add regeneration instruction if this is a regeneration
        String regenerationInstruction = "";
        if (isRegeneration) {
            regenerationInstruction = """
                    
IMPORTANT: This is a regeneration request. Provide a FRESH perspective:
• Use different examples or analogies
• Try a different analytical approach
• Focus on different aspects of the topic
• Structure your response differently
• Do NOT reference previous answers
                    """;
        }

        // Add variation for different responses
        String variationInstruction = "";
        if (variation != null) {
            switch (variation % 3) {
                case 1:
                    variationInstruction = "\nFocus more on character development and emotional arcs.";
                    break;
                case 2:
                    variationInstruction = "\nEmphasize cinematic techniques and directorial choices.";
                    break;
                default:
                    variationInstruction = "\nAnalyze from a thematic and cultural perspective.";
            }
        }

        JSONObject body = new JSONObject()
                .put("contents", new JSONArray()
                        .put(
                                new JSONObject()
                                        .put("role", "user")
                                        .put("parts", new JSONArray()
                                                .put(new JSONObject()
                                                        .put("text",
                                                                systemPrompt
                                                                        + memoryBlock
                                                                        + regenerationInstruction
                                                                        + variationInstruction
                                                                        + "\n\nUSER QUESTION:\n"
                                                                        + question
                                                        )
                                                )
                                        )
                        )
                );

        String url = String.format(GEMINI_API_URL, MODEL, geminiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

        ResponseEntity<String> response =
                restTemplate.postForEntity(url, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Gemini API error: " + response.getBody());
        }

        JSONObject json = new JSONObject(response.getBody());

        return json
                .getJSONArray("candidates")
                .getJSONObject(0)
                .getJSONObject("content")
                .getJSONArray("parts")
                .getJSONObject(0)
                .getString("text");
    }

    // --------------------------------------------------------------------
    // 🎬 TMDB Search Logic (unchanged)
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

            } catch (Exception ignore) {}
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
        return Map.of(
                "status", "OK",
                "geminiConfigured", geminiKey != null ? "YES" : "NO",
                "tmdbConfigured", tmdbKey != null ? "YES" : "NO",
                "activeSessions", String.valueOf(conversationSessions.size())
        );
    }
}