// src/pages/MoviesTab.js
import React, { useState, useEffect } from "react";
import Banner from "../components/Banner";
import Row from "../components/Row";
import requests from "../requests";
import { useTheme } from "../context/ThemeContext";

const MoviesTab = () => {
    const [loading, setLoading] = useState(true);
    const { isDark } = useTheme();

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                {/* Banner Shimmer */}
                <div className="relative h-[60vh] sm:h-[80vh] bg-cover bg-center flex flex-col justify-end">
                    <div className="absolute inset-0 shimmer-cinematic-banner"></div>
                </div>

                {/* Rows Shimmer */}
                <div className="space-y-6 sm:space-y-8 py-6 sm:py-8">
                    {[1, 2, 3, 4].map((row) => (
                        <div key={row} className="px-4 sm:px-6">
                            <div className={`h-6 sm:h-8 rounded shimmer-inline w-48 sm:w-64 mb-3 sm:mb-4 ${
                                isDark ? 'bg-gray-700/50' : 'bg-gray-300/50'
                            }`}></div>
                            <div className="flex gap-3 sm:gap-4 overflow-x-auto">
                                {[1, 2, 3, 4, 5, 6].map((card) => (
                                    <div key={card} className={`min-w-[120px] sm:min-w-[150px] md:min-w-[180px] h-[170px] sm:h-[225px] md:h-[270px] rounded-lg sm:rounded-xl ${
                                        isDark ? 'bg-gray-800' : 'bg-gray-200'
                                    } shimmer-cinematic`}></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <Banner fetchUrl={requests.trendingMovies} type="movie" />

            <Row title="🔥 Trending Movies" fetchUrl={requests.trendingMovies} type="movie" isLargeRow />
            <Row title="⭐ Top Rated" fetchUrl={requests.topRatedMovies} type="movie" />
            <Row title="🎬 Popular Movies" fetchUrl={requests.popularMovies} type="movie" />
            <Row title="🆕 Upcoming" fetchUrl={requests.upcomingMovies} type="movie" />
            <Row title="🎞️ Now Playing" fetchUrl={requests.nowPlayingMovies} type="movie" />
            <Row title="💥 Action" fetchUrl={requests.actionMovies} type="movie" />
            <Row title="😂 Comedy" fetchUrl={requests.comedyMovies} type="movie" />
            <Row title="💘 Romance" fetchUrl={requests.romanceMovies} type="movie" />
            <Row title="👻 Horror" fetchUrl={requests.horrorMovies} type="movie" />
            <Row title="🧠 Sci-Fi" fetchUrl={requests.sciFiMovies} type="movie" />
        </div>
    );
};

export default MoviesTab;