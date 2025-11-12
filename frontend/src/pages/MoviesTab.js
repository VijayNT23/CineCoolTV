// src/pages/MoviesTab.js (Updated with proper theme classes)
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
                <div className="relative h-[80vh] bg-cover bg-center flex flex-col justify-end">
                    <div className="absolute inset-0 shimmer-cinematic-banner"></div>
                </div>

                {/* Rows Shimmer */}
                <div className="space-y-8 py-8">
                    {[1, 2, 3, 4].map((row) => (
                        <div key={row} className="px-6">
                            <div className={`h-8 rounded shimmer-inline w-64 mb-4 ${
                                isDark ? 'bg-gray-700/50' : 'bg-gray-300/50'
                            }`}></div>
                            <div className="flex gap-4 overflow-x-auto">
                                {[1, 2, 3, 4, 5, 6].map((card) => (
                                    <div key={card} className={`min-w-[180px] h-[270px] rounded-xl ${
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