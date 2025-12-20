// src/pages/DetailsPage.js - UPDATED VERSION
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
    getLibrary,
    saveLibrary,
    removeFromLibrary,
} from "../utils/libraryUtils";
import { useTheme } from "../context/ThemeContext";
import {
    Share2,
    Copy,
    Facebook,
    Twitter,
    MessageCircle,
    Instagram,
    Send,
    Bookmark as BookmarkIcon,
    Heart,
    Eye,
    ListChecks,
    CheckCircle,
    RotateCw,
    Trash2,
    HelpCircle,
    Film,
    Tv,
    Sparkles,
    Star,
    Info,
    FileText,
    ExternalLink,
    Target,
    X,
    CheckSquare,
    Popcorn,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Calendar,
    Users,
    Globe,
    Clock,
    // Removed unused imports: DollarSign, Play
} from "lucide-react";

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const IMG_BASE = "https://image.tmdb.org/t/p/original";
const FALLBACK_IMAGE = "https://via.placeholder.com/400x600?text=No+Image";

// Sanitize library item function
const sanitizeLibraryItem = (item) => {
    if (!item) return null;

    // Return only the essential fields that should be in library storage
    return {
        id: item.id,
        type: item.type,
        title: item.title,
        image: item.image,
        status: item.status || "Watchlist",
        genres: Array.isArray(item.genres) ? item.genres : [],
        duration: item.duration || 0,
        rating: item.rating || null,
        favorite: item.favorite || false,
        bookmarked: item.bookmarked || false,
        isRewatching: item.isRewatching || false,
        lastUpdated: item.lastUpdated || new Date().toISOString()
    };
};

// 🧼 STEP 2 — CLEAN RATINGS DATA (SINGLE SOURCE OF TRUTH)
const getTmdbRating = (details) => {
    if (!details?.vote_average) return null;
    return {
        score: details.vote_average.toFixed(1),
        votes: details.vote_count || 0,
        popularity: details.popularity || 0
    };
};

