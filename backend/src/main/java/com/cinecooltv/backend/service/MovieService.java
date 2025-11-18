package com.cinecooltv.backend.service;

import com.cinecooltv.backend.model.Movie;
import com.cinecooltv.backend.repository.MovieRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MovieService {
    private final MovieRepository movieRepository;

    public MovieService(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    public Movie addMovie(Movie movie) {
        return movieRepository.save(movie);
    }

    public void deleteMovie(Long id) {
        movieRepository.deleteById(id);
    }

    // ⭐ NEW METHOD — toggles the "favorite" field
    public Movie toggleFavorite(Long id) {
        return movieRepository.findById(id)
                .map(movie -> {
                    movie.setFavorite(!movie.isFavorite());
                    return movieRepository.save(movie);
                })
                .orElseThrow(() -> new RuntimeException("Movie not found with id " + id));
    }
}
