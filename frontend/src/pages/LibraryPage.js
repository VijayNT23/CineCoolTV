// src/pages/LibraryPage.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
    getLibrary,
    saveLibrary,
} from "../utils/libraryUtils";

const LibraryPage = () => {
    const { currentUser } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [libraryItems, setLibraryItems] = useState([]);
    const [filter, setFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const lastUpdatedRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadLibrary = async () => {
            // Clear library when user logs out
            if (!currentUser) {
                setLibraryItems([]);
                lastUpdatedRef.current = JSON.stringify([]);
                return;
            }

            const lib = await getLibrary();
            setLibraryItems(lib || []);
            lastUpdatedRef.current = JSON.stringify(lib);
        };
        loadLibrary();

        const handleLibUpdate = (e) => {
            const newLib = e.detail ?? [];
            const newSerialized = JSON.stringify(newLib);
            if (newSerialized !== lastUpdatedRef.current) {
                setLibraryItems(newLib);
                lastUpdatedRef.current = newSerialized;
            }
        };

        window.addEventListener("libraryUpdated", handleLibUpdate);
        return () => window.removeEventListener("libraryUpdated", handleLibUpdate);
    }, [currentUser]);

    const statusFilters = [
        "All",
        "Watchlist",
        "Watching",
        "Considering",
        "Dropped",
        "Completed",
        "Rewatching",
        "Favorites",
    ];

    const typeFilters = [
        { value: "All", label: "All", icon: "🎬" },
        { value: "Movies", label: "Movies", icon: "🎥" },
        { value: "Series", label: "Series", icon: "📺" },
        { value: "Anime", label: "Anime", icon: "🎌" },
    ];

    const detectContentType = (item) => {
        // Keep anime as separate type
        if (item.type === "anime") return "anime";
        return item.type;
    };

    const getFilteredItems = () => {
        let items = libraryItems;

        if (typeFilter !== "All") {
            items = items.filter(item => {
                const contentType = detectContentType(item);
                if (typeFilter === "Movies") return contentType === "movie";
                if (typeFilter === "Series") return contentType === "tv" || contentType === "series";
                if (typeFilter === "Anime") return contentType === "anime";
                return true;
            });
        }

        if (filter === "All") return items;
        if (filter === "Favorites") return items.filter((i) => i.favorite);
        return items.filter((i) => i.status === filter);
    };

    const filteredItems = getFilteredItems();

    const getTypeStats = () => {
        const movies = libraryItems.filter(item => detectContentType(item) === "movie");
        const series = libraryItems.filter(item =>
            detectContentType(item) === "tv" || detectContentType(item) === "series"
        );
        const anime = libraryItems.filter(item => detectContentType(item) === "anime");

        return {
            all: libraryItems.length,
            movies: movies.length,
            series: series.length,
            anime: anime.length,
        };
    };

    const typeStats = getTypeStats();

    const handleFavoriteToggle = async (e, item) => {
        e.stopPropagation();
        const updated = libraryItems.map((i) =>
            i.id === item.id && i.type === item.type
                ? { ...i, favorite: !i.favorite }
                : i
        );
        await saveLibrary(updated);
        setLibraryItems(updated);
    };

    const handleFilterClick = (cat) => {
        setFilter((prev) => (prev === cat ? "All" : cat));
    };

    const handleTypeFilterClick = (type) => {
        setTypeFilter((prev) => (prev === type ? "All" : type));
    };

    const getStatusColor = (status, isFavorite) => {
        if (isFavorite) return "bg-pink-600";
        switch (status) {
            case "Completed": return "bg-green-600";
            case "Watching": return "bg-yellow-500";
            case "Rewatching": return "bg-blue-500";
            case "Dropped": return "bg-red-600";
            case "Considering": return "bg-purple-500";
            case "Watchlist": return "bg-gray-700";
            default: return "bg-gray-700";
        }
    };

    const getTypeIcon = (item) => {
        const contentType = detectContentType(item);
        switch (contentType) {
            case "movie": return "🎥";
            case "tv":
            case "series": return "📺";
            case "anime": return "🎌";
            default: return "🎬";
        }
    };

    const getTypeLabel = (item) => {
        const contentType = detectContentType(item);
        switch (contentType) {
            case "movie": return "Movie";
            case "tv":
            case "series": return "Series";
            case "anime": return "Anime";
            default: return "Content";
        }
    };

    return (
        <div className={`pt-20 px-4 pb-8 min-h-screen ${
            isDark
                ? "bg-gradient-to-b from-[#0b0b0b] to-black"
                : "bg-gradient-to-b from-gray-50 to-gray-100"
        }`}>
            <div className="max-w-7xl mx-auto">
                <h2 className={`text-2xl sm:text-3xl font-bold mb-6 text-center ${
                    isDark ? "text-blue-400" : "text-blue-600"
                }`}>
                    🎬 My Library
                </h2>

                {/* Type Filter - Horizontal scroll on mobile */}
                <div className="flex overflow-x-auto pb-4 mb-6 scrollbar-hide gap-3">
                    {typeFilters.map((type) => {
                        const isActive = typeFilter === type.value;
                        const stats = typeStats[type.value.toLowerCase()];
                        return (
                            <button
                                key={type.value}
                                onClick={() => handleTypeFilterClick(type.value)}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : isDark
                                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                            : "bg-white text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                <span className="text-lg">{type.icon}</span>
                                <span>{type.label}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    isActive
                                        ? "bg-blue-500"
                                        : isDark
                                            ? "bg-gray-600"
                                            : "bg-gray-200"
                                }`}>
                                    {stats}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Status Filter - Horizontal scroll on mobile */}
                <div className="flex overflow-x-auto pb-4 mb-6 scrollbar-hide gap-2">
                    {statusFilters.map((cat) => {
                        const isActive = filter === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => handleFilterClick(cat)}
                                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : isDark
                                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                            : "bg-white text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* Stats Overview - 2 columns on mobile */}
                <div className={`rounded-xl p-4 mb-6 shadow-lg ${
                    isDark ? "bg-gray-800" : "bg-white"
                }`}>
                    <h3 className={`text-lg font-semibold mb-3 text-center ${
                        isDark ? "text-white" : "text-gray-900"
                    }`}>📊 Overview</h3>
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className={`p-3 rounded-lg ${
                            isDark ? "bg-blue-900/20" : "bg-blue-50"
                        }`}>
                            <div className={`text-xl font-bold ${
                                isDark ? "text-blue-400" : "text-blue-600"
                            }`}>{typeStats.all}</div>
                            <div className={`text-xs ${
                                isDark ? "text-gray-400" : "text-gray-600"
                            }`}>Total</div>
                        </div>
                        <div className={`p-3 rounded-lg ${
                            isDark ? "bg-green-900/20" : "bg-green-50"
                        }`}>
                            <div className={`text-xl font-bold ${
                                isDark ? "text-green-400" : "text-green-600"
                            }`}>{typeStats.movies}</div>
                            <div className={`text-xs ${
                                isDark ? "text-gray-400" : "text-gray-600"
                            }`}>Movies</div>
                        </div>
                        <div className={`p-3 rounded-lg ${
                            isDark ? "bg-purple-900/20" : "bg-purple-50"
                        }`}>
                            <div className={`text-xl font-bold ${
                                isDark ? "text-purple-400" : "text-purple-600"
                            }`}>{typeStats.series}</div>
                            <div className={`text-xs ${
                                isDark ? "text-gray-400" : "text-gray-600"
                            }`}>Series</div>
                        </div>
                        <div className={`p-3 rounded-lg ${
                            isDark ? "bg-pink-900/20" : "bg-pink-50"
                        }`}>
                            <div className={`text-xl font-bold ${
                                isDark ? "text-pink-400" : "text-pink-600"
                            }`}>{typeStats.anime}</div>
                            <div className={`text-xs ${
                                isDark ? "text-gray-400" : "text-gray-600"
                            }`}>Anime</div>
                        </div>
                    </div>
                </div>

                {/* Cards Grid - 1 column on mobile */}
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">📚</div>
                        <p className={`text-base mb-3 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                        }`}>
                            {typeFilter === 'All'
                                ? "Your library is empty."
                                : `No ${typeFilter.toLowerCase()} found.`}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredItems.map((item) => (
                            <div
                                key={`${item.type}-${item.id}`}
                                onClick={() => navigate(`/details/${item.type}/${item.id}`)}
                                className={`relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all cursor-pointer ${
                                    isDark ? "bg-gray-800" : "bg-white"
                                }`}
                            >
                                <img
                                    src={item.image || "https://via.placeholder.com/300x450?text=No+Image"}
                                    alt={item.title || "Untitled"}
                                    onError={(e) =>
                                        (e.target.src =
                                            "https://via.placeholder.com/300x450?text=No+Image")
                                    }
                                    className="w-full h-48 object-cover group-hover:opacity-80 transition-opacity duration-300"
                                />

                                {/* Type Badge */}
                                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                                    {getTypeIcon(item)}
                                </div>

                                {/* Favorite toggle */}
                                <button
                                    onClick={(e) => handleFavoriteToggle(e, item)}
                                    className="absolute top-2 right-2 text-xl z-20 hover:scale-110 transition-transform"
                                >
                                    {item.favorite ? "❤️" : "🤍"}
                                </button>

                                {/* Info overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 text-white z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                    <h3 className="text-sm font-bold line-clamp-1">
                                        {item.title || "Untitled"}
                                    </h3>
                                    <div className="flex justify-between items-center text-xs mt-1">
                                        <span
                                            className={`px-2 py-1 rounded-lg ${getStatusColor(item.status, item.favorite)}`}
                                        >
                                            {item.favorite ? "❤️ Favorite" : item.status}
                                        </span>
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded">
                                            {getTypeLabel(item)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Link to Profile Stats */}
                <div className="mt-8 text-center">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                        <h3 className="text-xl font-bold mb-3">📊 View Detailed Statistics</h3>
                        <p className="text-sm mb-4 text-blue-100">
                            Check your watch time, top genres, and track your progress in your profile!
                        </p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm"
                        >
                            View Profile Stats
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibraryPage;