// src/requests.js
import config from './config';

const API_KEY = config.tmdbApiKey;
const BASE = '&language=en-US';

if (!API_KEY) {
    console.error("❌ TMDB API key missing! Check your .env file.");
}

// 🎬 Movie, Series & Anime endpoints
const requests = {
    // 🎥 MOVIES
    trendingMovies: `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}${BASE}`,
    topRatedMovies: `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}${BASE}`,
    popularMovies: `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}${BASE}`,
    upcomingMovies: `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}${BASE}`,
    nowPlayingMovies: `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}${BASE}`,
    actionMovies: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=28${BASE}`,
    comedyMovies: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=35${BASE}`,
    romanceMovies: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=10749${BASE}`,
    horrorMovies: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=27${BASE}`,
    sciFiMovies: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=878${BASE}`,
    documentaries: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=99${BASE}`,

    // 📺 SERIES
    trendingSeries: `https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}${BASE}`,
    topRatedSeries: `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}${BASE}`,
    popularSeries: `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}${BASE}`,
    airingTodaySeries: `https://api.themoviedb.org/3/tv/airing_today?api_key=${API_KEY}${BASE}`,
    onTheAirSeries: `https://api.themoviedb.org/3/tv/on_the_air?api_key=${API_KEY}${BASE}`,
    dramaSeries: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=18${BASE}`,
    comedySeries: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=35${BASE}`,
    actionAdventureSeries: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=10759${BASE}`,
    crimeSeries: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=80${BASE}`,
    realitySeries: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=10764${BASE}`,

    // 🍜 ANIME (Japanese shows)
    animeTrending: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&sort_by=popularity.desc${BASE}`,
    animeTopRated: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=200${BASE}`,
    animeAction: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&with_genres=16,10759${BASE}`,
    animeRomance: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&with_genres=16,10749${BASE}`,
    animeFantasy: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&with_genres=16,14${BASE}`,
    animeComedy: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&with_genres=16,35${BASE}`,
    animeMystery: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&with_genres=16,9648${BASE}`,
};

export default requests;