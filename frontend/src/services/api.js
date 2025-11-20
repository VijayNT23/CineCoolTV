// frontend/src/services/api.js
import config from '../config';
import axios from 'axios';

const API_BASE_URL = config.backendUrl;

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Movie API calls
export const searchMovies = async (query) => {
    try {
        const response = await api.get('/api/movies/search', {
            params: { query }
        });
        return response.data;
    } catch (error) {
        console.error('Error searching movies:', error);
        throw error;
    }
};

// AI API calls
export const askAI = async (question) => {
    try {
        const response = await api.post('/api/ai/ask', { question });
        return response.data;
    } catch (error) {
        console.error('Error asking AI:', error);
        throw error;
    }
};

// TMDB API calls (for movies, series, anime from your requests.js)
export const getTrendingMovies = async () => {
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/trending/movie/week?api_key=${config.tmdbApiKey}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching trending movies:', error);
        throw error;
    }
};

export const getTrendingSeries = async () => {
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/trending/tv/week?api_key=${config.tmdbApiKey}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching trending series:', error);
        throw error;
    }
};

// Add more TMDB API calls as needed
export const getMovieDetails = async (movieId) => {
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${config.tmdbApiKey}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        throw error;
    }
};

export default api;