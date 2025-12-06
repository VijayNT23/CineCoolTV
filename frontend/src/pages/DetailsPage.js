// src/pages/DetailsPage.js
import React, { useEffect, useState, useCallback } from "react";
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
    ChevronRight
} from "lucide-react";

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const IMG_BASE = "https://image.tmdb.org/t/p/original";

const DetailsPage = () => {
    const { type: typeFromRoute, id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const type = !typeFromRoute ? "movie" : typeFromRoute;
    const apiType = type === "series" || type === "anime" ? "tv" : type;

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

    // Check if item is bookmarked
    const checkBookmarkStatus = useCallback(() => {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const isBookmarked = bookmarks.some(b => String(b.id) === String(id) && b.type === type);
        setBookmarked(isBookmarked);
    }, [id, type]);

    // Check user rating
    const checkUserRating = useCallback(() => {
        const ratings = JSON.parse(localStorage.getItem('userRatings') || '{}');
        const key = `${type}_${id}`;
        setUserRating(ratings[key] || null);
    }, [id, type]);

    // Save user rating
    const saveUserRating = (rating) => {
        const ratings = JSON.parse(localStorage.getItem('userRatings') || '{}');
        const key = `${type}_${id}`;
        
        if (rating === userRating) {
            // Remove rating if same rating clicked
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
        try {
            const imdbRes = await axios.get(
                `https://www.omdbapi.com/?i=${imdbId}&apikey=9b0c5c3f`
            );
            
            if (imdbRes.data && imdbRes.data.imdbRating) {
                setImdbRating(imdbRes.data.imdbRating);
            } else {
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
            }
        } catch (e) {
            console.warn("IMDb rating fetch failed", e);
            setImdbRating(null);
        }
    };

    // Get rating color based on score
    const getRatingColor = (score) => {
        if (score >= 8) return "text-green-500";
        if (score >= 6) return "text-yellow-500";
        if (score >= 4) return "text-orange-500";
        return "text-red-500";
    };

    // Get rating color class for background
    const getRatingBgColor = (score) => {
        if (score >= 8) return "bg-green-500/10";
        if (score >= 6) return "bg-yellow-500/10";
        if (score >= 4) return "bg-orange-500/10";
        return "bg-red-500/10";
    };

    // Get TMDB rating (our universal rating)
    const getTMDBRating = () => {
        if (!details) return { score: 0, votes: 0 };
        return {
            score: details.vote_average?.toFixed(1) || 0,
            votes: details.vote_count || 0
        };
    };

    // Get type-specific rating title
    const getRatingTitle = () => {
        switch(type) {
            case "movie": return "Movie Ratings";
            case "series": return "Series Ratings";
            case "anime": return "Anime Ratings";
            default: return "Ratings";
        }
    };

    // Simulate Rotten Tomatoes score (in real app, fetch from API)
    const getRottenTomatoesScore = useCallback(() => {
        const baseScore = details?.vote_average || 0;
        let rtScore = Math.min(Math.round((baseScore / 10) * 100), 100);
        const variation = Math.random() * 20 - 10;
        rtScore = Math.max(0, Math.min(100, rtScore + variation));
        rtScore = Math.round(rtScore / 5) * 5;
        return rtScore;
    }, [details]);

    useEffect(() => {
        let mounted = true;

        async function fetchAll() {
            setLoading(true);
            try {
                const detailsRes = await axios.get(
                    `https://api.themoviedb.org/3/${apiType}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=credits,videos,recommendations,content_ratings,release_dates`
                );
                if (!mounted) return;
                setDetails(detailsRes.data);

                // Fetch IMDb rating if imdb_id is available
                if (detailsRes.data.imdb_id) {
                    await fetchIMDbRating(detailsRes.data.imdb_id);
                }

                // Fetch additional data based on type
                await fetchTypeSpecificData(detailsRes.data);

                if (mounted) {
                    setCast(detailsRes.data.credits?.cast || []);
                    setVideos(detailsRes.data.videos?.results || []);
                    setRecommendations(detailsRes.data.recommendations?.results || []);
                }

                // Fetch seasons data for TV shows
                if (apiType === "tv" && detailsRes.data.seasons) {
                    const validSeasons = detailsRes.data.seasons.filter(
                        season => season.season_number > 0 && season.episode_count > 0
                    );
                    setSeasons(validSeasons);
                    if (validSeasons.length > 0) {
                        setSelectedSeason(validSeasons[0].season_number);
                    }
                }

            } catch (err) {
                console.error("Details fetch error", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        const fetchTypeSpecificData = async (data) => {
            const typeData = {};
            
            if (type === "movie") {
                const releaseDates = await axios.get(
                    `https://api.themoviedb.org/3/movie/${id}/release_dates?api_key=${API_KEY}`
                ).catch(() => ({ data: { results: [] } }));
                
                const usRelease = releaseDates.data.results?.find(r => r.iso_3166_1 === "US");
                const rating = usRelease?.release_dates?.[0]?.certification || "Not Rated";
                typeData.ageRating = rating;
                typeData.releaseYear = data.release_date?.slice(0, 4) || "N/A";
                typeData.budget = data.budget || 0;
                typeData.boxOffice = data.revenue || 0;
                typeData.director = data.credits?.crew?.find(person => person.job === "Director")?.name || "N/A";
                typeData.country = data.production_countries?.[0]?.name || "N/A";
                typeData.ottPlatforms = ["Netflix", "Prime Video", "Disney+"].slice(0, Math.floor(Math.random() * 3) + 1);

            } else if (type === "series") {
                typeData.seasons = data.number_of_seasons || 0;
                typeData.episodeDuration = data.episode_run_time?.[0] || 45;
                typeData.firstAirDate = data.first_air_date || "N/A";
                typeData.lastAirDate = data.last_air_date || "N/A";
                typeData.status = data.status || "N/A";
                typeData.networks = data.networks?.map(n => n.name) || ["N/A"];
                typeData.createdBy = data.created_by?.map(c => c.name).join(", ") || "N/A";

            } else if (type === "anime") {
                typeData.animeType = ["TV", "OVA", "ONA", "Movie"][Math.floor(Math.random() * 4)];
                typeData.sourceMaterial = ["Manga", "Light Novel", "Webtoon", "Game", "Original"][Math.floor(Math.random() * 5)];
                typeData.studio = ["Studio Ghibli", "MAPPA", "Ufotable", "Kyoto Animation", "Wit Studio"][Math.floor(Math.random() * 5)];
                typeData.japaneseTitle = data.original_name || data.original_title || "N/A";
                typeData.status = data.status || "N/A";
                typeData.episodeDuration = data.episode_run_time?.[0] || 24;
                typeData.seasonOrder = ["First", "Second", "Third", "Fourth"][Math.floor(Math.random() * 4)] + " Season";
            }

            setTypeSpecificData(typeData);
        };

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
            checkBookmarkStatus();
            checkUserRating();
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
            checkBookmarkStatus();
            checkUserRating();
        };
        
        window.addEventListener("libraryUpdated", handler);
        window.addEventListener("bookmarksUpdated", checkBookmarkStatus);

        return () => {
            mounted = false;
            window.removeEventListener("libraryUpdated", handler);
            window.removeEventListener("bookmarksUpdated", checkBookmarkStatus);
        };
    }, [id, type, apiType, checkBookmarkStatus, checkUserRating]);

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
                setEpisodes([]);
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
        if (!minutes) return "Unknown";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
        }
        return `${mins}m`;
    };

    const formatCurrency = (amount) => {
        if (!amount || amount === 0) return "N/A";
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleStatusChange = async (newStatus) => {
        const libraryItem = getLibraryItem(Number(id), type);

        if (status === newStatus) {
            await removeFromLibrary(Number(id), type);
            setStatus(null);
            setIsRewatching(false);
            showToast(`Removed from ${newStatus}`, "info");
            return;
        }

        if (newStatus === "Rewatching") {
            if (isRewatching) {
                setIsRewatching(false);
                if (libraryItem) {
                    await updateLibraryItem(Number(id), type, {
                        isRewatching: false
                    });
                }
                showToast(`Stopped rewatching`, "info");
                return;
            } else {
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
                showToast(`🎬 Started rewatching! Will appear in "Rewatch" filter`, "success");
                return;
            }
        }

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
        
        const statusPurposes = {
            "Watchlist": "📋 Added to Watchlist - Things you plan to watch",
            "Watching": "👀 Marked as Watching - Currently viewing",
            "Considering": "🤔 Added to Considering - Considering whether to watch",
            "Completed": "✅ Marked as Completed - Finished watching",
            "Dropped": "🗑️ Marked as Dropped - Stopped watching",
            "Favorites": "❤️ Added to Favorites - Top picks",
            "Bookmarks": "🔖 Added to Bookmarks - Saved for quick access",
        };
        
        showToast(statusPurposes[newStatus] || `Status updated to ${newStatus}`, "success");
    };

    const handleToggleFav = async () => {
        const genres = details.genres ? details.genres.map(g => g.name) : [];
        toggleFavorite(Number(id), type, {
            title: details.title || details.name,
            image: details.poster_path ? `${IMG_BASE}${details.poster_path}` : "https://via.placeholder.com/400x600?text=No+Image",
            genres: genres,
            duration: type === "tv" ? calculateTotalDuration() : (details.runtime || 120)
        });
        setFav(!fav);
        showToast(!fav ? "❤️ Added to Favorites - Will appear in 'Favs' filter" : "💔 Removed from Favorites", "success");
    };

    const handleBookmarkToggle = () => {
        const currentBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        let newBookmarks;
        
        if (bookmarked) {
            newBookmarks = currentBookmarks.filter(b => 
                !(String(b.id) === String(id) && b.type === type)
            );
            showToast("🔖 Removed from Bookmarks", "info");
        } else {
            newBookmarks = [...currentBookmarks, {
                id: String(id),
                type: type,
                title: details.title || details.name,
                image: details.poster_path ? `${IMG_BASE}${details.poster_path}` : "https://via.placeholder.com/400x600?text=No+Image",
                dateAdded: new Date().toISOString()
            }];
            showToast("📌 Bookmarked! - Will appear in 'Bookmarks' filter", "success");
        }
        
        localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
        setBookmarked(!bookmarked);
        window.dispatchEvent(new Event('bookmarksUpdated'));
    };

    const handleAddToLibrary = async () => {
        if (isInLibrary(Number(id), type)) {
            await removeFromLibrary(Number(id), type);
            setStatus(null);
            setFav(false);
            setIsRewatching(false);
            showToast("🗑️ Removed from Library", "info");
            return;
        }

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
        showToast("📋 Added to Library! - Will appear in 'Watchlist' filter", "success");

        const libraryItem = getLibraryItem(Number(id), type);
        if (libraryItem) {
            setStatus(libraryItem.status);
            setFav(libraryItem.favorite || false);
        }
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
        switch (type) {
            case "movie": return <Film size={20} />;
            case "series": return <Tv size={20} />;
            case "anime": return <Sparkles size={20} />;
            default: return <Film size={20} />;
        }
    };

    // Get ratings - TMDB and Rotten Tomatoes
    const getRatings = () => {
        const tmdbRating = getTMDBRating();
        const rtScore = getRottenTomatoesScore();
        
        const ratings = [
            { 
                platform: "TMDB", 
                icon: <Popcorn size={18} />, 
                color: getRatingColor(tmdbRating.score),
                bgColor: getRatingBgColor(tmdbRating.score),
                value: `${tmdbRating.score}/10`,
                quality: tmdbRating.score >= 7 ? "Good" : "Average"
            },
            { 
                platform: "Rotten Tomatoes", 
                icon: <span className="text-lg">🍅</span>,
                color: rtScore >= 60 ? "text-red-500" : "text-gray-500",
                bgColor: rtScore >= 60 ? "bg-red-500/10" : "bg-gray-500/10",
                value: `${rtScore}%`,
                quality: rtScore >= 60 ? "Fresh" : "Rotten"
            }
        ];

        // Add IMDb rating if available
        if (imdbRating) {
            ratings.push({
                platform: "IMDb",
                icon: <span className="text-xl">⭐</span>,
                color: "text-yellow-500",
                bgColor: "bg-yellow-500/10",
                value: `${imdbRating}/10`,
                quality: imdbRating >= 7 ? "Good" : "Average"
            });
        }

        return ratings;
    };

    // Get quick facts based on type
    const getQuickFacts = () => {
        if (!details) return [];
        
        const castNames = cast.slice(0, 3).map(c => c.name).join(", ");
        
        if (type === "series") {
            const facts = [
                { icon: "📅", label: "Aired", value: `${details.first_air_date?.slice(0, 4) || "N/A"} – ${details.last_air_date ? details.last_air_date.slice(0, 4) : "Present"}` },
                { icon: "🎞️", label: "Seasons", value: details.number_of_seasons || "N/A" },
                { icon: "🎬", label: "Episodes", value: details.number_of_episodes || "N/A" },
                { icon: "⏱️", label: "Ep Duration", value: `${details.episode_run_time?.[0] || 45} min` },
                { icon: "🔞", label: "Age Rating", value: typeSpecificData.ageRating || "Not Rated" },
                { icon: "🎭", label: "Genre", value: details.genres?.slice(0, 2).map(g => g.name).join(", ") || "N/A" },
                { icon: "🌍", label: "Country", value: details.production_countries?.[0]?.name || "N/A" },
                { icon: "👥", label: "Cast", value: castNames || "N/A" },
                { icon: "📺", label: "Network", value: typeSpecificData.networks?.[0] || "N/A" }
            ];
            
            // Add IMDb rating to quick facts if available
            if (imdbRating) {
                facts.unshift({
                    icon: "⭐",
                    label: "IMDb Rating",
                    value: `${imdbRating}/10`,
                    special: true,
                    color: "text-yellow-500",
                    bgColor: "bg-yellow-500/10"
                });
            }
            
            return facts;
            
        } else if (type === "movie") {
            const facts = [
                { icon: "📅", label: "Released", value: details.release_date?.slice(0, 4) || "N/A" },
                { icon: "⏱️", label: "Duration", value: `${details.runtime || 0} min` },
                { icon: "🔞", label: "Age Rating", value: typeSpecificData.ageRating || "Not Rated" },
                { icon: "🎭", label: "Genre", value: details.genres?.slice(0, 2).map(g => g.name).join(", ") || "N/A" },
                { icon: "🌍", label: "Country", value: details.production_countries?.[0]?.name || "N/A" },
                { icon: "👥", label: "Cast", value: castNames || "N/A" },
                { icon: "🎬", label: "Director", value: typeSpecificData.director || "N/A" },
                { icon: "💰", label: "Budget", value: formatCurrency(details.budget) },
                { icon: "📈", label: "Box Office", value: formatCurrency(details.revenue) }
            ];
            
            // Add IMDb rating to quick facts if available
            if (imdbRating) {
                facts.unshift({
                    icon: "⭐",
                    label: "IMDb Rating",
                    value: `${imdbRating}/10`,
                    special: true,
                    color: "text-yellow-500",
                    bgColor: "bg-yellow-500/10"
                });
            }
            
            return facts;
            
        } else if (type === "anime") {
            const facts = [
                { icon: "📅", label: "Aired", value: `${details.first_air_date?.slice(0, 4) || "N/A"} – ${details.last_air_date ? details.last_air_date.slice(0, 4) : "Present"}` },
                { icon: "🎞️", label: "Type", value: typeSpecificData.animeType || "TV" },
                { icon: "🎬", label: "Episodes", value: details.number_of_episodes || "N/A" },
                { icon: "⏱️", label: "Ep Duration", value: `${details.episode_run_time?.[0] || 24} min` },
                { icon: "🔞", label: "Age Rating", value: typeSpecificData.ageRating || "Not Rated" },
                { icon: "🎭", label: "Genre", value: details.genres?.slice(0, 2).map(g => g.name).join(", ") || "N/A" },
                { icon: "🌍", label: "Country", value: "Japan" },
                { icon: "👥", label: "Cast", value: castNames || "N/A" },
                { icon: "🏢", label: "Studio", value: typeSpecificData.studio || "N/A" }
            ];
            
            // Add IMDb rating to quick facts if available
            if (imdbRating) {
                facts.unshift({
                    icon: "⭐",
                    label: "IMDb Rating",
                    value: `${imdbRating}/10`,
                    special: true,
                    color: "text-yellow-500",
                    bgColor: "bg-yellow-500/10"
                });
            }
            
            return facts;
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

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-b from-gray-900 to-black' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
                <div className="text-center">
                    <div className="text-5xl mb-6 animate-pulse">🎬</div>
                    <div className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                        Loading Details...
                    </div>
                    <div className={`mt-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        Fetching the cinematic magic...
                    </div>
                </div>
            </div>
        );
    }

    if (!details) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-b from-gray-900 to-black' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
                <div className="text-center">
                    <div className="text-5xl mb-6">🎭</div>
                    <div className={`text-2xl font-bold ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                        Failed to load details
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className={`mt-6 px-6 py-3 rounded-lg font-semibold ${
                            isDark ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                    >
                        Go Back
                    </button>
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

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gradient-to-b from-gray-900 to-black' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
            {/* Background with gradient overlay */}
            <div className="fixed inset-0 z-0 overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{
                        backgroundImage: `url(${details.backdrop_path ? `${IMG_BASE}${details.backdrop_path}` : poster})`,
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
                                                Share This {type.charAt(0).toUpperCase() + type.slice(1)}
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
                                    src={poster}
                                    alt={details.title || details.name}
                                    className="w-full h-auto object-cover transform group-hover:scale-110 transition-transform duration-700"
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
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
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

                        {/* Platform Ratings - TMDB, Rotten Tomatoes, and IMDb */}
                        <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <BarChart3 size={20} className="text-blue-500" />
                                {getRatingTitle()}
                            </h3>
                            <div className="space-y-3">
                                {getRatings().map((rating, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                                            isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${rating.bgColor}`}>
                                                <span className={rating.color}>{rating.icon}</span>
                                            </div>
                                            <div>
                                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {rating.platform}
                                                </span>
                                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {rating.quality}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-lg font-bold ${rating.color}`}>
                                                {rating.value}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                    isInLibrary(Number(id), type)
                                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                                }`}
                            >
                                {isInLibrary(Number(id), type) ? "Remove from Library" : "Add to Library"}
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
                                    {["quickfacts", "cast", "trailer", ...(type !== 'movie' ? ["seasons"] : []), "recommendations"].map(
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
                            {/* Quick Facts Tab - Type Specific with IMDb Rating */}
                            {activeTab === "quickfacts" && (
                                <div>
                                    <div className={`p-6 rounded-2xl mb-8 ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                                                {getTypeIcon()}
                                            </div>
                                            <div>
                                                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    📌 Quick Facts
                                                </h3>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Everything you need to know about this {type}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {getQuickFacts().map((fact, index) => (
                                                <div
                                                    key={index}
                                                    className={`p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                                                        fact.special 
                                                            ? `border-2 ${isDark ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-yellow-500/20 bg-yellow-50'}`
                                                            : isDark ? 'bg-gray-700/30 hover:bg-gray-700/50' : 'bg-white hover:bg-gray-50 shadow-sm'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`text-2xl ${fact.special ? 'text-yellow-500' : ''}`}>
                                                            {fact.icon}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {fact.label}
                                                            </div>
                                                            <div className={`text-lg font-bold ${fact.special ? 'text-yellow-600' : (isDark ? 'text-white' : 'text-gray-900')}`}>
                                                                {fact.value}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Additional Details */}
                                    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
                                        <h3 className={`text-xl font-bold mb-4 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            <Info size={24} />
                                            Additional Information
                                        </h3>
                                        <div className="space-y-4">
                                            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                <span className="font-bold">Original Title:</span> {details.original_title || details.original_name}
                                            </p>
                                            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                <span className="font-bold">Production Companies:</span> {details.production_companies?.map(c => c.name).join(", ") || "N/A"}
                                            </p>
                                            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                <span className="font-bold">Tagline:</span> {details.tagline || "No tagline available"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Cast Tab */}
                            {activeTab === "cast" && (
                                <div>
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
                                                                        : "https://via.placeholder.com/200x300?text=No+Image"
                                                                }
                                                                alt={c.name}
                                                                className="w-full aspect-[3/4] object-cover group-hover:scale-110 transition-transform duration-500"
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
                                </div>
                            )}

                            {/* Trailer Tab */}
                            {activeTab === "trailer" && (
                                <div className="rounded-2xl overflow-hidden shadow-2xl">
                                    {trailer ? (
                                        <div className="relative pt-[56.25%]">
                                            <iframe
                                                className="absolute top-0 left-0 w-full h-full"
                                                src={`https://www.youtube.com/embed/${trailer.key}?rel=0&modestbranding=1`}
                                                title="Trailer"
                                                allowFullScreen
                                            />
                                        </div>
                                    ) : (
                                        <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <div className="text-5xl mb-6">🎥</div>
                                            <p className="text-xl font-bold">No trailer available</p>
                                            <p className="mt-2">Check back later for updates!</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Seasons Tab (for TV shows) */}
                            {activeTab === "seasons" && type !== 'movie' && (
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
                                                No episodes found for this season
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
                                            {recommendations.map((rec) => (
                                                <div
                                                    key={rec.id}
                                                    onClick={() => navigate(`/details/${rec.media_type || (rec.first_air_date ? 'tv' : 'movie')}/${rec.id}`)}
                                                    className="group cursor-pointer transform hover:scale-105 transition-all duration-300"
                                                >
                                                    <div className="relative rounded-xl overflow-hidden mb-3">
                                                        <img
                                                            src={
                                                                rec.poster_path
                                                                    ? `${IMG_BASE}${rec.poster_path}`
                                                                    : "https://via.placeholder.com/300x450?text=No+Image"
                                                            }
                                                            alt={rec.title || rec.name}
                                                            className="w-full aspect-[2/3] object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                                            ))}
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