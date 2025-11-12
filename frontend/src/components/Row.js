// src/components/Row.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    toggleFavorite,
    toggleLibraryItem,
    isInLibrary,
    isFavorite,
} from "../utils/libraryUtils";
import ShimmerCard from "./ShimmerCard";
import { useTheme } from "../context/ThemeContext";

const BASE_IMG = "https://image.tmdb.org/t/p/original";

const Row = ({ title, fetchUrl, isLargeRow = false, type: incomingType }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const navigate = useNavigate();
    const { theme } = useTheme();

    useEffect(() => {
        let mounted = true;
        let retryCount = 0;
        const maxRetries = 2;

        async function fetchData() {
            try {
                setLoading(true);
                setError(false);
                const res = await axios.get(fetchUrl, {
                    timeout: 8000, // Faster timeout
                });
                if (!mounted) return;

                if (res.data.results && Array.isArray(res.data.results)) {
                    setItems(res.data.results);
                } else {
                    setItems([]);
                }
            } catch (err) {
                console.error("Row fetch error", err);
                if (mounted) {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        setTimeout(fetchData, 1000 * retryCount); // Exponential backoff
                    } else {
                        setError(true);
                        setItems([]);
                    }
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchData();
        return () => (mounted = false);
    }, [fetchUrl]);

    const normalizeRowType = (movie) => {
        if (incomingType) {
            if (incomingType === "series") return "tv";
            return incomingType; // Keep "anime" as "anime", "movie" as "movie"
        }
        if (movie.media_type) return movie.media_type;
        if (movie.first_air_date) return "tv";
        return "movie";
    };

    const handleOpen = (movie) => {
        const mediaType = normalizeRowType(movie);
        navigate(`/details/${mediaType}/${movie.id}`);
    };

    const handleAdd = (movie, e) => {
        e.stopPropagation();
        const mediaType = normalizeRowType(movie);
        toggleLibraryItem({
            id: movie.id,
            title: movie.title || movie.name || movie.original_name,
            image: movie.poster_path
                ? `${BASE_IMG}${movie.poster_path}`
                : movie.backdrop_path
                    ? `${BASE_IMG}${movie.backdrop_path}`
                    : "",
            type: mediaType,
            status: "Watchlist",
            rating: movie.vote_average ?? null,
        });
        setItems([...items]);
    };

    const handleFav = (movie, e) => {
        e.stopPropagation();
        const mediaType = normalizeRowType(movie);
        toggleFavorite(movie.id, mediaType, {
            title: movie.title || movie.name || movie.original_name,
            image: movie.poster_path
                ? `${BASE_IMG}${movie.poster_path}`
                : movie.backdrop_path
                    ? `${BASE_IMG}${movie.backdrop_path}`
                    : "",
            status: "Watchlist",
        });
        setItems([...items]);
    };

    // Fast loading shimmer count based on screen size
    const getShimmerCount = () => {
        if (typeof window !== 'undefined') {
            const width = window.innerWidth;
            if (width < 640) return 4;  // mobile
            if (width < 1024) return 6; // tablet
            return 8; // desktop
        }
        return 8;
    };

    return (
        <div className={`px-6 py-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            <h2 className="text-2xl font-bold mb-4 tracking-wide">{title}</h2>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
                {loading ? (
                    // Fast loading shimmers
                    Array.from({ length: getShimmerCount() }).map((_, i) => (
                        <ShimmerCard key={i} isLargeRow={isLargeRow} />
                    ))
                ) : error ? (
                    // Error state
                    <div className={`flex items-center justify-center w-full py-12 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                        <p className="text-lg font-semibold">Failed to load content</p>
                    </div>
                ) : Array.isArray(items) && items.length > 0 ? (
                    // Actual content
                    items.map((m) => {
                        const posterUrl = m.poster_path
                            ? `${BASE_IMG}${m.poster_path}`
                            : m.backdrop_path
                                ? `${BASE_IMG}${m.backdrop_path}`
                                : "https://via.placeholder.com/300x450?text=No+Image";
                        const cardWidth = isLargeRow
                            ? "min-w-[220px] max-w-[220px] h-[330px]"
                            : "min-w-[180px] max-w-[180px] h-[270px]";
                        const mediaType = normalizeRowType(m);
                        const inLib = isInLibrary(m.id, mediaType);
                        const fav = isFavorite(m.id, mediaType);

                        return (
                            <div
                                key={m.id}
                                onClick={() => handleOpen(m)}
                                className={`relative group flex-shrink-0 ${cardWidth} rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 cursor-pointer ${
                                    theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                                }`}
                            >
                                <img
                                    src={posterUrl}
                                    alt={m.title || m.name}
                                    loading="lazy" // Lazy loading for performance
                                    onError={(e) => {
                                        e.target.src = "https://via.placeholder.com/300x450?text=No+Image";
                                    }}
                                    className="w-full h-full object-cover transition-opacity duration-300"
                                />

                                {/* Overlay */}
                                <div className={`absolute inset-0 transition-colors duration-300 rounded-xl pointer-events-none ${
                                    theme === "dark"
                                        ? "bg-black/0 group-hover:bg-black/40"
                                        : "bg-white/0 group-hover:bg-white/40"
                                }`} />

                                {/* Fav button */}
                                <button
                                    onClick={(e) => handleFav(m, e)}
                                    className={`absolute top-3 right-3 z-20 rounded-full p-2 pointer-events-auto transition-all duration-200 ${
                                        theme === "dark" ? "bg-black/60" : "bg-white/60"
                                    } ${fav ? "scale-110" : ""}`}
                                    title={fav ? "Unfavorite" : "Add to favorites"}
                                >
                                    <span
                                        className={`text-lg ${
                                            fav ? "text-pink-500" : theme === "dark" ? "text-white/90" : "text-gray-700"
                                        }`}
                                    >
                                        {fav ? "❤️" : "🤍"}
                                    </span>
                                </button>

                                {/* Add to Library button */}
                                <div className="absolute left-0 right-0 bottom-3 flex justify-center pointer-events-none">
                                    <button
                                        onClick={(e) => handleAdd(m, e)}
                                        className={`pointer-events-auto px-3 py-1 rounded-md text-sm font-medium shadow-md transition-all duration-200 ${
                                            inLib
                                                ? "bg-green-600 text-white scale-105"
                                                : theme === "dark"
                                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                        } opacity-90`}
                                    >
                                        {inLib ? "✓ Added" : "➕ Add"}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    // Empty state
                    <div className={`px-4 py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        No items found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Row;