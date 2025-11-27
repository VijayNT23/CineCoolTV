// src/components/Banner.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const IMG_BASE = "https://image.tmdb.org/t/p/original/";

const Banner = ({ fetchUrl, type }) => {
    const [movies, setMovies] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);
    const navigate = useNavigate();
    const { theme } = useTheme();

    // Fetch banner movies
    useEffect(() => {
        let mounted = true;

        async function fetchData() {
            try {
                setLoading(true);
                const request = await axios.get(fetchUrl, {
                    timeout: 5000, // Faster timeout for banner
                });
                if (!mounted) return;

                setMovies(request.data.results || []);
            } catch (error) {
                console.error("Error loading banner:", error);
                if (mounted) setMovies([]);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchData();
        return () => { mounted = false; };
    }, [fetchUrl]);

    // Auto-slide every 7 seconds
    useEffect(() => {
        if (movies.length === 0 || loading) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % movies.length);
            setImageLoaded(false); // Reset image loaded state on slide change
        }, 7000);

        return () => clearInterval(interval);
    }, [movies, loading]);

    // Handle image load
    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    if (loading) {
        return (
            <div className="relative h-[60vh] sm:h-[80vh] bg-cover bg-center flex flex-col justify-end text-white transition-all duration-1000 ease-in-out">
                {/* Banner Shimmer */}
                <div className="absolute inset-0 shimmer-cinematic-banner"></div>

                {/* Content Shimmer */}
                <div className="relative z-10 px-4 sm:px-10 pb-12 sm:pb-20 max-w-2xl">
                    <div className="backdrop-blur-sm bg-black/30 rounded-xl p-4 sm:p-6 shadow-lg">
                        {/* Title Shimmer */}
                        <div className="h-8 sm:h-12 bg-gray-700/50 rounded-lg shimmer-inline mb-3 sm:mb-4"></div>

                        {/* Description Shimmer */}
                        <div className="space-y-2 mb-4 sm:mb-6">
                            <div className="h-3 sm:h-4 bg-gray-600/50 rounded shimmer-inline"></div>
                            <div className="h-3 sm:h-4 bg-gray-600/50 rounded shimmer-inline w-3/4"></div>
                            <div className="h-3 sm:h-4 bg-gray-600/50 rounded shimmer-inline w-1/2"></div>
                        </div>

                        {/* Buttons Shimmer */}
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="h-8 sm:h-10 bg-gray-500/50 rounded-lg shimmer-inline w-24 sm:w-32"></div>
                            <div className="h-6 sm:h-8 bg-gray-600/50 rounded shimmer-inline w-16 sm:w-20"></div>
                        </div>
                    </div>
                </div>

                {/* Slide indicators shimmer */}
                <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-10 flex gap-1 sm:gap-2">
                    {[1, 2, 3, 4].map((_, i) => (
                        <div
                            key={i}
                            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-600/50 shimmer-inline"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (movies.length === 0) return null;

    const movie = movies[currentIndex];

    return (
        <header
            className="relative h-[60vh] sm:h-[80vh] bg-cover bg-center flex flex-col justify-end text-white transition-all duration-1000 ease-in-out"
            style={{
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.3)), url(${IMG_BASE}${movie?.backdrop_path})`,
            }}
        >
            {/* Loading overlay */}
            {!imageLoaded && (
                <div className="absolute inset-0 shimmer-cinematic-banner z-0"></div>
            )}

            {/* Hidden image for preload */}
            <img
                src={`${IMG_BASE}${movie?.backdrop_path}`}
                alt=""
                className="hidden"
                onLoad={handleImageLoad}
            />

            {/* Content */}
            <div className={`relative z-10 px-4 sm:px-10 pb-12 sm:pb-20 max-w-2xl backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg transition-opacity duration-500 ${
                imageLoaded ? 'bg-black/30 opacity-100' : 'bg-transparent opacity-0'
            }`}>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-2 sm:mb-3 drop-shadow-lg line-clamp-2">
                    {movie.title || movie.name || movie.original_name}
                </h1>
                <p className={`mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 transition-opacity duration-500 text-sm sm:text-base ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                } ${theme === "dark" ? "text-gray-300" : "text-gray-100"}`}>
                    {movie.overview}
                </p>

                <div className="flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => navigate(`/details/${type}/${movie.id}`)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-lg font-semibold transition-all duration-300 shadow-lg transform hover:scale-105"
                    >
                        Show Info
                    </button>
                    {movie.vote_average && (
                        <span className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-opacity duration-500 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                        } ${theme === "dark" ? "bg-gray-800/70" : "bg-black/50"}`}>
                            ⭐ {movie.vote_average.toFixed(1)}
                        </span>
                    )}
                </div>
            </div>

            {/* Slide indicators */}
            <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-10 flex gap-1 sm:gap-2">
                {movies.slice(0, 4).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setCurrentIndex(i);
                            setImageLoaded(false);
                        }}
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                            i === currentIndex
                                ? "bg-red-600 scale-125"
                                : theme === "dark"
                                    ? "bg-gray-400 hover:bg-gray-300"
                                    : "bg-gray-300 hover:bg-gray-400"
                        }`}
                    />
                ))}
            </div>
        </header>
    );
};

export default Banner;