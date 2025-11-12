package com.moviestracker.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.json.*;

import java.util.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Value("${OPENAI_API_KEY:}")
    private String openAiKey;

    @Value("${GEMINI_API_KEY:}")
    private String geminiKey;

    @Value("${TMDB_API_KEY:}")
    private String tmdbKey;

    @Value("${AI_PROVIDER:gemini}")
    private String aiProvider;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/ask")
    public ResponseEntity<Map<String, Object>> askAI(@RequestBody Map<String, String> request) {
        String question = request.get("question");

        if (question == null || question.trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("answer", "Please provide a valid question about cinema, movies, series, or characters.");
            error.put("movies", new ArrayList<>());
            return ResponseEntity.badRequest().body(error);
        }

        Map<String, Object> result = new HashMap<>();
        try {
            // Determine which AI provider to use
            boolean useGemini = (aiProvider.equalsIgnoreCase("gemini") && 
                               geminiKey != null && !geminiKey.isEmpty() && 
                               !geminiKey.equals("your-gemini-key-here"));
            boolean useOpenAI = (aiProvider.equalsIgnoreCase("openai") && 
                               openAiKey != null && !openAiKey.isEmpty() && 
                               !openAiKey.equals("your-openai-key-here"));
            
            // Fallback: try Gemini first, then OpenAI
            if (!useGemini && !useOpenAI) {
                if (geminiKey != null && !geminiKey.isEmpty() && !geminiKey.equals("your-gemini-key-here")) {
                    useGemini = true;
                } else if (openAiKey != null && !openAiKey.isEmpty() && !openAiKey.equals("your-openai-key-here")) {
                    useOpenAI = true;
                } else {
                    throw new RuntimeException("No AI API key configured. Please set either GEMINI_API_KEY or OPENAI_API_KEY environment variable or in application.properties");
                }
            }

            if (tmdbKey == null || tmdbKey.isEmpty() || tmdbKey.equals("your-tmdb-key-here")) {
                System.out.println("Warning: TMDB API key not configured. Movie recommendations may not work.");
            }

            String aiResponse;
            if (useGemini) {
                aiResponse = callGemini(question);
            } else {
                aiResponse = callGPT(question);
            }
            
            List<Map<String, Object>> movies = extractMoviesFromText(aiResponse);
            String formatted = formatResponse(aiResponse, movies);
            result.put("answer", formatted);
            result.put("movies", movies);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            String errorMsg = "⚠️ Error: " + e.getMessage();
            errorMsg += "\n\nDebug Info:";
            errorMsg += "\n• Gemini Key: " + (geminiKey != null && !geminiKey.isEmpty() && !geminiKey.equals("your-gemini-key-here") ? "✓ Set" : "✗ Not set");
            errorMsg += "\n• OpenAI Key: " + (openAiKey != null && !openAiKey.isEmpty() && !openAiKey.equals("your-openai-key-here") ? "✓ Set" : "✗ Not set");
            errorMsg += "\n• AI Provider: " + aiProvider;
            errorMsg += "\n\nPlease check your API keys in application.properties or environment variables.";
            result.put("answer", errorMsg);
            result.put("movies", new ArrayList<>());
            return ResponseEntity.status(500).body(result);
        }
    }

    private String callGemini(String question) {
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=%s", geminiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Enhanced cinema-focused system prompt with formatting instructions
        String systemPrompt = "You are CineCoolAI, an expert cinema assistant specialized in:\n" +
                "- Movie and series analysis\n" +
                "- Character breakdowns and psychological analysis\n" +
                "- Story summaries and plot explanations\n" +
                "- Cinematic techniques and filmmaking insights\n" +
                "- Genre analysis and recommendations\n\n" +
                "Always provide detailed, insightful responses focused on cinema. For character questions, analyze:\n" +
                "- Character motivations and arcs\n" +
                "- Relationships and dynamics\n" +
                "- Symbolism and themes\n" +
                "- Performance and direction\n\n" +
                "For story questions, discuss:\n" +
                "- Plot structure and pacing\n" +
                "- Themes and messages\n" +
                "- Narrative techniques\n" +
                "- Cultural and historical context\n\n" +
                "FORMATTING RULES (CRITICAL - Follow exactly):\n" +
                "1. Use emojis at the start of sections (💥, 🧠, 🕵️‍♂️, etc.)\n" +
                "2. For numbered lists: \"💥 **1. *Title***\" format (emoji + **number. *title***)\n" +
                "3. For subtitles: \"🧠 *Description*\" format (emoji + *italic text*)\n" +
                "4. Use **bold** for important titles and *italic* for descriptions\n" +
                "5. Use \"---\" as separators between major sections\n" +
                "6. Use 🔸 for bonus items\n" +
                "7. Make responses engaging, stylish, and cinematic\n" +
                "8. Keep paragraphs short and punchy\n\n" +
                "Example format:\n" +
                "💥 **1. *Lie to Me***\n" +
                "🧠 *When reading faces becomes a weapon.*\n" +
                "Description text here...\n" +
                "---\n" +
                "Be concise but thorough, and always relate your answers to cinematic elements.";

        String fullPrompt = systemPrompt + "\n\nUser Question: " + question;

        JSONObject body = new JSONObject();
        JSONArray contents = new JSONArray();
        JSONObject content = new JSONObject();
        JSONArray parts = new JSONArray();
        JSONObject part = new JSONObject();
        part.put("text", fullPrompt);
        parts.put(part);
        content.put("parts", parts);
        contents.put(content);
        body.put("contents", contents);

        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Gemini API request failed with status: " + response.getStatusCode());
        }

        JSONObject json = new JSONObject(response.getBody());
        
        if (!json.has("candidates") || json.getJSONArray("candidates").length() == 0) {
            throw new RuntimeException("Gemini API returned no candidates. Response: " + json.toString());
        }
        
        return json.getJSONArray("candidates")
                .getJSONObject(0)
                .getJSONObject("content")
                .getJSONArray("parts")
                .getJSONObject(0)
                .getString("text");
    }

    private String callGPT(String question) {
        String url = "https://api.openai.com/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openAiKey);

        JSONObject body = new JSONObject();
        body.put("model", "gpt-4o-mini");
        
        // Enhanced cinema-focused system prompt with formatting instructions
        String systemPrompt = "You are CineCoolAI, an expert cinema assistant specialized in:\n" +
                "- Movie and series analysis\n" +
                "- Character breakdowns and psychological analysis\n" +
                "- Story summaries and plot explanations\n" +
                "- Cinematic techniques and filmmaking insights\n" +
                "- Genre analysis and recommendations\n\n" +
                "Always provide detailed, insightful responses focused on cinema. For character questions, analyze:\n" +
                "- Character motivations and arcs\n" +
                "- Relationships and dynamics\n" +
                "- Symbolism and themes\n" +
                "- Performance and direction\n\n" +
                "For story questions, discuss:\n" +
                "- Plot structure and pacing\n" +
                "- Themes and messages\n" +
                "- Narrative techniques\n" +
                "- Cultural and historical context\n\n" +
                "FORMATTING RULES (CRITICAL - Follow exactly):\n" +
                "1. Use emojis at the start of sections (💥, 🧠, 🕵️‍♂️, etc.)\n" +
                "2. For numbered lists: \"💥 **1. *Title***\" format (emoji + **number. *title***)\n" +
                "3. For subtitles: \"🧠 *Description*\" format (emoji + *italic text*)\n" +
                "4. Use **bold** for important titles and *italic* for descriptions\n" +
                "5. Use \"---\" as separators between major sections\n" +
                "6. Use 🔸 for bonus items\n" +
                "7. Make responses engaging, stylish, and cinematic\n" +
                "8. Keep paragraphs short and punchy\n\n" +
                "Example format:\n" +
                "💥 **1. *Lie to Me***\n" +
                "🧠 *When reading faces becomes a weapon.*\n" +
                "Description text here...\n" +
                "---\n" +
                "Be concise but thorough, and always relate your answers to cinematic elements.";
        
        body.put("messages", new JSONArray()
                .put(new JSONObject().put("role", "system").put("content", systemPrompt))
                .put(new JSONObject().put("role", "user").put("content", question)));

        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        JSONObject json = new JSONObject(response.getBody());
        return json.getJSONArray("choices").getJSONObject(0).getJSONObject("message").getString("content");
    }

    private List<Map<String, Object>> extractMoviesFromText(String text) {
        List<Map<String, Object>> movies = new ArrayList<>();

        // Find quoted titles
        List<String> candidates = new ArrayList<>();
        String[] quoted = text.split("\"");
        for (int i = 1; i < quoted.length; i += 2) {
            candidates.add(quoted[i]);
        }

        if (candidates.isEmpty()) {
            for (String word : text.split("\\s+")) {
                if (Character.isUpperCase(word.charAt(0)) && word.length() > 3)
                    candidates.add(word);
            }
        }

        for (String title : candidates) {
            try {
                String searchUrl = String.format(
                        "https://api.themoviedb.org/3/search/multi?api_key=%s&query=%s",
                        tmdbKey, title.replace(" ", "%20"));

                String response = restTemplate.getForObject(searchUrl, String.class);
                JSONObject json = new JSONObject(response);
                JSONArray results = json.getJSONArray("results");

                if (results.length() > 0) {
                    JSONObject movie = results.getJSONObject(0);
                    Map<String, Object> m = new HashMap<>();
                    m.put("title", movie.optString("title", movie.optString("name", "Unknown")));
                    m.put("rating", movie.optDouble("vote_average", 0));
                    m.put("poster", "https://image.tmdb.org/t/p/w500" + movie.optString("poster_path", ""));
                    m.put("url", "https://www.themoviedb.org/" + movie.optString("media_type", "movie") + "/" + movie.optInt("id"));
                    movies.add(m);
                }
            } catch (Exception ignored) {}
        }

        return movies;
    }

    private String formatResponse(String text, List<Map<String, Object>> movies) {
        text = text.replaceAll("(?m)^\\s*\\d+\\.\\s*", "• ");
        text = text.replaceAll("(?m)^\\s*-\\s*", "• ");
        StringBuilder sb = new StringBuilder("🎬 Here’s what I found:\n\n").append(text.trim());

        if (!movies.isEmpty()) {
            sb.append("\n\n🎞 Related Titles:\n");
            for (Map<String, Object> m : movies) {
                sb.append("• [").append(m.get("title")).append("](").append(m.get("url")).append(") ")
                        .append("⭐ ").append(m.get("rating")).append("\n");
            }
        }

        return sb.toString();
    }
}

