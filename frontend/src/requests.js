const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

if (!API_KEY) {
    console.error("❌ TMDB API key missing! Check your .env file.");
}

// 🎬 Movie, Series & Anime endpoints
const requests = {
    // 🎥 MOVIES
    trendingMovies: `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`,
    topRatedMovies: `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`,
    popularMovies: `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`,
    upcomingMovies: `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}`,
    nowPlayingMovies: `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}`,
    actionMovies: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=28`,
    comedyMovies: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=35`,
    romanceMovies: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=10749`,
    horrorMovies: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=27`,
    sciFiMovies: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=878`,
    documentaries: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=99`,

    // 📺 SERIES
    trendingSeries: `https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}`,
    topRatedSeries: `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}`,
    popularSeries: `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`,
    airingTodaySeries: `https://api.themoviedb.org/3/tv/airing_today?api_key=${API_KEY}`,
    onTheAirSeries: `https://api.themoviedb.org/3/tv/on_the_air?api_key=${API_KEY}`,
    dramaSeries: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=18`,
    comedySeries: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=35`,
    actionAdventureSeries: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=10759`,
    crimeSeries: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=80`,
    realitySeries: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=10764`,

    // 🍜 ANIME (Using TMDB’s “tv” + Japanese language filter)
    animeTrending: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&sort_by=popularity.desc`,
    animeTopRated: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=200`,
    animeAction: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&with_genres=16,10759`,
    animeRomance: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&with_genres=16,10749`,
    animeFantasy: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&with_genres=16,14`,
    animeComedy: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&with_genres=16,35`,
    animeMystery: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_original_language=ja&with_genres=16,9648`,
};

export default requests;