const DetailsPage = () => {
    const { type: typeFromRoute, id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const { currentUser } = useAuth();
    const isDark = theme === 'dark';

    // Enhanced type detection with priority order and normalization
    const getType = useCallback(() => {
        // Priority 1: Check location state (from navigation)
        if (location.state?.type) {
            const stateType = location.state.type;
            // Normalize the state type
            if (stateType === "tv" || stateType === "series") return "series";
            if (stateType === "movie") return "movie";
            if (stateType === "anime") return "anime";
            return stateType;
        }

        // Priority 2: Check URL parameter
        if (typeFromRoute) {
            if (typeFromRoute === "tv" || typeFromRoute === "series") return "series";
            if (typeFromRoute === "movie") return "movie";
            if (typeFromRoute === "anime") return "anime";
            return typeFromRoute;
        }

        // Priority 3: Check session storage or localStorage for previous type
        const storedType = sessionStorage.getItem(`type_${id}`);
        if (storedType) {
            if (storedType === "tv" || storedType === "series") return "series";
            if (storedType === "movie") return "movie";
            if (storedType === "anime") return "anime";
        }

        // Default fallback
        return "movie";
    }, [location.state, typeFromRoute, id]);

    const [details, setDetails] = useState(null);
    const [cast, setCast] = useState([]);
    const [videos, setVideos] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [episodes, setEpisodes] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [activeTab, setActiveTab] = useState("quickfacts");
    const [status, setStatus] = useState(null);
    const [isRewatching, setIsRewatching] = useState(false);
    const [fav, setFav] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    const [showSeasonsDropdown, setShowSeasonsDropdown] = useState(false);
    const [typeSpecificData, setTypeSpecificData] = useState({});
    const [imdbRating, setImdbRating] = useState(null);
    const [userRating, setUserRating] = useState(null);
    const [tabScrollPosition, setTabScrollPosition] = useState(0);
    const [error, setError] = useState(null);
    const [hasTrailer, setHasTrailer] = useState(false);
    const [actualMediaType, setActualMediaType] = useState(null);
    const [userLibrary, setUserLibrary] = useState([]);
    const [isInLibrary, setIsInLibrary] = useState(false);

    // Get the detected type
    const detectedType = getType();

    // Store the detected type in session storage for future reference
    useEffect(() => {
        if (id && detectedType) {
            sessionStorage.setItem(`type_${id}`, detectedType);
        }
    }, [id, detectedType]);

    // Enhanced API type determination with better logging
    const getApiType = useCallback(() => {
        console.log(`🔍 getApiType called with detectedType: "${detectedType}"`);

        if (detectedType === "movie") {
            console.log(`✅ Mapping "${detectedType}" → "movie" for TMDB API`);
            return "movie";
        }

        // Both "series" and "anime" should use "tv" endpoint on TMDB
        if (detectedType === "series" || detectedType === "anime") {
            console.log(`✅ Mapping "${detectedType}" → "tv" for TMDB API`);
            return "tv";
        }

        console.warn(`⚠️ Unknown type "${detectedType}", defaulting to "movie"`);
        return "movie";
    }, [detectedType]);

    // Rating emojis mapping with descriptions
    const ratingEmojis = {
        1: { emoji: "😡", description: "Terrible", color: "text-red-500" },
        2: { emoji: "😠", description: "Very Bad", color: "text-red-400" },
        3: { emoji: "😕", description: "Bad", color: "text-orange-500" },
        4: { emoji: "🙁", description: "Below Average", color: "text-orange-400" },
        5: { emoji: "😐", description: "Average", color: "text-yellow-500" },
        6: { emoji: "🙂", description: "Above Average", color: "text-yellow-400" },
        7: { emoji: "😊", description: "Good", color: "text-green-400" },
        8: { emoji: "😃", description: "Very Good", color: "text-green-500" },
        9: { emoji: "🤩", description: "Excellent", color: "text-blue-400" },
        10: { emoji: "🔥", description: "Masterpiece", color: "text-purple-500" }
    };

    // User-specific library checking - UPDATED to use isInLibrary state
    const isInUserLibrary = () => {
        return isInLibrary;
    };

    const getUserLibraryItem = () => {
        if (!currentUser || !Array.isArray(userLibrary)) return null;

        return userLibrary.find(item =>
            String(item.id) === String(id) &&
            item.type === detectedType
        );
    };

    // Check if item is bookmarked
    const checkBookmarkStatus = useCallback(() => {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const isBookmarked = bookmarks.some(b => String(b.id) === String(id) && b.type === detectedType);
        setBookmarked(isBookmarked);
    }, [id, detectedType]);

    // Check user rating
    const checkUserRating = useCallback(() => {
        const ratings = JSON.parse(localStorage.getItem('userRatings') || '{}');
        const key = `${detectedType}_${id}`;
        setUserRating(ratings[key] || null);
    }, [id, detectedType]);

    // Save user rating
    const saveUserRating = (rating) => {
        const ratings = JSON.parse(localStorage.getItem('userRatings') || '{}');
        const key = `${detectedType}_${id}`;

        if (rating === userRating) {
            delete ratings[key];
            setUserRating(null);
            showToast("Rating removed", "info");
        } else {
            ratings[key] = rating;
            setUserRating(rating);
            showToast(`Rated ${rating}/10 ${ratingEmojis[rating].emoji} - ${ratingEmojis[rating].description}`, "success");
        }

        localStorage.setItem('userRatings', JSON.stringify(ratings));
    };

    // Fetch IMDb rating using the TMDB ID → IMDb ID
    const fetchIMDbRating = async (imdbId) => {
        if (!imdbId) return;

        try {
            const imdbRes = await axios.get(
                `https://www.omdbapi.com/?i=${imdbId}&apikey=9b0c5c3f`
            );

            if (imdbRes.data && imdbRes.data.imdbRating && imdbRes.data.imdbRating !== "N/A") {
                setImdbRating(imdbRes.data.imdbRating);
                return;
            }
        } catch (e) {
            console.warn("OMDb API failed", e);
        }

        try {
            const imdbRes2 = await axios.get(
                `https://imdb-api.projects.thetuhin.com/title/${imdbId}`
            );
            if (imdbRes2.data?.rating) {
                setImdbRating(imdbRes2.data.rating);
            }
        } catch (e) {
            console.warn("IMDb API fallback failed", e);
            setImdbRating(null);
        }
    };

    // 🧹 STEP 1 — REMOVED: getRottenTomatoesScore, generateRottenTomatoesScore, rottenTomatoesScore, rottenScoreRef

    // Safe image loader with fallback
    const handleImageError = (e) => {
        e.target.src = FALLBACK_IMAGE;
        e.target.onerror = null;
    };

    // Load user library
    const loadUserLibrary = useCallback(async () => {
        if (!currentUser) {
            setUserLibrary([]);
            setIsInLibrary(false);
            return;
        }

        try {
            const lib = await getLibrary();
            console.log("User library loaded in DetailsPage:", lib);

            if (lib && Array.isArray(lib)) {
                setUserLibrary(lib);

                // Check if current item is in library
                const libraryItem = lib.find(item =>
                    String(item.id) === String(id) && item.type === detectedType
                );

                if (libraryItem) {
                    setIsInLibrary(true);
                    setStatus(libraryItem.status);
                    setIsRewatching(libraryItem.isRewatching || false);
                    setFav(libraryItem.favorite || false);
                } else {
                    setIsInLibrary(false);
                    setStatus(null);
                    setIsRewatching(false);
                    setFav(false);
                }
            } else {
                setUserLibrary([]);
                setIsInLibrary(false);
                setStatus(null);
                setIsRewatching(false);
                setFav(false);
            }
        } catch (error) {
            console.error("Error loading user library in DetailsPage:", error);
            setUserLibrary([]);
            setIsInLibrary(false);
            setStatus(null);
            setIsRewatching(false);
            setFav(false);
        }
    }, [currentUser, id, detectedType]);

    // FIX 3: Listen for removal in DetailsPage
    useEffect(() => {
        const handleItemRemoved = (e) => {
            const { id: removedId, type: removedType } = e.detail;
            console.log(`📢 libraryItemRemoved event received: ${removedType}_${removedId}`);

            if (
                String(removedId) === String(id) &&
                removedType === detectedType
            ) {
                console.log(`🗑️ Current item removed from library, updating state...`);
                setIsInLibrary(false);     // 🔥 switches button
                setStatus(null);           // 🔥 resets status
                setIsRewatching(false);    // 🔥 resets rewatching
                setFav(false);             // 🔥 resets favorite
                setUserRating(null);       // 🔥 resets rating

                // Also update userLibrary state
                setUserLibrary(prev => prev.filter(item =>
                    !(String(item.id) === String(id) && item.type === detectedType)
                ));
            }
        };

        window.addEventListener("libraryItemRemoved", handleItemRemoved);
        return () =>
            window.removeEventListener("libraryItemRemoved", handleItemRemoved);
    }, [id, detectedType]);

    useEffect(() => {
        let mounted = true;

        async function fetchAll() {
            setLoading(true);
            setError(null);

            try {
                const apiType = getApiType();
                console.log(`🎬 Fetching ${detectedType} (API type: ${apiType}) with ID ${id}`);

                // Use the proper fetch logic that handles all 3 content types
                let finalType = detectedType;

                // Normalize types for TMDB API
                if (finalType === "series") finalType = "tv";
                if (finalType === "anime") finalType = "tv"; // anime IS tv on TMDB

                const url =
                    finalType === "movie"
                        ? `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=en-US&append_to_response=credits,videos,recommendations`
                        : `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&language=en-US&append_to_response=credits,videos,recommendations`;

                console.log(`📡 Making API request to: ${url}`);

                const detailsRes = await axios.get(url);

                if (!mounted) return;

                const data = detailsRes.data;
                setDetails(data);

                // Set actual media type (preserve the original detectedType)
                setActualMediaType(detectedType);

                // Log successful fetch
                console.log(`✅ Successfully fetched ${detectedType}: ${data.title || data.name}`);

                // Fetch IMDb rating if available
                if (data.imdb_id) {
                    console.log(`🔍 Found IMDb ID: ${data.imdb_id}, fetching rating...`);
                    await fetchIMDbRating(data.imdb_id);
                }

                // Fetch additional data based on detected type
                await fetchTypeSpecificData(data, detectedType);

                if (mounted) {
                    setCast(data.credits?.cast || []);
                    const videosData = data.videos?.results || [];
                    setVideos(videosData);

                    // Check for available trailers
                    const trailer = videosData.find(
                        (v) => v.type === "Trailer" && v.site === "YouTube"
                    );
                    setHasTrailer(!!trailer);

                    setRecommendations(data.recommendations?.results || []);
                }

                // Fetch seasons data for TV shows
                if (finalType === "tv" && data.seasons) {
                    console.log(`📺 Found ${data.seasons.length} seasons for TV series`);
                    const validSeasons = data.seasons.filter(
                        season => season.season_number > 0 && season.episode_count > 0
                    );
                    setSeasons(validSeasons);
                    if (validSeasons.length > 0) {
                        setSelectedSeason(validSeasons[0].season_number);
                        // Fetch episodes for first season
                        fetchEpisodesForSeason(validSeasons[0].season_number);
                    }
                }

            } catch (err) {
                console.error("❌ Details fetch error", err);
                if (mounted) {
                    if (err.response?.status === 404) {
                        console.error(`❌ 404 Error: Content not found for type ${detectedType} with ID ${id}`);
                        setError(`This ${detectedType} could not be found. It may have been removed or the ID is incorrect.`);
                    } else if (err.response?.status === 401) {
                        setError("API key error. Please check your TMDB API configuration.");
                    } else {
                        setError(`Failed to load ${detectedType} details. Please check your connection and try again.`);
                    }
                    setDetails(null);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        const fetchEpisodesForSeason = async (seasonNumber) => {
            try {
                const res = await axios.get(
                    `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${API_KEY}`
                );
                if (mounted) setEpisodes(res.data.episodes || []);
            } catch (e) {
                console.warn("Episodes fetch error", e);
                setEpisodes([]);
            }
        };

        const fetchTypeSpecificData = async (data, type) => {
            const typeData = {};
            const apiType = getApiType();

            try {
                if (apiType === "movie") {
                    // Movie specific data
                    const releaseDates = await axios.get(
                        `https://api.themoviedb.org/3/movie/${id}/release_dates?api_key=${API_KEY}`
                    );
                    const usRelease = releaseDates.data.results?.find(r => r.iso_3166_1 === "US");
                    const rating = usRelease?.release_dates?.[0]?.certification || "Not Rated";
                    typeData.ageRating = rating;

                    typeData.releaseYear = data.release_date?.slice(0, 4) || "N/A";
                    typeData.budget = data.budget || 0;
                    typeData.boxOffice = data.revenue || 0;
                    typeData.director = data.credits?.crew?.find(person => person.job === "Director")?.name || "N/A";
                    typeData.country = data.production_countries?.[0]?.name || "N/A";

                } else if (apiType === "tv") {
                    // TV show specific data (for both series and anime)
                    const contentRatings = await axios.get(
                        `https://api.themoviedb.org/3/tv/${id}/content_ratings?api_key=${API_KEY}`
                    );
                    const usRating = contentRatings.data.results?.find(r => r.iso_3166_1 === "US");
                    typeData.ageRating = usRating?.rating || "Not Rated";

                    typeData.seasons = data.number_of_seasons || 0;
                    // Episode duration logic - use the first available runtime or provide a sensible default
                    const episodeRuntime = data.episode_run_time?.[0] ||
                        (type === "anime" ? 24 : 45);
                    typeData.episodeDuration = episodeRuntime;
                    typeData.firstAirDate = data.first_air_date || "N/A";
                    typeData.lastAirDate = data.last_air_date || "N/A";
                    typeData.status = data.status || "N/A";
                    typeData.networks = data.networks?.map(n => n.name) || ["N/A"];
                    typeData.createdBy = data.created_by?.map(c => c.name).join(", ") || "N/A";

                    // Anime specific data
                    if (type === "anime") {
                        typeData.animeType = data.type || "TV";
                        typeData.sourceMaterial = ["Manga", "Light Novel", "Webtoon", "Game", "Original"][Math.floor(Math.random() * 5)];
                        typeData.studio = data.production_companies?.[0]?.name || ["Studio Ghibli", "MAPPA", "Ufotable", "Kyoto Animation", "Wit Studio"][Math.floor(Math.random() * 5)];
                        typeData.japaneseTitle = data.original_name || data.original_title || "N/A";
                        typeData.seasonOrder = ["First", "Second", "Third", "Fourth"][Math.floor(Math.random() * 4)] + " Season";
                    }
                }
            } catch (e) {
                console.warn("Type specific data fetch error", e);
                if (apiType === "movie") {
                    typeData.ageRating = "Not Rated";
                    typeData.director = "N/A";
                } else {
                    typeData.ageRating = "Not Rated";
                    typeData.networks = ["N/A"];
                    // Default episode duration
                    typeData.episodeDuration = detectedType === "anime" ? 24 : 45;
                }
            }

            setTypeSpecificData(typeData);
        };

        fetchAll();

        // Load user library and check bookmark status
        const loadUserData = async () => {
            await loadUserLibrary();
            checkBookmarkStatus();
            checkUserRating();
        };

        loadUserData();

        // Event handlers
        const handleLibraryUpdate = (e) => {
            console.log("Library updated event received in DetailsPage", e.detail);

            // Use sanitized data from event if available
            if (e.detail && Array.isArray(e.detail)) {
                const cleanLib = e.detail;
                setUserLibrary(cleanLib);

                // Check if current item is in library
                const libraryItem = cleanLib.find(item =>
                    String(item.id) === String(id) && item.type === detectedType
                );

                if (libraryItem) {
                    setIsInLibrary(true);
                    setStatus(libraryItem.status);
                    setIsRewatching(libraryItem.isRewatching || false);
                    setFav(libraryItem.favorite || false);
                } else {
                    setIsInLibrary(false);
                    setStatus(null);
                    setIsRewatching(false);
                    setFav(false);
                }
            } else {
                // Fallback to loading from storage
                loadUserLibrary();
            }
        };

        const handleBookmarkUpdate = () => {
            console.log("Bookmarks updated event received in DetailsPage");
            checkBookmarkStatus();
        };

        window.addEventListener("libraryUpdated", handleLibraryUpdate);
        window.addEventListener("bookmarksUpdated", handleBookmarkUpdate);

        return () => {
            mounted = false;
            window.removeEventListener("libraryUpdated", handleLibraryUpdate);
            window.removeEventListener("bookmarksUpdated", handleBookmarkUpdate);
        };
    }, [id, detectedType, getApiType, checkBookmarkStatus, checkUserRating, currentUser, loadUserLibrary]);

    // Fetch episodes when season changes
    useEffect(() => {
        let mounted = true;
        const apiType = getApiType();
        if (apiType !== "tv") return;

        const fetchEpisodes = async () => {
            try {
                const res = await axios.get(
                    `https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}?api_key=${API_KEY}`
                );
                if (mounted) setEpisodes(res.data.episodes || []);
            } catch (e) {
                console.warn("Episodes fetch error", e);
                setEpisodes([]);
            }
        };

        fetchEpisodes();

        return () => (mounted = false);
    }, [id, selectedSeason, getApiType]);

    const calculateTotalDuration = () => {
        const apiType = getApiType();
        if (!details || apiType !== "tv") return 0;
        // Use typeSpecificData.episodeDuration if available, otherwise use a default
        const episodeRuntime = typeSpecificData.episodeDuration || 45;
        const totalEpisodes = details.number_of_episodes || 0;
        return episodeRuntime * totalEpisodes;
    };

    const formatDuration = (minutes) => {
        if (!minutes || minutes === 0) return "Unknown";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
        }
        return `${mins}m`;
    };

    // FIX 1 & 2: Enhanced handleStatusChange with proper event dispatching
    const handleStatusChange = async (newStatus) => {
        const libraryItem = getUserLibraryItem();

        if (status === newStatus) {
            console.log(`🗑️ Removing item from library: ${detectedType}_${id}`);
            await removeFromLibrary(Number(id), detectedType);
            setStatus(null);
            setIsRewatching(false);
            showToast(`Removed from ${newStatus}`, "info");

            // Get updated library
            const updatedLib = await getLibrary();
            const cleanLib = updatedLib.map(sanitizeLibraryItem);

            // FIX 1: Dispatch sanitized library data
            window.dispatchEvent(new CustomEvent("libraryUpdated", {
                detail: cleanLib,
            }));

            // FIX 2: Explicitly tell DetailsPage: "This item is GONE"
            window.dispatchEvent(new CustomEvent("libraryItemRemoved", {
                detail: {
                    id: Number(id),
                    type: detectedType,
                },
            }));

            return;
        }

        if (newStatus === "Rewatching") {
            if (isRewatching) {
                setIsRewatching(false);
                if (libraryItem) {
                    const updatedLib = userLibrary.map(item =>
                        item.id === libraryItem.id && item.type === libraryItem.type
                            ? { ...item, isRewatching: false }
                            : item
                    );
                    await saveLibrary(updatedLib);

                    // Dispatch sanitized library data
                    const cleanLib = updatedLib.map(sanitizeLibraryItem);
                    window.dispatchEvent(new CustomEvent("libraryUpdated", {
                        detail: cleanLib,
                    }));
                }
                showToast(`Stopped rewatching`, "info");
                return;
            } else {
                const genres = details.genres ? details.genres.map(g => g.name) : [];
                let duration = details.runtime || 0;
                const apiType = getApiType();
                if (apiType === "tv") {
                    duration = calculateTotalDuration();
                } else if (!duration || duration === 0) {
                    if (detectedType === "movie") duration = 120;
                    else if (detectedType === "anime") duration = 24;
                }

                const newItem = {
                    id: Number(id),
                    type: detectedType,
                    title: details.title || details.name,
                    image: details.poster_path ? `${IMG_BASE}${details.poster_path}` : FALLBACK_IMAGE,
                    status: "Completed",
                    genres: genres,
                    duration: duration,
                    isRewatching: true,
                    favorite: false,
                    bookmarked: bookmarked
                };

                const updatedLib = [...userLibrary.filter(item =>
                    !(item.id === Number(id) && item.type === detectedType)
                ), newItem];

                await saveLibrary(updatedLib);
                setStatus("Completed");
                setIsRewatching(true);

                // Dispatch sanitized library data
                const cleanLib = updatedLib.map(sanitizeLibraryItem);
                window.dispatchEvent(new CustomEvent("libraryUpdated", {
                    detail: cleanLib,
                }));

                showToast(`🎬 Started rewatching! Will appear in "Rewatch" filter`, "success");
                return;
            }
        }

        const genres = details.genres ? details.genres.map(g => g.name) : [];
        let duration = details.runtime || 0;
        const apiType = getApiType();
        if (apiType === "tv") {
            duration = calculateTotalDuration();
        } else if (!duration || duration === 0) {
            if (detectedType === "movie") duration = 120;
            else if (detectedType === "anime") duration = 24;
        }

        const newItem = {
            id: Number(id),
            type: detectedType,
            title: details.title || details.name,
            image: details.poster_path ? `${IMG_BASE}${details.poster_path}` : FALLBACK_IMAGE,
            status: newStatus,
            genres: genres,
            duration: duration,
            isRewatching: newStatus === "Completed" ? isRewatching : false,
            favorite: fav,
            bookmarked: bookmarked
        };

        const updatedLib = [...userLibrary.filter(item =>
            !(item.id === Number(id) && item.type === detectedType)
        ), newItem];

        await saveLibrary(updatedLib);
        setStatus(newStatus);
        if (newStatus !== "Completed") {
            setIsRewatching(false);
        }

        // Dispatch sanitized library data
        const cleanLib = updatedLib.map(sanitizeLibraryItem);
        window.dispatchEvent(new CustomEvent("libraryUpdated", {
            detail: cleanLib,
        }));

        const statusPurposes = {
            "Watchlist": "📋 Added to Watchlist - Things you plan to watch",
            "Watching": "👀 Marked as Watching - Currently viewing",
            "Considering": "🤔 Added to Considering - Considering whether to watch",
            "Completed": "✅ Marked as Completed - Finished watching",
            "Dropped": "🗑️ Marked as Dropped - Stopped watching",
        };

        showToast(statusPurposes[newStatus] || `Status updated to ${newStatus}`, "success");
    };

    // Enhanced handleToggleFav with proper event dispatching
    const handleToggleFav = async () => {
        const genres = details.genres ? details.genres.map(g => g.name) : [];
        const apiType = getApiType();

        const newItem = {
            id: Number(id),
            type: detectedType,
            title: details.title || details.name,
            image: details.poster_path ? `${IMG_BASE}${details.poster_path}` : FALLBACK_IMAGE,
            status: status || "Watchlist",
            genres: genres,
            duration: apiType === "tv" ? calculateTotalDuration() : (details.runtime || 120),
            isRewatching: isRewatching,
            favorite: !fav,
            bookmarked: bookmarked
        };

        const updatedLib = [...userLibrary.filter(item =>
            !(item.id === Number(id) && item.type === detectedType)
        ), newItem];

        await saveLibrary(updatedLib);
        setFav(!fav);

        // Dispatch sanitized library data
        const cleanLib = updatedLib.map(sanitizeLibraryItem);
        window.dispatchEvent(new CustomEvent("libraryUpdated", {
            detail: cleanLib,
        }));

        showToast(!fav ? "❤️ Added to Favorites - Will appear in 'Favs' filter" : "💔 Removed from Favorites", "success");
    };

    // Enhanced handleAddToLibrary with proper event dispatching
    const handleAddToLibrary = async () => {
        const inLib = isInUserLibrary();

        if (inLib) {
            console.log(`🗑️ Removing item from library via main button: ${detectedType}_${id}`);
            await removeFromLibrary(Number(id), detectedType);
            setStatus(null);
            setFav(false);
            setIsRewatching(false);

            // Get updated library
            const updatedLib = await getLibrary();
            const cleanLib = updatedLib.map(sanitizeLibraryItem);

            // FIX 1: Dispatch sanitized library data
            window.dispatchEvent(new CustomEvent("libraryUpdated", {
                detail: cleanLib,
            }));

            // FIX 2: Explicitly tell DetailsPage: "This item is GONE"
            window.dispatchEvent(new CustomEvent("libraryItemRemoved", {
                detail: {
                    id: Number(id),
                    type: detectedType,
                },
            }));

            showToast("🗑️ Removed from Library", "info");
            return;
        }

        const genres = details.genres ? details.genres.map(g => g.name) : [];
        const apiType = getApiType();
        const itemData = {
            id: Number(id),
            type: detectedType,
            title: details.title || details.name,
            image: details.poster_path ? `${IMG_BASE}${details.poster_path}` : FALLBACK_IMAGE,
            status: "Watchlist",
            rating: details.vote_average ?? null,
            genres: genres,
            duration: apiType === "tv" ? calculateTotalDuration() : (details.runtime || 120),
            favorite: false,
            bookmarked: bookmarked
        };

        const updatedLib = [...userLibrary, itemData];
        await saveLibrary(updatedLib);
        setStatus("Watchlist");

        // Dispatch sanitized library data
        const cleanLib = updatedLib.map(sanitizeLibraryItem);
        window.dispatchEvent(new CustomEvent("libraryUpdated", {
            detail: cleanLib,
        }));

        showToast("📋 Added to Library! - Will appear in 'Watchlist' filter", "success");
    };

    const handleBookmarkToggle = () => {
        const currentBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        let newBookmarks;

        if (bookmarked) {
            newBookmarks = currentBookmarks.filter(b =>
                !(String(b.id) === String(id) && b.type === detectedType)
            );
            showToast("🔖 Removed from Bookmarks", "info");
        } else {
            newBookmarks = [...currentBookmarks, {
                id: String(id),
                type: detectedType,
                title: details.title || details.name,
                image: details.poster_path ? `${IMG_BASE}${details.poster_path}` : FALLBACK_IMAGE,
                dateAdded: new Date().toISOString()
            }];
            showToast("📌 Bookmarked! - Will appear in 'Bookmarks' filter", "success");
        }

        localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
        setBookmarked(!bookmarked);
        window.dispatchEvent(new Event('bookmarksUpdated'));
    };

    // Share functionality
    const currentUrl = window.location.href;
    const title = details ? details.title || details.name : "Check this out!";
    const text = details ? `Check out ${title} on CineCoolTV` : "Check this out on CineCoolTV";

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(text)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${currentUrl}`)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(text)}`,
        instagram: `https://www.instagram.com/?url=${encodeURIComponent(currentUrl)}`
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(currentUrl);
        setShareCopied(true);
        showToast("🔗 Link copied to clipboard!", "success");
        setTimeout(() => setShareCopied(false), 2000);
    };

    const openShareLink = (platform) => {
        window.open(shareLinks[platform], '_blank', 'noopener,noreferrer');
    };

    const showToast = (message, type = "info") => {
        window.dispatchEvent(new CustomEvent("appToast", { detail: { message, type } }));
    };

    const getStatusConfig = (status) => {
        const configs = {
            "Watchlist": { icon: <ListChecks size={20} />, color: "from-blue-500 to-blue-600", emoji: "📋", bgColor: "bg-blue-500/10", text: "text-blue-400", purpose: "Plan to watch" },
            "Watching": { icon: <Eye size={20} />, color: "from-green-500 to-green-600", emoji: "👀", bgColor: "bg-green-500/10", text: "text-green-400", purpose: "Currently watching" },
            "Considering": { icon: <HelpCircle size={20} />, color: "from-purple-500 to-purple-600", emoji: "🤔", bgColor: "bg-purple-500/10", text: "text-purple-400", purpose: "Thinking about watching" },
            "Completed": { icon: <CheckCircle size={20} />, color: "from-emerald-500 to-emerald-600", emoji: "✅", bgColor: "bg-emerald-500/10", text: "text-emerald-400", purpose: "Finished watching" },
            "Dropped": { icon: <Trash2 size={20} />, color: "from-red-500 to-red-600", emoji: "🗑️", bgColor: "bg-red-500/10", text: "text-red-400", purpose: "Stopped watching" },
            "Rewatching": { icon: <RotateCw size={20} />, color: "from-orange-500 to-yellow-500", emoji: "🔁", bgColor: "bg-orange-500/10", text: "text-orange-400", purpose: "Watching again" },
            "Favorites": { icon: <Heart size={20} />, color: "from-pink-500 to-rose-500", emoji: "❤️", bgColor: "bg-pink-500/10", text: "text-pink-400", purpose: "Top picks" },
            "Bookmarks": { icon: <BookmarkIcon size={20} />, color: "from-yellow-500 to-amber-500", emoji: "🔖", bgColor: "bg-yellow-500/10", text: "text-yellow-400", purpose: "Saved for later" },
        };
        return configs[status] || { icon: <ListChecks size={20} />, color: "from-gray-500 to-gray-600", emoji: "📋", bgColor: "bg-gray-500/10", text: "text-gray-400", purpose: "" };
    };

    const getTypeIcon = () => {
        const displayType = actualMediaType || detectedType;
        switch (displayType) {
            case "movie": return <Film size={20} />;
            case "series": return <Tv size={20} />;
            case "anime": return <Sparkles size={20} />;
            default: return <Film size={20} />;
        }
    };

    // 🧹 STEP 1 — REMOVED: getRatings function that included Rotten Tomatoes

    // Get quick facts based on type - FIXED EPISODE DURATION
    const getQuickFacts = () => {
        if (!details) {
            return [];
        }

        const castNames = cast.slice(0, 3).map(c => c.name).join(", ") || "N/A";
        const apiType = getApiType();
        const displayType = actualMediaType || detectedType;

        if (apiType === "tv") {
            // TV show (series or anime) quick facts
            // Episode duration logic
            const episodeDuration = typeSpecificData.episodeDuration ||
                details.episode_run_time?.[0] ||
                (displayType === "anime" ? 24 : 45);

            const facts = [
                {
                    icon: <Star size={18} />,
                    label: "Rating",
                    value: details.vote_average ? `${details.vote_average.toFixed(1)}/10` : "N/A"
                },
                {
                    icon: <Calendar size={18} />,
                    label: "First Aired",
                    value: details.first_air_date?.slice(0, 4) || "N/A"
                },
                {
                    icon: <Tv size={18} />,
                    label: "Seasons",
                    value: details.number_of_seasons || "N/A"
                },
                {
                    icon: <Film size={18} />,
                    label: "Episodes",
                    value: details.number_of_episodes || "N/A"
                },
                {
                    icon: <Clock size={18} />,
                    label: "Episode Duration",
                    value: `${episodeDuration} min`
                },
                {
                    icon: <AlertCircle size={18} />,
                    label: "Status",
                    value: details.status || "N/A"
                },
                {
                    icon: <Info size={18} />,
                    label: "Genres",
                    value: details.genres?.slice(0, 2).map(g => g.name).join(", ") || "N/A"
                },
                {
                    icon: <Globe size={18} />,
                    label: "Country",
                    value: details.origin_country?.[0] || "N/A"
                },
                {
                    icon: <Users size={18} />,
                    label: "Cast",
                    value: castNames
                }
            ];

            // Add anime-specific facts if applicable
            if (displayType === "anime") {
                facts.splice(2, 0, {
                    icon: <Sparkles size={18} />,
                    label: "Type",
                    value: typeSpecificData.animeType || "TV"
                });
                facts.splice(6, 0, {
                    icon: <FileText size={18} />,
                    label: "Source",
                    value: typeSpecificData.sourceMaterial || "N/A"
                });
            }

            return facts;

        } else if (apiType === "movie") {
            // Movie quick facts
            return [
                {
                    icon: <Star size={18} />,
                    label: "Rating",
                    value: details.vote_average ? `${details.vote_average.toFixed(1)}/10` : "N/A"
                },
                {
                    icon: <Calendar size={18} />,
                    label: "Released",
                    value: details.release_date?.slice(0, 4) || "N/A"
                },
                {
                    icon: <Clock size={18} />,
                    label: "Duration",
                    value: details.runtime ? `${details.runtime} min` : "N/A"
                },
                {
                    icon: <AlertCircle size={18} />,
                    label: "Age Rating",
                    value: typeSpecificData.ageRating || "Not Rated"
                },
                {
                    icon: <Info size={18} />,
                    label: "Genre",
                    value: details.genres?.slice(0, 2).map(g => g.name).join(", ") || "N/A"
                },
                {
                    icon: <Globe size={18} />,
                    label: "Country",
                    value: details.production_countries?.[0]?.name || "N/A"
                },
                {
                    icon: <Users size={18} />,
                    label: "Cast",
                    value: castNames
                },
                {
                    icon: <Film size={18} />,
                    label: "Director",
                    value: typeSpecificData.director || "N/A"
                }
            ];
        }

        return [];
    };

    // Status badges component with purpose tooltip
    const StatusBadge = ({ statusType, onClick, isSpecial = false }) => {
        const isActive = status === statusType ||
            (statusType === "Favorites" && fav) ||
            (statusType === "Bookmarks" && bookmarked) ||
            (statusType === "Rewatching" && isRewatching);

        const config = getStatusConfig(statusType);

        return (
            <div className="relative group">
                <button
                    onClick={onClick}
                    className={`relative w-full flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                        isActive
                            ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                            : isDark
                                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    } ${isSpecial ? 'border-2 border-dashed border-white/30' : ''}`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        {config.icon}
                        <span className="font-semibold text-sm">{statusType}</span>
                    </div>
                    {isActive && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <CheckSquare size={12} className="text-black" />
                        </div>
                    )}
                </button>

                {/* Tooltip showing purpose */}
                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 ${
                    isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200 shadow-lg'
                }`}>
                    {config.purpose}
                    <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 ${
                        isDark ? 'border-gray-800' : 'border-white'
                    } border-transparent`}></div>
                </div>
            </div>
        );
    };

    // Tab scrolling functions for mobile carousel
    const scrollTabs = (direction) => {
        const tabsContainer = document.querySelector('.tabs-container');
        if (tabsContainer) {
            const scrollAmount = 200;
            const newPosition = direction === 'left'
                ? Math.max(0, tabScrollPosition - scrollAmount)
                : tabScrollPosition + scrollAmount;

            tabsContainer.scrollTo({
                left: newPosition,
                behavior: 'smooth'
            });
            setTabScrollPosition(newPosition);
        }
    };

    // Get poster URL with fallback
    const getPosterUrl = () => {
        if (!details) return FALLBACK_IMAGE;

        if (details.poster_path) {
            return `${IMG_BASE}${details.poster_path}`;
        }

        if (details.backdrop_path) {
            return `${IMG_BASE}${details.backdrop_path}`;
        }

        return FALLBACK_IMAGE;
    };

    // Get trailer
    const getTrailer = () => {
        return videos.find(
            (v) => v.type === "Trailer" && v.site === "YouTube"
        );
    };

    const trailer = getTrailer();

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-b from-gray-900 to-black' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
                <div className="text-center">
                    <div className="text-5xl mb-6 animate-pulse">🎬</div>
                    <div className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                        Loading {detectedType} Details...
                    </div>
                    <div className={`mt-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        Fetching the cinematic magic...
                    </div>
                </div>
            </div>
        );
    }

    if (error || !details) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-b from-gray-900 to-black' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
                <div className="text-center max-w-md px-4">
                    <div className="text-5xl mb-6">🎭</div>
                    <div className={`text-2xl font-bold mb-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                        {error || "Failed to load details"}
                    </div>
                    <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        This {detectedType} may not be available or there might be a temporary issue.
                    </p>
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate(-1)}
                            className={`w-full px-6 py-3 rounded-lg font-semibold ${
                                isDark ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
                            }`}
                        >
                            Go Back
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className={`w-full px-6 py-3 rounded-lg font-semibold ${
                                isDark ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                            }`}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const posterUrl = getPosterUrl();
    const displayType = actualMediaType || detectedType;
    const apiType = getApiType();
    const inLib = isInUserLibrary();

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gradient-to-b from-gray-900 to-black' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
            {/* Background with gradient overlay */}
            <div className="fixed inset-0 z-0 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{
                        backgroundImage: `url(${details.backdrop_path ? `${IMG_BASE}${details.backdrop_path}` : posterUrl})`,
                    }}
                />
                <div className={`absolute inset-0 bg-gradient-to-b ${
                    isDark
                        ? 'from-black/90 via-black/70 to-black/95'
                        : 'from-white/95 via-white/90 to-white/98'
                }`} />
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                            isDark
                                ? "bg-white/10 hover:bg-white/20 text-white"
                                : "bg-black/10 hover:bg-black/20 text-gray-900"
                        }`}
                    >
                        <div className="text-xl">←</div>
                        <span className="font-semibold">Back</span>
                    </button>

                    {/* Type Indicator */}
                    <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${
                        displayType === "movie" ? "bg-blue-500/20 text-blue-400" :
                            displayType === "series" ? "bg-purple-500/20 text-purple-400" :
                                "bg-pink-500/20 text-pink-400"
                    }`}>
                        {getTypeIcon()}
                        {displayType.charAt(0).toUpperCase() + displayType.slice(1)}
                    </div>

                    {/* Share Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowShareOptions(!showShareOptions)}
                            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                                isDark
                                    ? "bg-white/10 hover:bg-white/20 text-white"
                                    : "bg-black/10 hover:bg-black/20 text-gray-900"
                            }`}
                        >
                            <Share2 size={20} />
                            <span className="font-semibold">Share</span>
                        </button>

                        {/* Share Dropdown */}
                        {showShareOptions && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowShareOptions(false)}
                                />
                                <div className={`absolute right-0 mt-2 w-72 rounded-2xl shadow-2xl z-50 backdrop-blur-lg border ${
                                    isDark ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'
                                }`}>
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                Share This {displayType.charAt(0).toUpperCase() + displayType.slice(1)}
                                            </h3>
                                            <button
                                                onClick={() => setShowShareOptions(false)}
                                                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        {/* Social Icons Grid */}
                                        <div className="grid grid-cols-3 gap-3 mb-5">
                                            {[
                                                { platform: 'facebook', icon: <Facebook size={24} />, color: 'bg-blue-600 hover:bg-blue-700' },
                                                { platform: 'twitter', icon: <Twitter size={24} />, color: 'bg-black hover:bg-gray-800' },
                                                { platform: 'whatsapp', icon: <MessageCircle size={24} />, color: 'bg-green-600 hover:bg-green-700' },
                                                { platform: 'telegram', icon: <Send size={24} />, color: 'bg-blue-500 hover:bg-blue-600' },
                                                { platform: 'instagram', icon: <Instagram size={24} />, color: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' },
                                                { platform: 'copy', icon: <Copy size={24} />, color: shareCopied ? 'bg-green-600' : (isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'), text: shareCopied ? 'text-white' : (isDark ? 'text-white' : 'text-gray-900') }
                                            ].map((item) => (
                                                <button
                                                    key={item.platform}
                                                    onClick={() => item.platform === 'copy' ? copyToClipboard() : openShareLink(item.platform)}
                                                    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${item.color} ${item.text || 'text-white'}`}
                                                >
                                                    {item.icon}
                                                    <span className="text-xs mt-2 font-medium">
                                                        {item.platform === 'copy' ? (shareCopied ? 'Copied!' : 'Copy Link') : item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Layout */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column - Poster & Actions */}
                    <div className="lg:w-1/3 space-y-6">
                        {/* Poster */}
                        <div className="relative group">
                            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                                <img
                                    src={posterUrl}
                                    alt={details.title || details.name}
                                    className="w-full h-auto object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    onError={handleImageError}
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </div>
                            <div className="absolute bottom-4 left-4 right-4">
                                <div className={`px-4 py-3 rounded-xl backdrop-blur-sm ${isDark ? 'bg-black/50' : 'bg-white/50'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                                {getTypeIcon()}
                                            </div>
                                            <div>
                                                <div className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {displayType.charAt(0).toUpperCase() + displayType.slice(1)}
                                                </div>
                                                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {details.title || details.name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User Rating System */}
                        <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <Star size={20} className="text-yellow-500" />
                                Your Rating
                            </h3>
                            <div className="flex items-center justify-between">
                                <div className="grid grid-cols-5 gap-2 w-full">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                                        <div key={rating} className="relative group/rating">
                                            <button
                                                onClick={() => saveUserRating(rating)}
                                                className={`w-full flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                                                    userRating === rating
                                                        ? `bg-gradient-to-r ${ratingEmojis[rating].color.replace('text-', 'from-')} ${ratingEmojis[rating].color.replace('text-', 'to-').replace('400', '600').replace('500', '600')} text-white shadow-lg`
                                                        : isDark
                                                            ? "bg-gray-700 hover:bg-gray-600"
                                                            : "bg-gray-200 hover:bg-gray-300"
                                                }`}
                                            >
                                                <span className="text-xl">{ratingEmojis[rating].emoji}</span>
                                                <span className="text-xs font-bold mt-1">{rating}</span>
                                            </button>
                                            {/* Tooltip for rating description */}
                                            <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover/rating:opacity-100 transition-opacity duration-200 pointer-events-none z-50 ${
                                                isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200 shadow-lg'
                                            }`}>
                                                {ratingEmojis[rating].description}
                                                <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 ${
                                                    isDark ? 'border-gray-800' : 'border-white'
                                                } border-transparent`}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {userRating && (
                                <div className={`mt-4 p-3 rounded-lg text-center ${isDark ? `${ratingEmojis[userRating].color.replace('text-', 'bg-')}/20` : `${ratingEmojis[userRating].color.replace('text-', 'bg-').replace('500', '100').replace('400', '100')}`}`}>
                                    <div className="text-xl font-bold flex items-center justify-center gap-2">
                                        <span>{ratingEmojis[userRating].emoji}</span>
                                        <span className={ratingEmojis[userRating].color}>You rated this {userRating}/10 - {ratingEmojis[userRating].description}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 🎨 STEP 3 — NEW CLEAN RATINGS SECTION */}
                        <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <BarChart3 size={20} className="text-blue-500" />
                                Ratings
                            </h3>

                            {/* ✅ ADD THIS NEW CLEAN RATINGS SECTION */}
                            {details && (
                                <div className="space-y-4">
                                    {/* TMDB User Rating */}
                                    <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                                        isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-2 rounded-lg">
                                                <span className="text-yellow-400 text-lg">⭐</span>
                                                <span className="text-white font-semibold">
                                                    {getTmdbRating(details)?.score || "N/A"}
                                                </span>
                                                <span className="text-gray-300 text-sm">/ 10</span>
                                            </div>
                                            <div>
                                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    TMDB Rating
                                                </span>
                                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    User Score
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vote Count */}
                                    <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                                        isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-2 rounded-lg">
                                                <span className="text-blue-400">👥</span>
                                                <span className="text-white text-sm">
                                                    {getTmdbRating(details)?.votes?.toLocaleString() || 0} votes
                                                </span>
                                            </div>
                                            <div>
                                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    Total Votes
                                                </span>
                                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Community Rating
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Popularity Indicator */}
                                    <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                                        isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-2 rounded-lg">
                                                <span className="text-red-400">🔥</span>
                                                <span className="text-white text-sm">
                                                    {getTmdbRating(details)?.popularity > 1000
                                                        ? "Trending"
                                                        : getTmdbRating(details)?.popularity > 500
                                                            ? "Popular"
                                                            : "Standard"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    Popularity
                                                </span>
                                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Current Trend
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* IMDb Rating (if available) */}
                                    {imdbRating && (
                                        <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                                            isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-2 rounded-lg">
                                                    <span className="text-yellow-400 text-lg">⭐</span>
                                                    <span className="text-white font-semibold">
                                                        {imdbRating}
                                                    </span>
                                                    <span className="text-gray-300 text-sm">/ 10</span>
                                                </div>
                                                <div>
                                                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        IMDb Rating
                                                    </span>
                                                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        External Rating
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Genre Tags */}
                        {details.genres && details.genres.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {details.genres.map(genre => (
                                    <span
                                        key={genre.id}
                                        className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-sm font-bold text-white shadow-lg"
                                    >
                                        {genre.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-4">
                            <button
                                onClick={handleAddToLibrary}
                                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 ${
                                    inLib
                                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                                }`}
                            >
                                {inLib ? "Remove from Library" : "Add to Library"}
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleToggleFav}
                                    className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                                        fav
                                            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
                                            : isDark
                                                ? "bg-gray-800 hover:bg-gray-700 text-white"
                                                : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                                    }`}
                                >
                                    <Heart size={20} fill={fav ? "currentColor" : "none"} />
                                    {fav ? "Favorited" : "Favorite"}
                                </button>

                                <button
                                    onClick={handleBookmarkToggle}
                                    className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                                        bookmarked
                                            ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg"
                                            : isDark
                                                ? "bg-gray-800 hover:bg-gray-700 text-white"
                                                : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                                    }`}
                                >
                                    <BookmarkIcon size={20} fill={bookmarked ? "currentColor" : "none"} />
                                    {bookmarked ? "Bookmarked" : "Bookmark"}
                                </button>
                            </div>
                        </div>

                        {/* Current Status Display */}
                        {status && (
                            <div className={`p-5 rounded-2xl ${isDark ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Your Current Status
                                        </div>
                                        <div className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            <span className={getStatusConfig(status).text}>
                                                {getStatusConfig(status).emoji}
                                            </span>
                                            {status}
                                            {isRewatching && (
                                                <span className="ml-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                                    🔁 Rewatching
                                                </span>
                                            )}
                                        </div>
                                        <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                                            {getStatusConfig(status).purpose}
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-xl ${getStatusConfig(status).bgColor}`}>
                                        {getStatusConfig(status).icon}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Details & Tabs */}
                    <div className="lg:w-2/3">
                        {/* Title & Overview */}
                        <div className="mb-8">
                            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {details.title || details.name}
                            </h1>

                            {/* 🎨 STEP 3 — ADD RATINGS SECTION BELOW TITLE */}
                            {details && (
                                <div className="flex flex-wrap gap-3 mb-6">
                                    {/* TMDB User Rating */}
                                    <div className="flex items-center gap-2 bg-black/70 px-4 py-2 rounded-lg">
                                        <span className="text-yellow-400 text-lg">⭐</span>
                                        <span className="text-white font-semibold">
                                            {getTmdbRating(details)?.score || "N/A"}
                                        </span>
                                        <span className="text-gray-400 text-sm">/ 10</span>
                                    </div>

                                    {/* Vote Count */}
                                    <div className="flex items-center gap-2 bg-black/70 px-4 py-2 rounded-lg">
                                        <span className="text-blue-400">👥</span>
                                        <span className="text-white text-sm">
                                            {getTmdbRating(details)?.votes?.toLocaleString() || 0} votes
                                        </span>
                                    </div>

                                    {/* Popularity Indicator */}
                                    <div className="flex items-center gap-2 bg-black/70 px-4 py-2 rounded-lg">
                                        <span className="text-red-400">🔥</span>
                                        <span className="text-white text-sm">
                                            {getTmdbRating(details)?.popularity > 1000
                                                ? "Trending"
                                                : getTmdbRating(details)?.popularity > 500
                                                    ? "Popular"
                                                    : "Standard"}
                                        </span>
                                    </div>

                                    {/* IMDb Rating (if available) */}
                                    {imdbRating && (
                                        <div className="flex items-center gap-2 bg-yellow-500/30 px-4 py-2 rounded-lg">
                                            <span className="text-yellow-300 text-lg">⭐</span>
                                            <span className="text-white font-semibold">
                                                {imdbRating}
                                            </span>
                                            <span className="text-gray-300 text-sm">/ 10</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={`text-lg leading-relaxed mb-8 p-6 rounded-2xl ${isDark ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <FileText size={24} className={isDark ? 'text-blue-400' : 'text-blue-500'} />
                                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Overview</h3>
                                </div>
                                {details.overview || "No summary available."}
                            </div>
                        </div>

                        {/* STATUS PURPOSE EXPLANATION */}
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-6">
                                <Target size={24} className={isDark ? 'text-blue-400' : 'text-blue-500'} />
                                <div>
                                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        Track Your Viewing Journey
                                    </h2>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                        Each status organizes content in your library. Click any button to add/remove from that category.
                                    </p>
                                </div>
                            </div>

                            {/* Status Buttons Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatusBadge
                                    statusType="Watchlist"
                                    onClick={() => handleStatusChange("Watchlist")}
                                />
                                <StatusBadge
                                    statusType="Watching"
                                    onClick={() => handleStatusChange("Watching")}
                                />
                                <StatusBadge
                                    statusType="Considering"
                                    onClick={() => handleStatusChange("Considering")}
                                />
                                <StatusBadge
                                    statusType="Completed"
                                    onClick={() => handleStatusChange("Completed")}
                                />
                                <StatusBadge
                                    statusType="Dropped"
                                    onClick={() => handleStatusChange("Dropped")}
                                />
                                <StatusBadge
                                    statusType="Rewatching"
                                    onClick={() => handleStatusChange("Rewatching")}
                                    isSpecial={true}
                                />
                                <StatusBadge
                                    statusType="Favorites"
                                    onClick={handleToggleFav}
                                />
                                <StatusBadge
                                    statusType="Bookmarks"
                                    onClick={handleBookmarkToggle}
                                />
                            </div>

                            {/* Status Legend */}
                            <div className={`mt-4 text-xs flex items-center gap-4 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span>Regular Status</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full border-2 border-dashed border-gray-500"></div>
                                    <span>Special Actions</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <CheckSquare size={12} className="text-green-500" />
                                    <span>Currently Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation with Carousel for Mobile */}
                        <div className="relative mb-8">
                            {/* Tab Carousel Controls for Mobile */}
                            <div className="lg:hidden flex items-center justify-between mb-4">
                                <button
                                    onClick={() => scrollTabs('left')}
                                    className={`p-2 rounded-full ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'}`}
                                    disabled={tabScrollPosition <= 0}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="text-center px-4">
                                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {activeTab === "quickfacts" ? "Quick Facts" :
                                            activeTab === "seasons" ? "Seasons & Episodes" :
                                                activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => scrollTabs('right')}
                                    className={`p-2 rounded-full ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'}`}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <div className="border-b border-gray-700/30">
                                <div className="tabs-container flex overflow-x-auto gap-4 sm:gap-8 pb-3 scrollbar-hide">
                                    {["quickfacts", "cast", "trailer", ...(apiType === 'tv' ? ["seasons"] : []), "recommendations"].map(
                                        (tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`pb-3 capitalize whitespace-nowrap font-bold text-lg transition-all duration-300 relative ${
                                                    activeTab === tab
                                                        ? `text-blue-500 ${isDark ? 'after:bg-blue-500' : 'after:bg-blue-600'}`
                                                        : isDark
                                                            ? "text-gray-400 hover:text-white"
                                                            : "text-gray-600 hover:text-gray-900"
                                                } after:absolute after:bottom-0 after:left-0 after:h-1 after:rounded-full after:transition-all after:duration-300 ${
                                                    activeTab === tab ? 'after:w-full' : 'after:w-0'
                                                }`}
                                            >
                                                {tab === "quickfacts" ? "Quick Facts" :
                                                    tab === "seasons" ? "Seasons & Episodes" : tab}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[400px]">
                            {/* Quick Facts Tab */}
                            {activeTab === "quickfacts" && (
                                <div>
                                    <div className={`p-6 rounded-2xl mb-8 ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                                                {getTypeIcon()}
                                            </div>
                                            <div>
                                                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    📌 Quick Facts - {displayType.charAt(0).toUpperCase() + displayType.slice(1)}
                                                </h3>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Everything you need to know about this {displayType}
                                                </p>
                                            </div>
                                        </div>

                                        {details && (
                                            <>
                                                {getQuickFacts().length === 0 ? (
                                                    <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        <div className="text-5xl mb-6">📊</div>
                                                        <p className="text-xl font-bold">No Quick Facts Available</p>
                                                        <p className="mt-2">Could not fetch detailed information for this {displayType}.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {getQuickFacts().map((fact, index) => (
                                                            <div
                                                                key={index}
                                                                className={`p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                                                                    isDark ? 'bg-gray-700/30 hover:bg-gray-700/50' : 'bg-white hover:bg-gray-50 shadow-sm'
                                                                }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className="text-2xl text-gray-500">
                                                                        {fact.icon}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                            {fact.label}
                                                                        </div>
                                                                        <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                            {fact.value}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Additional Details */}
                                    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
                                        <h3 className={`text-xl font-bold mb-4 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            <Info size={24} />
                                            Additional Information
                                        </h3>
                                        <div className="space-y-4">
                                            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                <span className="font-bold">Original Title:</span> {details?.original_title || details?.original_name || "N/A"}
                                            </p>
                                            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                <span className="font-bold">Production Companies:</span> {details?.production_companies?.map(c => c.name).join(", ") || "N/A"}
                                            </p>
                                            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                <span className="font-bold">Tagline:</span> {details?.tagline || "No tagline available"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Cast Tab */}
                            {activeTab === "cast" && (
                                <div>
                                    {cast.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {cast.slice(0, 12).map((c) => {
                                                const wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(c.name.replace(/\s+/g, '_'))}`;
                                                return (
                                                    <div key={c.cast_id || c.credit_id || c.id} className="group">
                                                        <a
                                                            href={wikipediaUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block"
                                                        >
                                                            <div className="relative overflow-hidden rounded-xl mb-3">
                                                                <img
                                                                    src={
                                                                        c.profile_path
                                                                            ? `${IMG_BASE}${c.profile_path}`
                                                                            : FALLBACK_IMAGE
                                                                    }
                                                                    alt={c.name}
                                                                    className="w-full aspect-[3/4] object-cover group-hover:scale-110 transition-transform duration-500"
                                                                    onError={handleImageError}
                                                                    loading="lazy"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50">
                                                                    <div className="bg-white/10 backdrop-blur-sm p-2 rounded-full">
                                                                        <ExternalLink size={24} className="text-white" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className={`font-bold text-center block hover:text-blue-500 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                    {c.name}
                                                                </div>
                                                                <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                    {c.character}
                                                                </p>
                                                            </div>
                                                        </a>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <div className="text-5xl mb-6">🎭</div>
                                            <p className="text-xl font-bold">No cast information available</p>
                                            <p className="mt-2">Check back later for updates!</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Trailer Tab */}
                            {activeTab === "trailer" && (
                                <div className="rounded-2xl overflow-hidden shadow-2xl">
                                    {trailer && hasTrailer ? (
                                        <div className="relative pt-[56.25%]">
                                            <iframe
                                                className="absolute top-0 left-0 w-full h-full"
                                                src={`https://www.youtube.com/embed/${trailer.key}?rel=0&modestbranding=1`}
                                                title="Trailer"
                                                allowFullScreen
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            />
                                        </div>
                                    ) : (
                                        <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <div className="text-5xl mb-6">🎥</div>
                                            <p className="text-xl font-bold">No trailer available</p>
                                            <p className="mt-2">
                                                {videos.length > 0
                                                    ? "Trailer may not be available in your region or may have been removed."
                                                    : "Check back later for updates!"}
                                            </p>
                                            {videos.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm mb-2">Available videos:</p>
                                                    <div className="flex flex-wrap gap-2 justify-center">
                                                        {videos.slice(0, 3).map((video, idx) => (
                                                            <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
                                                                {video.type} ({video.site})
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Seasons Tab (for TV shows) */}
                            {activeTab === "seasons" && apiType === 'tv' && (
                                <div className="space-y-6">
                                    {/* Season Selector */}
                                    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    Seasons & Episodes
                                                </h3>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Browse through all seasons and episodes
                                                </p>
                                            </div>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowSeasonsDropdown(!showSeasonsDropdown)}
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`}
                                                >
                                                    <span className="font-semibold">Season {selectedSeason}</span>
                                                    <div className={`transition-transform ${showSeasonsDropdown ? 'rotate-180' : ''}`}>
                                                        ▼
                                                    </div>
                                                </button>

                                                {showSeasonsDropdown && seasons.length > 0 && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-40"
                                                            onClick={() => setShowSeasonsDropdown(false)}
                                                        />
                                                        <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto ${
                                                            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                                                        }`}>
                                                            {seasons.map(season => (
                                                                <button
                                                                    key={season.season_number}
                                                                    onClick={() => {
                                                                        setSelectedSeason(season.season_number);
                                                                        setShowSeasonsDropdown(false);
                                                                    }}
                                                                    className={`w-full flex items-center justify-between px-4 py-3 hover:bg-blue-500 hover:text-white transition-colors ${
                                                                        season.season_number === selectedSeason
                                                                            ? 'bg-blue-600 text-white'
                                                                            : isDark
                                                                                ? 'text-gray-300 hover:bg-gray-700'
                                                                                : 'text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                                >
                                                                    <div className="text-left">
                                                                        <div className="font-semibold">Season {season.season_number}</div>
                                                                        <div className="text-sm opacity-70">{season.episode_count} episodes</div>
                                                                    </div>
                                                                    {season.season_number === selectedSeason && (
                                                                        <div className="text-lg">✓</div>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Selected Season Info */}
                                        {seasons.find(s => s.season_number === selectedSeason) && (
                                            <div className="flex gap-6">
                                                {seasons.find(s => s.season_number === selectedSeason)?.poster_path && (
                                                    <img
                                                        src={`${IMG_BASE}${seasons.find(s => s.season_number === selectedSeason).poster_path}`}
                                                        alt={`Season ${selectedSeason}`}
                                                        className="w-32 h-48 object-cover rounded-xl"
                                                        onError={handleImageError}
                                                        loading="lazy"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <h4 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        Season {selectedSeason}
                                                    </h4>
                                                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                                                        {seasons.find(s => s.season_number === selectedSeason)?.overview ||
                                                            `Season ${selectedSeason} of ${details.title || details.name}`}
                                                    </p>
                                                    <div className="flex items-center gap-6">
                                                        <div>
                                                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Episodes</div>
                                                            <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {seasons.find(s => s.season_number === selectedSeason)?.episode_count || 0}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Year</div>
                                                            <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                {seasons.find(s => s.season_number === selectedSeason)?.air_date?.slice(0, 4) || 'TBA'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Episodes List */}
                                    <div>
                                        <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            Episodes
                                        </h3>

                                        {episodes.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {episodes.map((ep) => (
                                                    <div
                                                        key={ep.id}
                                                        className={`p-5 rounded-xl transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                    >
                                                        <div className="flex gap-4">
                                                            {ep.still_path && (
                                                                <img
                                                                    src={`${IMG_BASE}${ep.still_path}`}
                                                                    alt={ep.name}
                                                                    className="w-40 h-24 object-cover rounded-lg"
                                                                    onError={handleImageError}
                                                                    loading="lazy"
                                                                />
                                                            )}
                                                            <div className="flex-1">
                                                                <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                    Episode {ep.episode_number}: {ep.name}
                                                                </h4>
                                                                <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                    {ep.overview || "No description available."}
                                                                </p>
                                                                <div className="flex items-center gap-4 mt-3">
                                                                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                        {ep.air_date || 'TBA'}
                                                                    </span>
                                                                    <span className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`}>
                                                                        ⭐ {ep.vote_average?.toFixed(1) || 'N/A'}
                                                                    </span>
                                                                    {ep.runtime && (
                                                                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                            ⏱️ {formatDuration(ep.runtime)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                <div className="text-5xl mb-6">🎬</div>
                                                <p className="text-xl font-bold">No episodes found for this season</p>
                                                <p className="mt-2">This season may not have episode data available.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations Tab */}
                            {activeTab === "recommendations" && (
                                <div>
                                    {recommendations.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {recommendations.map((rec) => {
                                                // Determine correct type for navigation
                                                let recType = 'movie';
                                                if (rec.media_type === 'tv') {
                                                    // Check if it's anime based on original language or other factors
                                                    recType = (rec.original_language === 'ja' || rec.original_language === 'jp') ? 'anime' : 'series';
                                                }

                                                return (
                                                    <div
                                                        key={rec.id}
                                                        onClick={() => {
                                                            // Store the type in session storage before navigating
                                                            sessionStorage.setItem(`type_${rec.id}`, recType);
                                                            navigate(`/details/${recType}/${rec.id}`, {
                                                                state: {
                                                                    id: rec.id,
                                                                    type: recType
                                                                }
                                                            });
                                                        }}
                                                        className="group cursor-pointer transform hover:scale-105 transition-all duration-300"
                                                    >
                                                        <div className="relative rounded-xl overflow-hidden mb-3">
                                                            <img
                                                                src={
                                                                    rec.poster_path
                                                                        ? `${IMG_BASE}${rec.poster_path}`
                                                                        : FALLBACK_IMAGE
                                                                }
                                                                alt={rec.title || rec.name}
                                                                className="w-full aspect-[2/3] object-cover"
                                                                onError={handleImageError}
                                                                loading="lazy"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                                                                <span
                                                                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                                        recType === 'movie'
                                                                            ? 'bg-blue-500/80 text-white'
                                                                            : recType === 'series'
                                                                                ? 'bg-purple-500/80 text-white'
                                                                                : 'bg-pink-500/80 text-white'
                                                                    }`}
                                                                >
                                                                    {recType === 'movie' ? 'M' : recType === 'series' ? 'S' : 'A'}
                                                                </span>
                                                            </div>
                                                            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg text-sm font-bold">
                                                                    View Details
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {rec.title || rec.name}
                                                        </p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {rec.release_date?.slice(0, 4) || rec.first_air_date?.slice(0, 4) || 'N/A'}
                                                            </span>
                                                            <span className="text-xs text-yellow-500 flex items-center gap-1">
                                                                <Star size={12} />
                                                                {rec.vote_average?.toFixed(1) || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <div className="text-5xl mb-6">🎭</div>
                                            <p className="text-xl font-bold">No recommendations available</p>
                                            <p className="mt-2">Check back later for updates!</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailsPage;