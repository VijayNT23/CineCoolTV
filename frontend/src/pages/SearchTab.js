// src/pages/SearchTab.js
import React, { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    toggleLibraryItem,
    toggleFavorite,
    isInLibrary,
    isFavorite,
    getLibrary,
} from "../utils/libraryUtils";
import { useTheme } from "../context/ThemeContext";
import { Search, X, Star, TrendingUp, Filter, ChevronDown, ChevronUp } from "lucide-react";

const BASE_IMG = "https://image.tmdb.org/t/p/original";

const SearchTab = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [query, setQuery] = useState(location.state?.query || "");
    const [results, setResults] = useState(location.state?.results || []);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showMore, setShowMore] = useState(false);
    const [filter, setFilter] = useState("popular"); // "popular", "top_rated", "all"
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const TMDB_KEY = process.env.REACT_APP_TMDB_API_KEY;

    // Fetch autocomplete suggestions
    const fetchSuggestions = useCallback(async (searchQuery) => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setLoadingSuggestions(true);
        try {
            const response = await fetch(
                `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(
                    searchQuery
                )}&page=1`
            );
            const data = await response.json();

            // Filter and limit suggestions to popular items
            const popularSuggestions = (data.results || [])
                .filter(item =>
                    (item.media_type === 'movie' || item.media_type === 'tv') &&
                    (item.vote_count > 50 || item.popularity > 5) // Only popular items
                )
                .slice(0, 8); // Limit to 8 suggestions

            setSuggestions(popularSuggestions);
            setShowSuggestions(popularSuggestions.length > 0);
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            setSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    }, [TMDB_KEY]);

    // Debounced suggestion fetcher
    const debouncedFetchSuggestions = useCallback((searchQuery) => {
        const timeoutId = setTimeout(() => {
            fetchSuggestions(searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchSuggestions]);

    // Handle input change with suggestions
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        debouncedFetchSuggestions(value);
    };

    // Clear search
    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    // Select suggestion
    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion.title || suggestion.name);
        setShowSuggestions(false);
        handleSearchWithItem(suggestion);
    };

    // Search with specific item
    const handleSearchWithItem = async (item) => {
        const searchQuery = item.title || item.name;
        setQuery(searchQuery);
        await performSearch(searchQuery);
    };

    // Perform the actual search
    const performSearch = async (searchQuery, filterType = filter) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            // First, try multi-search
            const multiResponse = await fetch(
                `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(
                    searchQuery
                )}&page=1`
            );
            const multiData = await multiResponse.json();

            let allResults = multiData.results || [];

            // Apply filters
            if (filterType === "popular") {
                allResults = allResults
                    .filter(item => item.popularity > 10 && item.vote_count > 20)
                    .sort((a, b) => b.popularity - a.popularity);
            } else if (filterType === "top_rated") {
                allResults = allResults
                    .filter(item => item.vote_average > 6.5 && item.vote_count > 50)
                    .sort((a, b) => b.vote_average - a.vote_average);
            }

            // Remove duplicates and limit initial results
            const uniqueResults = allResults.filter((item, index, self) =>
                index === self.findIndex((t) => t.id === item.id)
            );

            // Show only top results initially
            const topResults = uniqueResults.slice(0, 12);
            setResults(topResults);
            setShowMore(uniqueResults.length > 12);

        } catch (err) {
            console.error("Error fetching search results:", err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Show more results
    const handleShowMore = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(
                    query
                )}&page=1`
            );
            const data = await response.json();

            let allResults = data.results || [];

            // Apply same filters
            if (filter === "popular") {
                allResults = allResults
                    .filter(item => item.popularity > 10 && item.vote_count > 20)
                    .sort((a, b) => b.popularity - a.popularity);
            } else if (filter === "top_rated") {
                allResults = allResults
                    .filter(item => item.vote_average > 6.5 && item.vote_count > 50)
                    .sort((a, b) => b.vote_average - a.vote_average);
            }

            const uniqueResults = allResults.filter((item, index, self) =>
                index === self.findIndex((t) => t.id === item.id)
            );

            setResults(uniqueResults);
            setShowMore(false);
        } catch (err) {
            console.error("Error fetching more results:", err);
        } finally {
            setLoading(false);
        }
    };

    // 🔍 Handle search form submission
    const handleSearch = async (e) => {
        e.preventDefault();
        setShowSuggestions(false);
        await performSearch(query);
    };

    // Handle filter change
    const handleFilterChange = async (newFilter) => {
        setFilter(newFilter);
        setShowFilterDropdown(false);
        await performSearch(query, newFilter);
    };

    // 🧭 Navigate to details page
    const handleCardClick = (item) => {
        const mediaType = item.media_type || (item.title ? "movie" : "tv");
        navigate(`/details/${mediaType}/${item.id}`);
    };

    // ➕ Add to Library
    const handleAddLibrary = async (e, item) => {
        e.stopPropagation();
        const mediaType = item.media_type || (item.title ? "movie" : "tv");
        const imageUrl = item.poster_path
            ? `${BASE_IMG}${item.poster_path}`
            : item.backdrop_path
                ? `${BASE_IMG}${item.backdrop_path}`
                : "https://via.placeholder.com/300x450?text=No+Image";

        await toggleLibraryItem({
            id: item.id,
            type: mediaType,
            title: item.title || item.name,
            image: imageUrl,
            status: "Watchlist",
            rating: item.vote_average ?? null,
        });

        const updated = await getLibrary();
        setRefreshKey((prev) => prev + 1);
        window.dispatchEvent(new CustomEvent("libraryUpdated", { detail: updated }));
    };

    // ❤️ Favorite toggle
    const handleFavorite = async (e, item) => {
        e.stopPropagation();
        const mediaType = item.media_type || (item.title ? "movie" : "tv");
        const imageUrl = item.poster_path
            ? `${BASE_IMG}${item.poster_path}`
            : item.backdrop_path
                ? `${BASE_IMG}${item.backdrop_path}`
                : "https://via.placeholder.com/300x450?text=No+Image";

        await toggleFavorite(item.id, mediaType, {
            title: item.title || item.name,
            image: imageUrl,
            status: "Watchlist",
        });

        const updated = await getLibrary();
        setRefreshKey((prev) => prev + 1);
        window.dispatchEvent(new CustomEvent("libraryUpdated", { detail: updated }));
    };

    // Filter options
    const filterOptions = [
        { value: "popular", label: "🔥 Popular", icon: <TrendingUp size={16} /> },
        { value: "top_rated", label: "⭐ Top Rated", icon: <Star size={16} /> },
        { value: "all", label: "🎬 All Results", icon: <Filter size={16} /> }
    ];

    const getFilterLabel = () => {
        const option = filterOptions.find(opt => opt.value === filter);
        return option ? option.label : "Filter";
    };

    return (
        <div key={refreshKey} className={`min-h-screen themed-bg-primary themed-text-primary p-6`}>
            {/* Search Header */}
            <div className="max-w-6xl mx-auto">
                {/* Search bar with suggestions */}
                <div className="relative mb-8">
                    <form onSubmit={handleSearch} className="flex items-center">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className={`h-5 w-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search movies, TV shows, or anime..."
                                className={`block w-full pl-10 pr-12 py-4 text-lg rounded-l-xl border-0 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all ${
                                    theme === "dark"
                                        ? "bg-gray-800 text-white placeholder-gray-400"
                                        : "bg-white text-gray-900 placeholder-gray-500 border border-gray-300"
                                }`}
                                value={query}
                                onChange={handleInputChange}
                                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    <X className={`h-5 w-5 ${theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}`} />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-r-xl text-white font-semibold text-lg transition-all duration-200 flex items-center gap-2"
                        >
                            <Search size={20} />
                            Search
                        </button>
                    </form>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && (suggestions.length > 0 || loadingSuggestions) && (
                        <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl border backdrop-blur-lg z-50 max-h-80 overflow-y-auto ${
                            theme === "dark"
                                ? "bg-gray-900 border-gray-700"
                                : "bg-white border-gray-200"
                        }`}>
                            {loadingSuggestions ? (
                                <div className="p-4 text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
                                </div>
                            ) : (
                                suggestions.map((suggestion) => (
                                    <button
                                        key={`${suggestion.id}-${suggestion.media_type}`}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className={`w-full text-left p-4 hover:bg-red-500 hover:text-white transition-all duration-200 border-b last:border-b-0 ${
                                            theme === "dark"
                                                ? "border-gray-700 hover:bg-red-600"
                                                : "border-gray-200 hover:bg-red-500"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={suggestion.poster_path ? `${BASE_IMG}${suggestion.poster_path}` : "https://via.placeholder.com/50x75?text=No+Image"}
                                                    alt={suggestion.title || suggestion.name}
                                                    className="w-10 h-15 object-cover rounded"
                                                />
                                                <div>
                                                    <p className="font-semibold text-lg">
                                                        {suggestion.title || suggestion.name}
                                                    </p>
                                                    <p className={`text-sm capitalize ${
                                                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                                                    }`}>
                                                        {suggestion.media_type} • {suggestion.release_date?.substring(0,4) || suggestion.first_air_date?.substring(0,4) || 'N/A'}
                                                        {suggestion.vote_average && ` • ⭐ ${suggestion.vote_average.toFixed(1)}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                suggestion.media_type === 'movie'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-purple-500 text-white'
                                            }`}>
                                                {suggestion.media_type === 'movie' ? 'MOVIE' : 'TV'}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Results Header with Filter */}
                {results.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold">
                                Search Results for "{query}"
                            </h2>
                            <p className={`mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                {results.length} {results.length === 1 ? 'result' : 'results'} found
                                {filter !== 'all' && ` • Showing ${filter.replace('_', ' ')}`}
                            </p>
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                                    theme === "dark"
                                        ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                                        : "bg-white border-gray-300 hover:bg-gray-50 text-gray-900"
                                }`}
                            >
                                <Filter size={16} />
                                <span>{getFilterLabel()}</span>
                                {showFilterDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {showFilterDropdown && (
                                <div className={`absolute top-full right-0 mt-2 w-48 rounded-lg shadow-xl border backdrop-blur-lg z-40 ${
                                    theme === "dark"
                                        ? "bg-gray-900 border-gray-700"
                                        : "bg-white border-gray-200"
                                }`}>
                                    {filterOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleFilterChange(option.value)}
                                            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all ${
                                                filter === option.value
                                                    ? theme === "dark"
                                                        ? "bg-red-600 text-white"
                                                        : "bg-red-500 text-white"
                                                    : theme === "dark"
                                                        ? "hover:bg-gray-800 text-white"
                                                        : "hover:bg-gray-100 text-gray-900"
                                            }`}
                                        >
                                            {option.icon}
                                            <span>{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    </div>
                )}

                {/* Results Grid */}
                {!loading && results.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
                            {results.map((item) => {
                                const mediaType = item.media_type || (item.title ? "movie" : "tv");
                                const imageUrl = item.poster_path
                                    ? `${BASE_IMG}${item.poster_path}`
                                    : item.backdrop_path
                                        ? `${BASE_IMG}${item.backdrop_path}`
                                        : "https://via.placeholder.com/300x450?text=No+Image";
                                const inLibrary = isInLibrary(item.id, mediaType);
                                const favorite = isFavorite(item.id, mediaType);

                                return (
                                    <div
                                        key={`${item.id}-${mediaType}`}
                                        onClick={() => handleCardClick(item)}
                                        className={`relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer group ${
                                            theme === "dark" ? "bg-gray-800" : "bg-white"
                                        }`}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={item.title || item.name}
                                            className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-110"
                                            loading="lazy"
                                        />

                                        {/* Overlay */}
                                        <div className={`absolute inset-0 transition-all duration-300 ${
                                            theme === "dark"
                                                ? "bg-black/0 group-hover:bg-black/60"
                                                : "bg-white/0 group-hover:bg-white/60"
                                        }`} />

                                        {/* Action Buttons */}
                                        <div className="absolute top-3 right-3 flex flex-col items-center gap-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            {/* Favorite Button */}
                                            <button
                                                onClick={(e) => handleFavorite(e, item)}
                                                className={`rounded-full p-2 backdrop-blur-md shadow-lg hover:scale-110 transition-transform ${
                                                    favorite
                                                        ? "text-pink-500 bg-white/90"
                                                        : theme === "dark"
                                                            ? "text-gray-300 bg-black/60 hover:text-white"
                                                            : "text-gray-600 bg-white/90 hover:text-gray-900"
                                                }`}
                                                title={favorite ? "Unfavorite" : "Add to favorites"}
                                            >
                                                <span className="text-xl">{favorite ? "❤️" : "🤍"}</span>
                                            </button>

                                            {/* Library Button */}
                                            <button
                                                onClick={(e) => handleAddLibrary(e, item)}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold shadow-lg backdrop-blur-md transition-all ${
                                                    inLibrary
                                                        ? "bg-green-600 text-white scale-105"
                                                        : "bg-red-600 text-white hover:bg-red-700"
                                                }`}
                                            >
                                                {inLibrary ? "✓ Added" : "+ Add"}
                                            </button>
                                        </div>

                                        {/* Item Info */}
                                        <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${
                                            theme === "dark"
                                                ? "bg-gradient-to-t from-black/90 to-transparent text-white"
                                                : "bg-gradient-to-t from-white/90 to-transparent text-gray-900"
                                        }`}>
                                            <p className="font-semibold text-sm truncate mb-1">
                                                {item.title || item.name}
                                            </p>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="capitalize">
                                                    {mediaType} • {item.release_date?.substring(0,4) || item.first_air_date?.substring(0,4) || 'N/A'}
                                                </span>
                                                {item.vote_average > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        ⭐ {item.vote_average.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Show More Button */}
                        {showMore && (
                            <div className="text-center mb-12">
                                <button
                                    onClick={handleShowMore}
                                    className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 border-2 ${
                                        theme === "dark"
                                            ? "bg-transparent border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                            : "bg-transparent border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                                    }`}
                                >
                                    Show All Results
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    !loading && query && (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-2xl font-bold mb-4">No Results Found</h3>
                            <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                Try adjusting your search terms or filter settings
                            </p>
                            <button
                                onClick={() => handleFilterChange("all")}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Show All Results
                            </button>
                        </div>
                    )
                )}

                {/* Empty State */}
                {!query && !loading && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🎬</div>
                        <h3 className="text-2xl font-bold mb-4">Start Your Search</h3>
                        <p className={`text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            Search for movies, TV shows, or anime to discover new content
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchTab;