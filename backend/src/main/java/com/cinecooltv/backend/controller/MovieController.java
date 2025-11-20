package com.cinecooltv.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.json.*;
import java.util.*;

@RestController
@RequestMapping("/api/movies")
@CrossOrigin(origins = "${ALLOWED_ORIGINS:http://localhost:3000}")
public class MovieController {

    @Value("${TMDB_API_KEY}")
    private String tmdbApiKey;

    @GetMapping("/search")
    public List<Map<String, Object>> searchMovies(@RequestParam String query) {
        List<Map<String, Object>> results = new ArrayList<>();

        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            String encodedQuery = java.net.URLEncoder.encode(query.trim(), "UTF-8");
            String url = "https://api.themoviedb.org/3/search/multi?api_key=" + tmdbApiKey + "&query=" + encodedQuery;

            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.getForObject(url, String.class);

            JSONObject json = new JSONObject(response);
            JSONArray arr = json.getJSONArray("results");

            for (int i = 0; i < Math.min(10, arr.length()); i++) {
                JSONObject obj = arr.getJSONObject(i);

                String title = obj.has("title") ? obj.getString("title")
                        : obj.has("name") ? obj.getString("name") : null;
                if (title == null || title.isEmpty()) continue;

                Map<String, Object> movie = new HashMap<>();
                movie.put("title", title);
                movie.put("year", obj.has("release_date") ? obj.getString("release_date") : "Unknown");
                movie.put("poster", obj.has("poster_path")
                        ? "https://image.tmdb.org/t/p/w500" + obj.getString("poster_path")
                        : "https://via.placeholder.com/150");
                movie.put("type", obj.optString("media_type", "movie"));
                results.add(movie);
            }

        } catch (Exception e) {
            System.err.println("Error searching movies: " + e.getMessage());
        }

        return results;
    }
}