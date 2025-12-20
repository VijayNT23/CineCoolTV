// src/components/Row.js - FIXED for laptop with continuous scrolling
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    getLibrary,
    toggleFavorite,
    toggleLibraryItem,
} from "../utils/libraryUtils";
import ShimmerCard from "./ShimmerCard";
import { useTheme } from "../context/ThemeContext";

const BASE_IMG = "https://image.tmdb.org/t/p/original";

const Row = ({ title, fetchUrl, isLargeRow = false, type: incomingType }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [userLibrary, setUserLibrary] = useState([]);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [isDesktop, setIsDesktop] = useState(false);
    
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { currentUser } = useAuth();
    const rowRef = useRef(null);
    const containerRef = useRef(null);
    const scrollIntervalRef = useRef(null);

    // Check if desktop
    useEffect(() => {
        const checkIfDesktop = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        
        checkIfDesktop();
        window.addEventListener('resize', checkIfDesktop);
        return () => window.removeEventListener('resize', checkIfDesktop);
    }, []);

    // Load user's library and favorites
    useEffect(() => {
        const loadUserData = async () => {
            if (!currentUser) {
                setUserLibrary([]);
                return;
            }
            
            try {
                const lib = await getLibrary();
                
                if (lib && Array.isArray(lib)) {
                    setUserLibrary(lib);
                } else {
                    setUserLibrary([]);
                }
            } catch (error) {
                console.error("Error loading user library in Row:", error);
                setUserLibrary([]);
            }
        };
        
        loadUserData();
        
        const handleLibraryUpdate = () => {
            loadUserData();
        };
        
        window.addEventListener("libraryUpdated", handleLibraryUpdate);
        return () => window.removeEventListener("libraryUpdated", handleLibraryUpdate);
    }, [currentUser]);

    // Check scroll position to show/hide arrows
    const updateArrows = () => {
        if (rowRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    // Scroll left by 2 cards
    const scrollLeft = () => {
        if (!rowRef.current) return;
        
        const cardWidth = isLargeRow ? 220 : 180;
        const gap = 16;
        const scrollAmount = (cardWidth + gap) * 2; // 2 cards
        
        rowRef.current.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
        
        setTimeout(updateArrows, 300);
    };

    // Scroll right by 2 cards
    const scrollRight = () => {
        if (!rowRef.current) return;
        
        const cardWidth = isLargeRow ? 220 : 180;
        const gap = 16;
        const scrollAmount = (cardWidth + gap) * 2; // 2 cards
        
        rowRef.current.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
        
        setTimeout(updateArrows, 300);
    };

    // Continuous scroll for laptop
    const startContinuousScroll = (direction) => {
        if (!rowRef.current || scrollIntervalRef.current) return;
        
        scrollIntervalRef.current = setInterval(() => {
            if (rowRef.current) {
                const scrollSpeed = isDesktop ? 25 : 15;
                rowRef.current.scrollBy({
                    left: direction * scrollSpeed,
                    behavior: 'auto'
                });
                updateArrows();
            }
        }, 16); // ~60fps
    };

    // Stop continuous scroll
    const stopContinuousScroll = () => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    };

    // Handle mouse wheel for laptop
    const handleWheel = (e) => {
        if (rowRef.current && isDesktop) {
            rowRef.current.scrollLeft += e.deltaY * 2;
            e.preventDefault();
            updateArrows();
        }
    };

    useEffect(() => {
        let mounted = true;
        let retryCount = 0;
        const maxRetries = 2;

        async function fetchData() {
            try {
                setLoading(true);
                setError(false);
                const res = await axios.get(fetchUrl, {
                    timeout: 8000,
                });
                if (!mounted) return;

                if (res.data.results && Array.isArray(res.data.results)) {
                    const filteredItems = res.data.results.filter(item => {
                        if (incomingType === 'anime') return true;
                        
                        const isJapanese = 
                            item.original_language === 'ja' || 
                            item.original_language === 'jp' ||
                            (item.origin_country && item.origin_country.includes('JP'));
                        
                        const hasAnimeGenre = item.genre_ids && item.genre_ids.includes(16);
                        
                        return !isJapanese && !hasAnimeGenre;
                    });
                    
                    setItems(filteredItems);
                } else {
                    setItems([]);
                }
            } catch (err) {
                console.error("Row fetch error", err);
                if (mounted) {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        setTimeout(fetchData, 1000 * retryCount);
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
        return () => {
            mounted = false;
            stopContinuousScroll();
        };
    }, [fetchUrl, incomingType]);

    // Update arrows when items load or window resizes
    useEffect(() => {
        const update = () => {
            if (!loading && items.length > 0) {
                setTimeout(updateArrows, 100);
            }
        };
        
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [loading, items]);

    // FIXED: Proper user-specific checking
    const isInUserLibrary = (id, mediaType) => {
        if (!currentUser || !Array.isArray(userLibrary)) return false;
        
        return userLibrary.some(item => 
            String(item.id) === String(id) && 
            item.type === mediaType
        );
    };

    const isUserFavorite = (id, mediaType) => {
        if (!currentUser || !Array.isArray(userLibrary)) return false;
        
        return userLibrary.some(item => 
            String(item.id) === String(id) && 
            item.type === mediaType && 
            item.favorite === true
        );
    };

    const getMediaType = (item) => {
        return item.media_type || incomingType || "movie";
    };

    const getShimmerCount = () => {
        if (typeof window !== 'undefined') {
            const width = window.innerWidth;
            if (width < 640) return 4;
            if (width < 1024) return 6;
            return 8;
        }
        return 8;
    };

    // Duplicate items for continuous scrolling effect
    const continuousItems = [...items, ...items, ...items];

    return (
        <div 
            ref={containerRef}
            className={`px-4 sm:px-6 py-4 sm:py-6 relative ${theme === "dark" ? "text-white" : "text-gray-900"}`}
        >
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 tracking-wide">{title}</h2>

            {/* Left arrow button - with continuous scroll on laptop */}
            {!loading && !error && items.length > 0 && showLeftArrow && (
                <button
                    onClick={scrollLeft}
                    onMouseDown={() => isDesktop && startContinuousScroll(-1)}
                    onMouseUp={stopContinuousScroll}
                    onMouseLeave={stopContinuousScroll}
                    onTouchStart={scrollLeft}
                    className={`absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 z-30 rounded-full p-3 sm:p-4 shadow-xl transition-all duration-300 ${
                        theme === "dark" 
                            ? "bg-gray-900/95 hover:bg-gray-800 text-white border border-gray-700" 
                            : "bg-white/98 hover:bg-gray-50 text-gray-800 border border-gray-200"
                    } flex items-center justify-center ${
                        isDesktop ? "hover:scale-110 active:scale-95" : "active:scale-95"
                    }`}
                    aria-label="Scroll left"
                >
                    <svg 
                        className="w-6 h-6 sm:w-7 sm:h-7" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2.5} 
                            d="M15 19l-7-7 7-7" 
                        />
                    </svg>
                </button>
            )}

            {/* Right arrow button - with continuous scroll on laptop */}
            {!loading && !error && items.length > 0 && showRightArrow && (
                <button
                    onClick={scrollRight}
                    onMouseDown={() => isDesktop && startContinuousScroll(1)}
                    onMouseUp={stopContinuousScroll}
                    onMouseLeave={stopContinuousScroll}
                    onTouchStart={scrollRight}
                    className={`absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 z-30 rounded-full p-3 sm:p-4 shadow-xl transition-all duration-300 ${
                        theme === "dark" 
                            ? "bg-gray-900/95 hover:bg-gray-800 text-white border border-gray-700" 
                            : "bg-white/98 hover:bg-gray-50 text-gray-800 border border-gray-200"
                    } flex items-center justify-center ${
                        isDesktop ? "hover:scale-110 active:scale-95" : "active:scale-95"
                    }`}
                    aria-label="Scroll right"
                >
                    <svg 
                        className="w-6 h-6 sm:w-7 sm:h-7" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2.5} 
                            d="M9 5l7 7-7 7" 
                        />
                    </svg>
                </button>
            )}

            <div 
                ref={rowRef}
                onScroll={updateArrows}
                onWheel={handleWheel}
                className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 scrollbar-hide scroll-smooth"
                style={{ 
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    overflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >
                {loading ? (
                    Array.from({ length: getShimmerCount() }).map((_, i) => (
                        <ShimmerCard key={i} isLargeRow={isLargeRow} />
                    ))
                ) : error ? (
                    <div className={`flex items-center justify-center w-full py-12 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                        <p className="text-lg font-semibold">Failed to load content</p>
                    </div>
                ) : Array.isArray(items) && items.length > 0 ? (
                    continuousItems.map((item, index) => {
                        const posterUrl = item.poster_path
                            ? `${BASE_IMG}${item.poster_path}`
                            : item.backdrop_path
                                ? `${BASE_IMG}${item.backdrop_path}`
                                : "https://via.placeholder.com/300x450?text=No+Image";
                        const cardWidth = isLargeRow
                            ? "min-w-[160px] sm:min-w-[220px] max-w-[160px] sm:max-w-[220px] h-[240px] sm:h-[330px] flex-shrink-0"
                            : "min-w-[140px] sm:min-w-[180px] max-w-[140px] sm:max-w-[180px] h-[210px] sm:h-[270px] flex-shrink-0";
                        
                        const mediaType = getMediaType(item);
                        const inLib = isInUserLibrary(item.id, mediaType);
                        const fav = isUserFavorite(item.id, mediaType);

                        return (
                            <div
                                key={`${item.id}-${index}`}
                                onClick={() => {
                                    const media = getMediaType(item);
                                    navigate(`/details/${media}/${item.id}`);
                                }}
                                className={`relative group ${cardWidth} rounded-lg sm:rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 cursor-pointer ${
                                    theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                                }`}
                            >
                                <img
                                    src={posterUrl}
                                    alt={item.title || item.name}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.src = "https://via.placeholder.com/300x450?text=No+Image";
                                    }}
                                    className="w-full h-full object-cover transition-opacity duration-300"
                                />

                                <div className={`absolute inset-0 transition-colors duration-300 rounded-lg sm:rounded-xl pointer-events-none ${
                                    theme === "dark"
                                        ? "bg-black/0 group-hover:bg-black/40"
                                        : "bg-white/0 group-hover:bg-white/40"
                                }`} />

                                {/* Fav button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const media = getMediaType(item);
                                        toggleFavorite(item.id, media, {
                                            title: item.title || item.name || item.original_name,
                                            image: posterUrl,
                                            status: inLib ? "Watchlist" : "Favorites",
                                        });
                                        const loadUserData = async () => {
                                            const lib = await getLibrary();
                                            if (lib && Array.isArray(lib)) {
                                                setUserLibrary(lib);
                                            }
                                        };
                                        loadUserData();
                                    }}
                                    className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-20 rounded-full p-1.5 sm:p-2 pointer-events-auto transition-all duration-200 opacity-0 sm:opacity-100 group-hover:opacity-100 ${
                                        theme === "dark" ? "bg-black/60" : "bg-white/60"
                                    } ${fav ? "scale-110" : ""}`}
                                    title={fav ? "Unfavorite" : "Add to favorites"}
                                >
                                    <span
                                        className={`text-base sm:text-lg ${
                                            fav ? "text-pink-500" : theme === "dark" ? "text-white/90" : "text-gray-700"
                                        }`}
                                    >
                                        {fav ? "❤️" : "🤍"}
                                    </span>
                                </button>

                                {/* Add to Library button */}
                                <div className="absolute left-0 right-0 bottom-2 sm:bottom-3 flex justify-center pointer-events-none">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const media = getMediaType(item);
                                            toggleLibraryItem({
                                                id: item.id,
                                                title: item.title || item.name || item.original_name,
                                                image: posterUrl,
                                                type: media,
                                                status: "Watchlist",
                                                rating: item.vote_average ?? null,
                                            });
                                            const loadUserData = async () => {
                                                const lib = await getLibrary();
                                                if (lib && Array.isArray(lib)) {
                                                    setUserLibrary(lib);
                                                }
                                            };
                                            loadUserData();
                                        }}
                                        className={`pointer-events-auto px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm font-medium shadow-md transition-all duration-200 ${
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
                    <div className={`px-4 py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        No items found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Row;