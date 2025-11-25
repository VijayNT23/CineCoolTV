// src/pages/DetailsPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    toggleFavorite,
    toggleLibraryItem,
    updateLibraryStatus,
    isInLibrary,
    getLibraryItem,
    updateLibraryItem,
    removeFromLibrary,
} from "../utils/libraryUtils";
import { useTheme } from "../context/ThemeContext";

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const IMG_BASE = "https://image.tmdb.org/t/p/original";

const DetailsPage = () => {
    const { type: typeFromRoute, id } = useParams();
    const navigate = useNavigate();
    const { isDark } = useTheme();

    // Keep anime as separate type, only convert "series" to "tv" for API calls
    const type = !typeFromRoute ? "movie" : typeFromRoute;
    const apiType = type === "series" || type === "anime" ? "tv" : type;

    const [details, setDetails] = useState(null);
    const [cast, setCast] = useState([]);
    const [videos, setVideos] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [episodes, setEpisodes] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [activeTab, setActiveTab] = useState("trailer");
    const [status, setStatus] = useState(null);
    const [isRewatching, setIsRewatching] = useState(false);
    const [fav, setFav] = useState(false);
    const [loading, setLoading] = useState(true);
    const [recommendationsLoading, setRecommendationsLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function fetchAll() {
            setLoading(true);
            try {
                const detailsRes = await axios.get(
                    `https://api.themoviedb.org/3/${apiType}/${id}?api_key=${API_KEY}&language=en-US`
                );
                if (!mounted) return;
                setDetails(detailsRes.data);

                const creditsRes = await axios.get(
                    `https://api.themoviedb.org/3/${apiType}/${id}/credits?api_key=${API_KEY}`
                );
                if (mounted) setCast(creditsRes.data.cast || []);

                const videoRes = await axios.get(
                    `https://api.themoviedb.org/3/${apiType}/${id}/videos?api_key=${API_KEY}`
                );
                if (mounted) setVideos(videoRes.data.results || []);

                // Fetch recommendations separately to handle loading state
                setRecommendationsLoading(true);
                try {
                    const recRes = await axios.get(
                        `https://api.themoviedb.org/3/${apiType}/${id}/recommendations?api_key=${API_KEY}`
                    );
                    if (mounted) {
                        setRecommendations(recRes.data.results || []);
                        console.log("📋 Recommendations loaded:", recRes.data.results?.length || 0);
                    }
                } catch (recError) {
                    console.error("Error fetching recommendations:", recError);
                    if (mounted) setRecommendations([]);
                } finally {
                    if (mounted) setRecommendationsLoading(false);
                }

            } catch (err) {
                console.error("Details fetch error", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchAll();

        const syncStatus = async () => {
            const libraryItem = getLibraryItem(Number(id), type);
            if (libraryItem) {
                setStatus(libraryItem.status);
                setIsRewatching(libraryItem.isRewatching || false);
                setFav(libraryItem.favorite || false);
            } else {
                setStatus(null);
                setIsRewatching(false);
                setFav(false);
            }
        };
        syncStatus();

        const handler = () => {
            const libraryItem = getLibraryItem(Number(id), type);
            if (libraryItem) {
                setStatus(libraryItem.status);
                setIsRewatching(libraryItem.isRewatching || false);
                setFav(libraryItem.favorite || false);
            } else {
                setStatus(null);
                setIsRewatching(false);
                setFav(false);
            }
        };
        window.addEventListener("libraryUpdated", handler);

        return () => {
            mounted = false;
            window.removeEventListener("libraryUpdated", handler);
        };
    }, [id, type, apiType]);

    useEffect(() => {
        let mounted = true;
        if (apiType !== "tv") return;
        (async () => {
            try {
                const res = await axios.get(
                    `https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}?api_key=${API_KEY}`
                );
                if (mounted) setEpisodes(res.data.episodes || []);
            } catch (e) {
                console.warn("episodes fetch err", e);
            }
        })();
        return () => (mounted = false);
    }, [id, selectedSeason, apiType]);

    const calculateTotalDuration = () => {
        if (!details || apiType !== "tv") return 0;
        const episodeRuntime = details.episode_run_time?.[0] || 45;
        const totalEpisodes = details.number_of_episodes || 0;
        return episodeRuntime * totalEpisodes;
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
        }
        return `${mins}m`;
    };

    // FIXED: Handle status change with toggle behavior
    const handleStatusChange = async (newStatus) => {
        const libraryItem = getLibraryItem(Number(id), type);

        // If clicking the same status again, remove from library
        if (status === newStatus) {
            await removeFromLibrary(Number(id), type);
            setStatus(null);
            setIsRewatching(false);
            return;
        }

        // If clicking Rewatching when already rewatching, toggle it off
        if (newStatus === "Rewatching") {
            if (isRewatching) {
                setIsRewatching(false);
                if (libraryItem) {
                    await updateLibraryItem(Number(id), type, {
                        isRewatching: false
                    });
                }
                return;
            } else {
                // Start rewatching - set status to Completed and mark as rewatching
                const genres = details.genres ? details.genres.map(g => g.name) : [];
                let duration = details.runtime || 0;
                if (apiType === "tv") {
                    duration = calculateTotalDuration();
                } else if (!duration || duration === 0) {
                    if (type === "movie") duration = 120;
                    else if (type === "anime") duration = 24;
                }

                updateLibraryStatus(Number(id), type, "Completed", {
                    title: details.title || details.name,
                    image: details.poster_path ? `${IMG_BASE}${details.poster_path}` : "https://via.placeholder.com/400x600?text=No+Image",
                    genres: genres,
                    duration: duration,
                    isRewatching: true
                });
                setStatus("Completed");
                setIsRewatching(true);
                return;
            }
        }

        // Normal status change
        const genres = details.genres ? details.genres.map(g => g.name) : [];
        let duration = details.runtime || 0;
        if (apiType === "tv") {
            duration = calculateTotalDuration();
        } else if (!duration || duration === 0) {
            if (type === "movie") duration = 120;
            else if (type === "anime") duration = 24;
        }

        updateLibraryStatus(Number(id), type, newStatus, {
            title: details.title || details.name,
            image: details.poster_path ? `${IMG_BASE}${details.poster_path}` : "https://via.placeholder.com/400x600?text=No+Image",
            genres: genres,
            duration: duration,
            isRewatching: newStatus === "Completed" ? isRewatching : false
        });
        setStatus(newStatus);
        if (newStatus !== "Completed") {
            setIsRewatching(false);
        }
    };

    const handleToggleFav = () => {
        const genres = details.genres ? details.genres.map(g => g.name) : [];
        toggleFavorite(Number(id), type, {
            title: details.title || details.name,
            image: details.poster_path ? `${IMG_BASE}${details.poster_path}` : "https://via.placeholder.com/400x600?text=No+Image",
            genres: genres,
            duration: type === "tv" ? calculateTotalDuration() : (details.runtime || 120)
        });
        setFav(!fav);
    };

    const handleAddToLibrary = async () => {
        // If already in library, remove it
        if (isInLibrary(Number(id), type)) {
            await removeFromLibrary(Number(id), type);
            setStatus(null);
            setFav(false);
            setIsRewatching(false);
            return;
        }

        // Add to library with Watchlist status
        const genres = details.genres ? details.genres.map(g => g.name) : [];
        const itemData = {
            id: Number(id),
            type,
            title: details.title || details.name,
            image: details.poster_path ? `${IMG_BASE}${details.poster_path}` : "https://via.placeholder.com/400x600?text=No+Image",
            status: "Watchlist",
            rating: details.vote_average ?? null,
            genres: genres,
            duration: type === "tv" ? calculateTotalDuration() : (details.runtime || 120)
        };

        await toggleLibraryItem(itemData);
        setStatus("Watchlist");

        const libraryItem = getLibraryItem(Number(id), type);
        if (libraryItem) {
            setStatus(libraryItem.status);
            setFav(libraryItem.favorite || false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <div className={`text-2xl font-bold tracking-wide ${isDark ? "text-white" : "text-gray-900"}`}>
                    🎬 Loading Details...
                </div>
            </div>
        );
    }

    if (!details) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <div className={`text-center text-2xl font-bold tracking-wide ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                    🎭 Failed to load details. Please try again.
                </div>
            </div>
        );
    }

    const poster = details.poster_path
        ? `${IMG_BASE}${details.poster_path}`
        : details.backdrop_path
            ? `${IMG_BASE}${details.backdrop_path}`
            : "https://via.placeholder.com/400x600?text=No+Image";

    const trailer = videos.find(
        (v) => v.type === "Trailer" && v.site === "YouTube"
    );

    const episodeRuntime = details.episode_run_time?.[0] || 45;
    const totalEpisodes = details.number_of_episodes || 0;
    const totalDuration = calculateTotalDuration();

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Cinematic Background with Enhanced Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center z-0"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${details.backdrop_path ? `${IMG_BASE}${details.backdrop_path}` : poster})`,
                }}
            >
                <div className={`absolute inset-0 ${
                    isDark
                        ? "bg-gradient-to-b from-black/90 via-black/80 to-black/95"
                        : "bg-gradient-to-b from-white/95 via-white/90 to-white/98"
                }`}></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
                {/* Back Button with Cinematic Style */}
                <button
                    onClick={() => window.history.back()}
                    className={`mb-8 px-6 py-3 rounded-xl transition-all duration-300 font-bold tracking-wide shadow-2xl backdrop-blur-sm ${
                        isDark
                            ? "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                            : "bg-black/10 hover:bg-black/20 text-gray-900 border border-gray-300/50"
                    }`}
                >
                    🎬 ← Back to Browse
                </button>

                <div className="flex flex-col md:flex-row gap-10 items-start">
                    {/* Poster + Actions - Enhanced */}
                    <div className="w-full md:w-96 flex-shrink-0">
                        <img
                            src={poster}
                            alt={details.title || details.name}
                            className="rounded-3xl shadow-2xl w-full object-cover transform hover:scale-105 transition-transform duration-500 border-4 border-white/20"
                        />

                        {/* Duration Information - Cinematic */}
                        <div className={`mt-6 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border ${
                            isDark
                                ? "bg-white/10 border-white/20"
                                : "bg-black/10 border-gray-300/50"
                        }`}>
                            <h3 className={`font-black text-xl mb-4 tracking-wider ${
                                isDark
                                    ? "text-white drop-shadow-lg"
                                    : "text-gray-900"
                            }`}>🎥 DURATION INFO</h3>
                            {type === "movie" ? (
                                <div className="space-y-3">
                                    <p className={`font-bold text-lg ${
                                        isDark ? "text-white" : "text-gray-800"
                                    }`}>
                                        <span className={`font-semibold ${
                                            isDark ? "text-gray-300" : "text-gray-600"
                                        }`}>Movie Duration:</span><br/>
                                        {formatDuration(details.runtime || 120)}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className={`font-bold text-lg ${
                                        isDark ? "text-white" : "text-gray-800"
                                    }`}>
                                        <span className={`font-semibold ${
                                            isDark ? "text-gray-300" : "text-gray-600"
                                        }`}>Episode Duration:</span><br/>
                                        {formatDuration(episodeRuntime)}
                                    </p>
                                    <p className={`font-bold text-lg ${
                                        isDark ? "text-white" : "text-gray-800"
                                    }`}>
                                        <span className={`font-semibold ${
                                            isDark ? "text-gray-300" : "text-gray-600"
                                        }`}>Total Episodes:</span><br/>
                                        {totalEpisodes}
                                    </p>
                                    <p className={`font-bold text-lg ${
                                        isDark ? "text-white" : "text-gray-800"
                                    }`}>
                                        <span className={`font-semibold ${
                                            isDark ? "text-gray-300" : "text-gray-600"
                                        }`}>Total Series Duration:</span><br/>
                                        {formatDuration(totalDuration)}
                                    </p>
                                    <p className={`text-sm font-semibold mt-2 ${
                                        isDark ? "text-gray-400" : "text-gray-600"
                                    }`}>
                                        ({Math.floor(totalDuration / 60)} hours {totalDuration % 60} minutes)
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons - Cinematic */}
                        <div className="mt-6 flex flex-col gap-4">
                            <button
                                onClick={handleAddToLibrary}
                                className={`px-6 py-4 rounded-2xl font-black text-lg tracking-wide transition-all duration-300 shadow-2xl transform hover:scale-105 ${
                                    isInLibrary(Number(id), type)
                                        ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white"
                                        : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white"
                                }`}
                            >
                                {isInLibrary(Number(id), type)
                                    ? "🗑️ REMOVE FROM LIBRARY"
                                    : "🎬 ADD TO LIBRARY"}
                            </button>
                            <button
                                onClick={handleToggleFav}
                                className={`px-6 py-4 rounded-2xl font-black text-lg tracking-wide transition-all duration-300 shadow-2xl transform hover:scale-105 ${
                                    fav
                                        ? "bg-gradient-to-r from-pink-600 to-red-500 hover:from-pink-500 hover:to-red-400 text-white"
                                        : isDark
                                            ? "bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white"
                                            : "bg-gradient-to-r from-gray-300 to-gray-200 hover:from-gray-200 hover:to-gray-100 text-gray-900"
                                }`}
                            >
                                {fav ? "❤️ FAVORITED" : "⭐ ADD TO FAVORITES"}
                            </button>
                        </div>

                        {status && (
                            <div className={`mt-4 p-4 rounded-2xl shadow-xl backdrop-blur-sm border ${
                                isDark
                                    ? "bg-white/10 border-white/20"
                                    : "bg-black/10 border-gray-300/50"
                            }`}>
                                <p className={`text-lg font-bold tracking-wide ${
                                    isDark ? "text-white" : "text-gray-800"
                                }`}>
                                    📊 CURRENT STATUS: <span className={`font-black text-xl ${
                                    isDark ? "text-white" : "text-gray-900"
                                }`}>{status.toUpperCase()}</span>
                                    {isRewatching && (
                                        <span className="ml-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-3 py-1 rounded-full text-sm font-black tracking-wide">
                                            🔁 REWATCHING
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Main Details - Cinematic */}
                    <div className="flex-1">
                        {/* Title with Cinematic Impact */}
                        <h1 className={`text-5xl font-black mb-4 tracking-tight leading-tight drop-shadow-2xl ${
                            isDark
                                ? "text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                                : "text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                        }`}>
                            {details.title || details.name}
                        </h1>

                        {/* Metadata - Bold and Clean */}
                        <div className={`mb-6 flex flex-wrap gap-6 text-lg font-bold tracking-wide ${
                            isDark ? "text-gray-200" : "text-gray-700"
                        }`}>
                            {(details.release_date || details.first_air_date) && (
                                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                                    🗓️ {(details.release_date || details.first_air_date).slice(0, 10)}
                                </span>
                            )}
                            {details.runtime && type === "movie" && (
                                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                                    ⏱️ {formatDuration(details.runtime)}
                                </span>
                            )}
                            {details.vote_average !== undefined && (
                                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                                    ⭐ {details.vote_average.toFixed(1)}/10
                                </span>
                            )}
                            {details.number_of_seasons && (
                                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                                    📺 {details.number_of_seasons} SEASONS
                                </span>
                            )}
                            {details.number_of_episodes && (
                                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                                    🎬 {details.number_of_episodes} EPISODES
                                </span>
                            )}
                        </div>

                        {/* Overview - Enhanced Readability */}
                        <p className={`text-xl leading-relaxed mb-8 max-w-4xl font-semibold tracking-wide ${
                            isDark
                                ? "text-gray-100 drop-shadow-lg"
                                : "text-gray-800"
                        }`}>
                            {details.overview || "No summary available."}
                        </p>

                        {/* Genres Display - Cinematic */}
                        {details.genres && details.genres.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-8">
                                {details.genres.map(genre => (
                                    <span
                                        key={genre.id}
                                        className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-lg font-black tracking-wide text-white shadow-2xl transform hover:scale-105 transition-transform"
                                    >
                                        {genre.name.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Status Buttons - Premium */}
                        <div className="mb-10">
                            <h3 className={`text-2xl font-black mb-6 tracking-wider ${
                                isDark
                                    ? "text-white drop-shadow-lg"
                                    : "text-gray-900"
                            }`}>🎯 UPDATE STATUS</h3>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    "Watchlist",
                                    "Watching",
                                    "Considering",
                                    "Completed",
                                    "Dropped",
                                ].map((st) => (
                                    <button
                                        key={st}
                                        onClick={() => handleStatusChange(st)}
                                        className={`px-6 py-4 rounded-xl font-black tracking-wide transition-all duration-300 shadow-2xl transform hover:scale-110 ${
                                            status === st
                                                ? "bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg"
                                                : isDark
                                                    ? "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                                                    : "bg-black/10 hover:bg-black/20 text-gray-900 border border-gray-300/50"
                                        }`}
                                    >
                                        {status === st ? `✅ ${st.toUpperCase()}` : st.toUpperCase()}
                                    </button>
                                ))}

                                {/* Rewatch Button */}
                                <button
                                    onClick={() => handleStatusChange("Rewatching")}
                                    className={`px-6 py-4 rounded-xl font-black tracking-wide transition-all duration-300 shadow-2xl transform hover:scale-110 ${
                                        isRewatching
                                            ? "bg-gradient-to-r from-orange-700 to-yellow-600 text-white shadow-lg"
                                            : isDark
                                                ? "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                                                : "bg-black/10 hover:bg-black/20 text-gray-900 border border-gray-300/50"
                                    }`}
                                >
                                    {isRewatching ? "✅ REWATCHING" : "🔁 MARK REWATCHING"}
                                </button>
                            </div>

                            {isRewatching && (
                                <p className="text-lg font-bold text-orange-400 mt-4 tracking-wide drop-shadow-lg">
                                    ✅ This show is marked as completed and you're currently rewatching it!
                                </p>
                            )}
                        </div>

                        {/* Tabs - Cinematic */}
                        <div className="mt-10">
                            <div className={`flex gap-8 border-b-2 pb-4 ${
                                isDark ? "border-white/30" : "border-gray-400/50"
                            }`}>
                                {["trailer", "cast", ...(type === "tv" ? ["episodes"] : []), "recommendations"].map(
                                    (tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`pb-2 capitalize text-lg font-black tracking-wide transition-all duration-300 ${
                                                activeTab === tab
                                                    ? "border-b-4 border-red-500 text-red-500 transform scale-110"
                                                    : isDark
                                                        ? "text-gray-400 hover:text-white hover:scale-105"
                                                        : "text-gray-600 hover:text-gray-900 hover:scale-105"
                                            }`}
                                        >
                                            {tab.toUpperCase()}
                                        </button>
                                    )
                                )}
                            </div>

                            <div className="mt-8">
                                {activeTab === "trailer" && (
                                    <div className="rounded-3xl overflow-hidden shadow-2xl">
                                        {trailer ? (
                                            <iframe
                                                className="w-full h-96 rounded-3xl"
                                                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=0&rel=0&modestbranding=1`}
                                                title="Trailer"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <p className={`text-center py-16 text-xl font-bold tracking-wide ${
                                                isDark ? "text-gray-400" : "text-gray-600"
                                            }`}>🎥 No trailer available</p>
                                        )}
                                    </div>
                                )}

                                {activeTab === "cast" && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                        {cast.slice(0, 12).map((c) => (
                                            <div
                                                key={c.cast_id || c.credit_id || c.id}
                                                className="text-center group"
                                            >
                                                <img
                                                    src={
                                                        c.profile_path
                                                            ? `${IMG_BASE}${c.profile_path}`
                                                            : "https://via.placeholder.com/200x300?text=No+Image"
                                                    }
                                                    alt={c.name}
                                                    className="w-36 h-48 object-cover rounded-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-2xl border-2 border-white/20"
                                                    onError={(e) => {
                                                        e.target.src = "https://via.placeholder.com/200x300?text=No+Image";
                                                    }}
                                                />
                                                <p className={`font-black text-sm tracking-wide ${
                                                    isDark ? "text-white" : "text-gray-900"
                                                }`}>{c.name}</p>
                                                <p className={`text-xs font-bold mt-1 ${
                                                    isDark ? "text-gray-400" : "text-gray-600"
                                                }`}>{c.character}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === "episodes" && type === "tv" && (
                                    <div>
                                        <div className="mb-6 flex items-center gap-4">
                                            <label className={`font-black text-xl tracking-wide ${
                                                isDark ? "text-white" : "text-gray-900"
                                            }`}>📺 SEASON:</label>
                                            <select
                                                value={selectedSeason}
                                                onChange={(e) =>
                                                    setSelectedSeason(Number(e.target.value))
                                                }
                                                className={`px-4 py-3 rounded-xl font-bold border-2 ${
                                                    isDark
                                                        ? "bg-white/10 text-white border-white/20"
                                                        : "bg-white text-gray-900 border-gray-300"
                                                }`}
                                            >
                                                {Array.from(
                                                    { length: details.number_of_seasons || 1 },
                                                    (_, i) => (
                                                        <option key={i + 1} value={i + 1}>
                                                            SEASON {i + 1}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        {episodes.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-96 overflow-y-auto">
                                                {episodes.map((ep) => (
                                                    <div
                                                        key={ep.id}
                                                        className={`p-6 rounded-2xl shadow-2xl backdrop-blur-sm border transform hover:scale-105 transition-all duration-300 ${
                                                            isDark
                                                                ? "bg-white/10 hover:bg-white/15 border-white/20"
                                                                : "bg-black/10 hover:bg-black/15 border-gray-300/50"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-6">
                                                            {ep.still_path && (
                                                                <img
                                                                    src={`${IMG_BASE}${ep.still_path}`}
                                                                    alt={ep.name}
                                                                    className="w-32 h-20 object-cover rounded-xl shadow-lg"
                                                                />
                                                            )}
                                                            <div className="flex-1">
                                                                <h3 className={`font-black text-lg tracking-wide ${
                                                                    isDark ? "text-white" : "text-gray-900"
                                                                }`}>
                                                                    S{selectedSeason}E{ep.episode_number}: {ep.name}
                                                                </h3>
                                                                <p className={`text-sm font-semibold mt-2 line-clamp-2 ${
                                                                    isDark ? "text-gray-300" : "text-gray-600"
                                                                }`}>
                                                                    {ep.overview || "No description available."}
                                                                </p>
                                                                {ep.runtime && (
                                                                    <p className={`text-xs font-bold mt-2 ${
                                                                        isDark ? "text-gray-500" : "text-gray-600"
                                                                    }`}>
                                                                        ⏱️ {formatDuration(ep.runtime)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={`text-center py-16 text-xl font-bold tracking-wide ${
                                                isDark ? "text-gray-400" : "text-gray-600"
                                            }`}>🎬 No episodes found</p>
                                        )}
                                    </div>
                                )}

                                {activeTab === "recommendations" && (
                                    <div>
                                        {recommendationsLoading ? (
                                            <p className={`text-center py-16 text-xl font-bold tracking-wide ${
                                                isDark ? "text-gray-400" : "text-gray-600"
                                            }`}>🔄 Loading recommendations...</p>
                                        ) : recommendations.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                                {recommendations.map((rec) => (
                                                    <div
                                                        key={rec.id}
                                                        onClick={() =>
                                                            navigate(
                                                                `/details/${
                                                                    rec.media_type ||
                                                                    (rec.first_air_date ? "tv" : "movie")
                                                                }/${rec.id}`
                                                            )
                                                        }
                                                        className="cursor-pointer group"
                                                    >
                                                        <img
                                                            src={
                                                                rec.poster_path
                                                                    ? `${IMG_BASE}${rec.poster_path}`
                                                                    : "https://via.placeholder.com/300x450?text=No+Image"
                                                            }
                                                            alt={rec.title || rec.name}
                                                            className="rounded-2xl w-full group-hover:scale-110 transition-transform duration-300 shadow-2xl border-2 border-white/20"
                                                            onError={(e) => {
                                                                e.target.src = "https://via.placeholder.com/300x450?text=No+Image";
                                                            }}
                                                        />
                                                        <p className={`text-sm font-black mt-3 tracking-wide group-hover:text-red-400 transition-colors ${
                                                            isDark ? "text-white" : "text-gray-900"
                                                        }`}>
                                                            {rec.title || rec.name}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={`text-center py-16 text-xl font-bold tracking-wide ${
                                                isDark ? "text-gray-400" : "text-gray-600"
                                            }`}>🎭 No recommendations available for this title</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailsPage;