// src/components/Banner.js
// Fixed: Added icons to share options, improved mobile alignment, 
// fixed slider stop on share click, and improved bookmark synchronization

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    Play,
    Info,
    Flame,
    Bookmark,
    Share2,
    Volume2,
    ChevronRight,
    Copy,
    Check,
    X,
    Twitter,
    Facebook,
    MessageCircle,
    Send,
} from "lucide-react";
import ShimmerCard from "./ShimmerCard";

const IMG_BASE = "https://image.tmdb.org/t/p/original/";

export default function Banner({ fetchUrl, type }) {
    const [movies, setMovies] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [trailerKey, setTrailerKey] = useState(null);
    const [copyNotification, setCopyNotification] = useState(false);
    const [movieDetails, setMovieDetails] = useState(null);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const [isChangingSlide, setIsChangingSlide] = useState(false);
    const [showMobileShareSheet, setShowMobileShareSheet] = useState(false);
    const [isSlidingPaused, setIsSlidingPaused] = useState(false);

    const navigate = useNavigate();
    const slideTimeoutRef = useRef(null);
    const shareSheetRef = useRef(null);
    const shareButtonRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Don't close if clicking on the share button itself
            if (shareButtonRef.current && shareButtonRef.current.contains(event.target)) {
                return;
            }
            
            if (shareSheetRef.current && !shareSheetRef.current.contains(event.target)) {
                setShowMobileShareSheet(false);
                setShowShareOptions(false);
                setIsSlidingPaused(false);
            }
        };
        
        if (showMobileShareSheet || showShareOptions) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('touchstart', handleClickOutside);
            };
        }
    }, [showMobileShareSheet, showShareOptions]);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await axios.get(fetchUrl);
                setMovies(res.data.results || []);
            } catch (err) {
                console.error("Banner Error:", err);
            }
        }
        if (fetchUrl) fetchData();
    }, [fetchUrl]);

    useEffect(() => {
        if (!movies.length || isSlidingPaused) return;
        
        if (slideTimeoutRef.current) clearTimeout(slideTimeoutRef.current);
        slideTimeoutRef.current = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % Math.min(movies.length, 7));
        }, 6000);
        
        return () => {
            if (slideTimeoutRef.current) clearTimeout(slideTimeoutRef.current);
        };
    }, [currentIndex, movies, isSlidingPaused]);

    useEffect(() => {
        const fetchMovieDetails = async () => {
            if (movies.length === 0) {
                setMovieDetails(null);
                setTrailerKey(null);
                return;
            }
            const movie = movies[currentIndex];
            try {
                const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
                const apiType = type === "series" || type === "anime" ? "tv" : "movie";
                const response = await axios.get(
                    `https://api.themoviedb.org/3/${apiType}/${movie.id}?api_key=${API_KEY}&append_to_response=videos`
                );
                setMovieDetails(response.data);
                const videos = response.data.videos?.results || [];
                const trailer = videos.find(v => v.type === "Trailer" && v.site === "YouTube");
                setTrailerKey(trailer?.key || null);
            } catch (error) {
                console.error("Error fetching movie details:", error);
                setMovieDetails(null);
                setTrailerKey(null);
            }
        };
        fetchMovieDetails();
    }, [currentIndex, movies, type]);

    useEffect(() => {
        if (movies.length > 0) {
            const movie = movies[currentIndex];
            const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
            const isBookmarked = bookmarks.some(item => 
                String(item.id) === String(movie.id) && 
                (item.type ? item.type === type : true)
            );
            setIsBookmarked(isBookmarked);
        }
    }, [currentIndex, movies, type]);

    useEffect(() => {
        const onBookmarksUpdated = () => {
            if (movies.length === 0) return;
            const movie = movies[currentIndex];
            const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
            const bookmarked = bookmarks.some(item => 
                String(item.id) === String(movie.id) && 
                (item.type ? item.type === type : true)
            );
            setIsBookmarked(bookmarked);
        };
        window.addEventListener('bookmarksUpdated', onBookmarksUpdated);
        return () => window.removeEventListener('bookmarksUpdated', onBookmarksUpdated);
    }, [movies, currentIndex, type]);

    useEffect(() => {
        if (copyNotification) {
            const t = setTimeout(() => setCopyNotification(false), 3000);
            return () => clearTimeout(t);
        }
    }, [copyNotification]);

    const handleSlideChange = (index) => {
        if (isChangingSlide) return;
        setIsChangingSlide(true);
        setCurrentIndex(index);
        if (slideTimeoutRef.current) clearTimeout(slideTimeoutRef.current);
        slideTimeoutRef.current = setTimeout(() => setIsChangingSlide(false), 300);
    };

    const movie = movies[currentIndex] || {};
    const showBannerShimmer = !movieDetails || movies.length === 0;

    const handleWatchTrailer = () => {
        if (trailerKey) {
            window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank');
        } else {
            navigate(`/details/${type}/${movie.id}`);
        }
    };

    const handleMoreInfo = () => navigate(`/details/${type}/${movie.id}`);

    const handleBookmark = () => {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const idKey = String(movie.id);
        const isCurrentlyBookmarked = bookmarks.some(item => 
            String(item.id) === idKey && 
            (item.type ? item.type === type : true)
        );
        
        let updatedBookmarks;
        if (isCurrentlyBookmarked) {
            updatedBookmarks = bookmarks.filter(item => 
                !(String(item.id) === idKey && (item.type ? item.type === type : true))
            );
        } else {
            updatedBookmarks = [...bookmarks, {
                id: idKey,
                type: type,
                title: movie.title || movie.name,
                image: movie.backdrop_path ? `${IMG_BASE}${movie.backdrop_path}` : 
                       movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : "",
                dateAdded: new Date().toISOString()
            }];
        }
        
        localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
        setIsBookmarked(!isCurrentlyBookmarked);
        
        // Dispatch event with detail for library to sync
        window.dispatchEvent(new CustomEvent('bookmarksUpdated', { 
            detail: updatedBookmarks 
        }));
        
        // Also update the library to ensure bookmarks show there
        window.dispatchEvent(new CustomEvent('libraryUpdated'));
    };

    const handleShareClick = () => {
        if (windowWidth < 768) {
            if (showMobileShareSheet) {
                // Close mobile sheet if already open
                setShowMobileShareSheet(false);
                setIsSlidingPaused(false);
            } else {
                // Open mobile sheet
                setIsSlidingPaused(true);
                if (slideTimeoutRef.current) {
                    clearTimeout(slideTimeoutRef.current);
                }
                setShowMobileShareSheet(true);
                setShowShareOptions(false);
            }
        } else {
            if (showShareOptions) {
                // Close desktop options if already open
                setShowShareOptions(false);
                setIsSlidingPaused(false);
            } else {
                // Open desktop options
                setIsSlidingPaused(true);
                if (slideTimeoutRef.current) {
                    clearTimeout(slideTimeoutRef.current);
                }
                setShowShareOptions(true);
                setShowMobileShareSheet(false);
            }
        }
    };

    const handleShareClose = () => {
        setShowShareOptions(false);
        setShowMobileShareSheet(false);
        setIsSlidingPaused(false);
    };

    const handleShareOption = (platform) => {
        const url = window.location.origin + `/details/${type}/${movie.id}`;
        const title = movie.title || movie.name || "A Great Movie/Series";
        const text = `Check out "${title}" on CineCoolTV!`;
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        };

        if (platform === 'copy') {
            navigator.clipboard.writeText(url).then(() => {
                setCopyNotification(true);
                handleShareClose();
            }).catch(() => {
                const ta = document.createElement('textarea');
                ta.value = url;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                setCopyNotification(true);
                handleShareClose();
            });
        } else if (platform === 'instagram') {
            window.open('https://www.instagram.com/', '_blank');
            handleShareClose();
        } else {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
            handleShareClose();
        }
    };

    const getDynamicStats = () => {
        if (!movieDetails) {
            return {
                episodes: "30",
                seasons: "1",
                rating: "5.9",
                duration: "96m",
                status: "Released",
                rank: "#1 Trending",
                year: "2025",
                genres: "Comedy • Crime • Romance",
                tagline: "'Tis the season to give. And take."
            };
        }
        const isMovie = type === "movie";
        const rating = movieDetails.vote_average ? movieDetails.vote_average.toFixed(1) : "N/A";
        const status = movieDetails.status || "Unknown";
        const popularity = (movies[currentIndex] && movies[currentIndex].popularity) || 0;
        let rank = "# Trending";
        if (popularity > 1000) rank = "#1 Trending";
        else if (popularity > 500) rank = "#2 Trending";
        else if (popularity > 200) rank = "#3 Trending";
        else rank = "# Trending";
        if (isMovie) {
            const runtime = movieDetails.runtime ? `${movieDetails.runtime}m` : "96m";
            const releaseYear = movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear().toString() : "2025";
            let genres = "Comedy • Crime • Romance";
            if (movieDetails.genres && Array.isArray(movieDetails.genres)) {
                const genreNames = movieDetails.genres.slice(0, 3).map(g => g.name);
                if (genreNames.length > 0) genres = genreNames.join(" • ");
            }
            return {
                episodes: null,
                seasons: null,
                rating,
                duration: runtime,
                status,
                rank,
                tagline: movieDetails.tagline || "'Tis the season to give. And take.",
                genres,
                year: releaseYear
            };
        } else {
            const episodes = movieDetails.number_of_episodes || "N/A";
            const seasons = movieDetails.number_of_seasons || "N/A";
            const episodeRuntime = movieDetails.episode_run_time?.[0] ? `${movieDetails.episode_run_time[0]}m` : "24m";
            const firstAirYear = movieDetails.first_air_date ? new Date(movieDetails.first_air_date).getFullYear().toString() : "";
            let genres = "";
            if (movieDetails.genres && Array.isArray(movieDetails.genres)) {
                const genreNames = movieDetails.genres.slice(0, 3).map(g => g.name);
                if (genreNames.length > 0) genres = genreNames.join(" • ");
            }
            return {
                episodes,
                seasons,
                rating,
                duration: episodeRuntime,
                status,
                rank,
                tagline: movieDetails.tagline || "",
                genres,
                year: firstAirYear
            };
        }
    };

    const dynamicStats = getDynamicStats();

    const getTitle = () => {
        const title = movie.title || movie.name || "Jingle Bell Heist";
        if (windowWidth < 640 && title.length > 40) return title.substring(0, 37) + "...";
        if (title.length > 60) return title.substring(0, 57) + "...";
        return title;
    };

    const getSubtitle = () => {
        if (dynamicStats.tagline && dynamicStats.tagline.trim() !== "") {
            const tagline = dynamicStats.tagline;
            if (windowWidth < 640 && tagline.length > 50) return tagline.substring(0, 47) + "...";
            return tagline;
        }
        if (type === "movie") {
            if (dynamicStats.genres && dynamicStats.genres.trim() !== "") {
                const genrePart = dynamicStats.genres.split(' • ').join(' • ');
                return `Movie • ${dynamicStats.year || "2025"} • ${genrePart}`;
            } else {
                return `Movie • ${dynamicStats.year || "2025"}`;
            }
        } else if (type === "series") {
            return `Series • ${dynamicStats.year || ""}`;
        } else if (type === "anime") {
            return `Anime • ${dynamicStats.year || ""}`;
        }
        return "Explore this amazing content";
    };

    const getDescription = () => {
        const overview = movie.overview || "Two down-on-their-luck hourly workers team up to rob a posh London department store on Christmas Eve. Will they steal each other's hearts along the way?";
        if (windowWidth < 640 && overview.length > 150) return overview.substring(0, 147) + "...";
        if (overview.length > 250) return overview.substring(0, 247) + "...";
        return overview;
    };

    return (
        <>
            <header
                className="banner-wrapper relative w-full h-[80vh] overflow-hidden bg-center bg-contain md:bg-cover bg-no-repeat"
                style={{ backgroundImage: movie.backdrop_path ? `url(${IMG_BASE}${movie.backdrop_path})` : undefined }}
            >
                {showBannerShimmer && (
                    <div
                        className="shimmer-banner-large"
                        aria-hidden="true"
                    />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />
                <div className="relative z-20 h-full flex items-end pb-8 md:pb-12">
                    <div className="container mx-auto px-4 md:px-8">
                        <div className="max-w-3xl">
                            {/* Trend/Status Badges - Mobile adjusted */}
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <span className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 text-xs md:text-sm rounded-full font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg">
                                    <Flame size={14} className="md:size-4" />
                                    <span>{dynamicStats.rank}</span>
                                </span>
                                <span className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 text-xs md:text-sm rounded-full font-bold bg-blue-500/90 text-white">
                                    <Volume2 size={14} className="md:size-4" />
                                    <span className="truncate max-w-[80px] md:max-w-none">{dynamicStats.status}</span>
                                </span>
                            </div>

                            {/* Title Section - Mobile adjusted */}
                            <div className="mb-6 md:mb-8">
                                <h1 className={`text-[clamp(1.75rem,3.5vw+0.5rem,4rem)] md:text-[clamp(2.5rem,4.5vw+0.6rem,4.5rem)] font-black mb-1 md:mb-2 leading-tight break-words max-w-full ${showBannerShimmer ? 'shimmer-cinematic' : ''}`}>
                                    {getTitle()}
                                </h1>
                                <h2 className="text-sm md:text-lg lg:text-xl font-semibold text-gray-300 mb-4 md:mb-6 break-words max-w-full">
                                    {getSubtitle()}
                                </h2>
                            </div>

                            {/* Description - Mobile adjusted */}
                            <p className="text-sm md:text-base text-gray-200 leading-relaxed mb-8 md:mb-10 line-clamp-3 max-w-2xl break-words">
                                {getDescription()}
                            </p>

                            {/* Stats Section - Mobile adjusted */}
                            <div className={`flex ${type === "movie" ? "justify-between" : "justify-start"} gap-4 md:gap-8 mb-8 md:mb-12 max-w-md`}>
                                {type === "movie" ? (
                                    <>
                                        <div className="text-left">
                                            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{dynamicStats.year || "2025"}</div>
                                            <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider mt-0.5 md:mt-1"> YEAR </div>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{dynamicStats.rating}</div>
                                            <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider mt-0.5 md:mt-1"> RATING </div>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{dynamicStats.duration}</div>
                                            <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider mt-0.5 md:mt-1"> DURATION </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-left">
                                            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{dynamicStats.seasons}</div>
                                            <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider mt-0.5 md:mt-1"> SEASONS </div>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{dynamicStats.episodes}</div>
                                            <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider mt-0.5 md:mt-1"> EPISODES </div>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{dynamicStats.rating}</div>
                                            <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider mt-0.5 md:mt-1"> RATING </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Action Buttons - Mobile adjusted */}
                            <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                <button
                                    onClick={handleWatchTrailer}
                                    className="flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-pink-600 shadow-2xl hover:shadow-red-500/25 transition-all hover:scale-105 active:scale-95 group flex-1 md:flex-none min-w-[140px]"
                                    type="button"
                                >
                                    <Play size={20} className="md:size-6 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm md:text-lg">Watch Trailer</span>
                                    <ChevronRight size={16} className="md:size-5 group-hover:translate-x-1 transition-transform hidden md:block" />
                                </button>

                                <button onClick={handleMoreInfo} className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 rounded-xl font-semibold text-white bg-white/20 hover:bg-white/30 transition-all border border-white/20 flex-1 md:flex-none min-w-[100px]" type="button">
                                    <Info size={18} className="md:size-5" />
                                    <span className="text-sm md:text-base">Details</span>
                                </button>

                                <button onClick={handleBookmark} className={`p-3 rounded-xl backdrop-blur-sm border transition-all ${isBookmarked ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400 hover:bg-yellow-500/30' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`} type="button" aria-pressed={isBookmarked}>
                                    <Bookmark size={20} className={isBookmarked ? "fill-current" : ""} />
                                </button>

                                <div className="relative">
                                    <button 
                                        ref={shareButtonRef}
                                        onClick={handleShareClick} 
                                        className={`p-3 rounded-xl backdrop-blur-sm border transition-all ${showShareOptions || showMobileShareSheet ? 'bg-blue-500/20 border-blue-400 text-blue-400' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`} 
                                        type="button"
                                    >
                                        <Share2 size={20} />
                                    </button>

                                    {/* Desktop Share Options */}
                                    {showShareOptions && windowWidth >= 768 && (
                                        <div className="absolute bottom-full right-0 mb-3 md:mb-4 w-48 md:w-52 bg-gray-900/90 backdrop-blur-lg rounded-xl shadow-2xl p-3 border border-white/10 animate-fade-in-up z-50">
                                            <div className="flex flex-col gap-2">
                                                <button onClick={() => handleShareOption('copy')} className="flex items-center gap-3 p-2 rounded-lg text-white hover:bg-white/10 transition-colors" type="button">
                                                    <Copy size={18} />
                                                    <span className="text-sm">Copy Link</span>
                                                </button>
                                                <button onClick={() => handleShareOption('twitter')} className="flex items-center gap-3 p-2 rounded-lg text-white hover:bg-white/10 transition-colors" type="button">
                                                    <Twitter size={18} />
                                                    <span className="text-sm">Twitter</span>
                                                </button>
                                                <button onClick={() => handleShareOption('facebook')} className="flex items-center gap-3 p-2 rounded-lg text-white hover:bg-white/10 transition-colors" type="button">
                                                    <Facebook size={18} />
                                                    <span className="text-sm">Facebook</span>
                                                </button>
                                                <button onClick={() => handleShareOption('whatsapp')} className="flex items-center gap-3 p-2 rounded-lg text-white hover:bg-white/10 transition-colors" type="button">
                                                    <MessageCircle size={18} />
                                                    <span className="text-sm">WhatsApp</span>
                                                </button>
                                                <button onClick={() => handleShareOption('telegram')} className="flex items-center gap-3 p-2 rounded-lg text-white hover:bg-white/10 transition-colors" type="button">
                                                    <Send size={18} />
                                                    <span className="text-sm">Telegram</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Slide Dots - Mobile adjusted */}
                <div className="banner-indicators">
                    {movies.slice(0, 7).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => handleSlideChange(i)}
                            disabled={isChangingSlide}
                            className={`dot transition-all duration-300 ease-in-out ${i === currentIndex ? "w-2.5 h-2.5 md:w-3 md:h-3 bg-white rounded-full ring-1 md:ring-2 ring-white/30" : "w-2 h-2 md:w-2.5 md:h-2.5 bg-white/30 hover:bg-white/50 rounded-full hover:scale-110"}`}
                            aria-label={`Go to slide ${i + 1}`}
                            type="button"
                        />
                    ))}
                </div>

                {/* Copy Notification */}
                {copyNotification && (
                    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
                        <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                            <Check size={20} />
                            <span className="text-base font-medium">Link copied to clipboard!</span>
                        </div>
                    </div>
                )}

                {/* Mobile Share Sheet */}
                {showMobileShareSheet && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
                        <div 
                            ref={shareSheetRef}
                            className="bg-gray-900 w-full max-w-md rounded-t-2xl p-6 animate-slide-up"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Share</h3>
                                <button 
                                    onClick={handleShareClose}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <X size={24} className="text-white" />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <button 
                                    onClick={() => handleShareOption('copy')}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                                >
                                    <div className="p-3 rounded-full bg-blue-500/20">
                                        <Copy size={24} className="text-blue-400" />
                                    </div>
                                    <span className="text-sm text-white">Copy Link</span>
                                </button>
                                
                                <button 
                                    onClick={() => handleShareOption('twitter')}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                                >
                                    <div className="p-3 rounded-full bg-blue-400/20">
                                        <Twitter size={24} className="text-blue-400" />
                                    </div>
                                    <span className="text-sm text-white">Twitter</span>
                                </button>
                                
                                <button 
                                    onClick={() => handleShareOption('facebook')}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                                >
                                    <div className="p-3 rounded-full bg-blue-600/20">
                                        <Facebook size={24} className="text-blue-500" />
                                    </div>
                                    <span className="text-sm text-white">Facebook</span>
                                </button>
                                
                                <button 
                                    onClick={() => handleShareOption('whatsapp')}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                                >
                                    <div className="p-3 rounded-full bg-green-500/20">
                                        <MessageCircle size={24} className="text-green-400" />
                                    </div>
                                    <span className="text-sm text-white">WhatsApp</span>
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => handleShareOption('telegram')}
                                className="flex items-center justify-center gap-3 w-full p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors mb-4"
                            >
                                <Send size={20} className="text-blue-400" />
                                <span className="text-white">Share on Telegram</span>
                            </button>
                            
                            <button 
                                onClick={handleShareClose}
                                className="w-full py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
            </header>
        </>
    );
}