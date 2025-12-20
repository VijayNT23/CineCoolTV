// src/pages/LibraryPage.js - UPDATED WITH SEARCH CONDITIONAL RENDERING
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getLibrary, saveLibrary } from "../utils/libraryUtils";
// Import Lucide Icons
import {
    Film,
    Tv,
    Sparkles,
    Folder,
    Bookmark as BookmarkIcon,
    Heart,
    ListChecks,
    Eye,
    HelpCircle,
    Trash2,
    RotateCw,
    ChevronRight
} from "lucide-react";

const LibraryPage = () => {
    const { currentUser } = useAuth();
    const { isDark } = useTheme();
    const [libraryItems, setLibraryItems] = useState([]);
    const [filter, setFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [bookmarks, setBookmarks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [updatingItemId, setUpdatingItemId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const lastUpdatedRef = useRef(null);
    const navigate = useNavigate();

    // 🧩 STEP 1: Add a helper flag
    const isSearching = searchQuery.trim().length > 0;

    // ✅ CRITICAL: Sanitizer function - KEEP ONLY PURE DATA
    const sanitizeLibraryItem = useCallback((item) => {
        // Remove all UI-only fields
        const {
            bookmarked,
            isUpdating,
            isStandaloneBookmark,
            ...cleanItem
        } = item;

        return {
            id: cleanItem.id,
            type: cleanItem.type,
            title: cleanItem.title || cleanItem.name,
            image: cleanItem.image || "https://via.placeholder.com/300x450?text=No+Image",
            status: cleanItem.status || "Watchlist",
            favorite: cleanItem.favorite || false,
            rating: cleanItem.rating || null,
            isRewatching: cleanItem.isRewatching || false,
            addedAt: cleanItem.addedAt || new Date().toISOString()
        };
    }, []);

    // Toast function
    const showToast = useCallback((msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 1500);
    }, []);

    // Load bookmarks from localStorage
    const loadBookmarks = useCallback(() => {
        try {
            const bookmarkData = JSON.parse(localStorage.getItem('bookmarks') || '[]');
            setBookmarks(bookmarkData);
            return bookmarkData;
        } catch (error) {
            console.error("Error loading bookmarks:", error);
            return [];
        }
    }, []);

    // Merge library items with bookmarks
    const mergeLibraryWithBookmarks = useCallback((lib, bookmarkData) => {
        if (!Array.isArray(lib)) return [];

        return lib.map(item => {
            const isBookmarked = bookmarkData.some(b =>
                String(b.id) === String(item.id) && b.type === item.type
            );
            return {
                ...item,
                bookmarked: isBookmarked,
                isUpdating: false
            };
        });
    }, []);

    // Load library and bookmarks - OPTIMIZED
    useEffect(() => {
        const loadLibrary = async () => {
            setIsLoading(true);
            if (!currentUser) {
                setLibraryItems([]);
                setBookmarks([]);
                lastUpdatedRef.current = JSON.stringify([]);
                setIsLoading(false);
                return;
            }

            try {
                const lib = await getLibrary();
                const bookmarkData = loadBookmarks();
                const mergedLib = mergeLibraryWithBookmarks(lib, bookmarkData);

                setLibraryItems(mergedLib);
                lastUpdatedRef.current = JSON.stringify(mergedLib);
            } catch (error) {
                console.error("Error loading library:", error);
                setLibraryItems([]);
                setBookmarks([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadLibrary();

        const handleLibUpdate = async (e) => {
            const updatedLib = e.detail || await getLibrary();
            const bookmarkData = loadBookmarks();
            const mergedLib = mergeLibraryWithBookmarks(updatedLib, bookmarkData);

            // Only update if library has actually changed
            const currentString = JSON.stringify(mergedLib);
            if (currentString !== lastUpdatedRef.current) {
                setLibraryItems(mergedLib);
                lastUpdatedRef.current = currentString;
            }
        };

        const handleBookmarkUpdate = () => {
            const bookmarkData = loadBookmarks();
            setLibraryItems(prev => {
                if (!Array.isArray(prev)) return [];
                return prev.map(item => ({
                    ...item,
                    bookmarked: bookmarkData.some(b =>
                        String(b.id) === String(item.id) && b.type === item.type
                    ),
                    isUpdating: false
                }));
            });
        };

        window.addEventListener("libraryUpdated", handleLibUpdate);
        window.addEventListener("bookmarksUpdated", handleBookmarkUpdate);

        return () => {
            window.removeEventListener("libraryUpdated", handleLibUpdate);
            window.removeEventListener("bookmarksUpdated", handleBookmarkUpdate);
        };
    }, [currentUser, loadBookmarks, mergeLibraryWithBookmarks]);

    const statusFilters = [
        { value: "All", icon: <Folder size={16} />, label: "All" },
        { value: "Watchlist", icon: <ListChecks size={16} />, label: "Watchlist" },
        { value: "Watching", icon: <Eye size={16} />, label: "Watching" },
        { value: "Considering", icon: <HelpCircle size={16} />, label: "Consider" },
        { value: "Dropped", icon: <Trash2 size={16} />, label: "Dropped" },
        { value: "Completed", icon: "✓", label: "Completed" },
        { value: "Rewatching", icon: <RotateCw size={16} />, label: "Rewatch" },
        { value: "Favorites", icon: <Heart size={16} />, label: "Favs" },
        { value: "Bookmarks", icon: <BookmarkIcon size={16} />, label: "Bookmarks" },
    ];

    const typeFilters = [
        { value: "All", icon: <Folder size={16} />, label: "All" },
        { value: "Movies", icon: <Film size={16} />, label: "Movies" },
        { value: "Series", icon: <Tv size={16} />, label: "Series" },
        { value: "Anime", icon: <Sparkles size={16} />, label: "Anime" },
    ];

    const detectContentType = useCallback((item) => {
        if (!item || !item.type) return "unknown";
        if (item.type === "anime") return "anime";
        if (item.type === "series" || item.type === "tv") return "series";
        if (item.type === "movie") return "movie";
        return item.type;
    }, []);

    // FIXED: Proper filtering logic with SEARCH
    const getFilteredItems = useCallback(() => {
        let items = [...libraryItems];

        // Apply type filter
        if (typeFilter !== "All") {
            items = items.filter(item => {
                const contentType = detectContentType(item);
                if (typeFilter === "Movies") return contentType === "movie";
                if (typeFilter === "Series") return contentType === "series";
                if (typeFilter === "Anime") return contentType === "anime";
                return true;
            });
        }

        // Apply status filter
        if (filter === "All") {
            // Keep current items
        } else if (filter === "Favorites") {
            items = items.filter(item => item.favorite === true);
        } else if (filter === "Bookmarks") {
            // Get bookmarked items from library
            const libraryBookmarks = items.filter(item => item.bookmarked === true);

            // Get standalone bookmarks that aren't in library
            const standaloneBookmarks = bookmarks
                .filter(bookmark => {
                    const isInLibrary = items.some(item =>
                        String(item.id) === String(bookmark.id) &&
                        item.type === bookmark.type
                    );
                    return !isInLibrary;
                })
                .map(bookmark => ({
                    id: bookmark.id,
                    type: bookmark.type,
                    title: bookmark.title,
                    image: bookmark.image,
                    bookmarked: true,
                    status: "Bookmarked",
                    favorite: false,
                    isStandaloneBookmark: true,
                    isUpdating: false
                }));

            items = [...libraryBookmarks, ...standaloneBookmarks];

            // Apply type filter to standalone bookmarks if needed
            if (typeFilter !== "All") {
                const filteredStandalone = standaloneBookmarks.filter(bookmark => {
                    const contentType = detectContentType(bookmark);
                    if (typeFilter === "Movies") return contentType === "movie";
                    if (typeFilter === "Series") return contentType === "series";
                    if (typeFilter === "Anime") return contentType === "anime";
                    return false;
                });

                items = [...libraryBookmarks, ...filteredStandalone];
            }
        } else if (filter === "Rewatching") {
            items = items.filter(item => item.status === "Completed" && item.isRewatching === true);
        } else {
            items = items.filter(item => item.status === filter);
        }

        // Apply search filter (case-insensitive)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                (item.title || "")
                    .toLowerCase()
                    .includes(query)
            );
        }

        return items;
    }, [libraryItems, filter, typeFilter, bookmarks, detectContentType, searchQuery]);

    const filteredItems = getFilteredItems();

    const getTypeStats = useCallback(() => {
        if (!Array.isArray(libraryItems)) {
            return {
                all: 0,
                movies: 0,
                series: 0,
                anime: 0,
                bookmarks: 0,
            };
        }

        const movies = libraryItems.filter(item => detectContentType(item) === "movie");
        const series = libraryItems.filter(item => detectContentType(item) === "series");
        const anime = libraryItems.filter(item => detectContentType(item) === "anime");
        const bookmarked = libraryItems.filter(item => item.bookmarked === true);
        const standaloneBookmarks = bookmarks.filter(bookmark =>
            !libraryItems.some(item =>
                String(item.id) === String(bookmark.id) && item.type === bookmark.type
            )
        );

        return {
            all: libraryItems.length + standaloneBookmarks.length,
            movies: movies.length,
            series: series.length,
            anime: anime.length,
            bookmarks: bookmarked.length + standaloneBookmarks.length,
        };
    }, [libraryItems, bookmarks, detectContentType]);

    const typeStats = getTypeStats();

    const handleFavoriteToggle = async (e, item) => {
        e.stopPropagation();
        const itemKey = `${item.type}-${item.id}`;
        setUpdatingItemId(itemKey);

        // Optimistic update
        const updated = libraryItems.map((i) =>
            i.id === item.id && i.type === item.type
                ? { ...i, favorite: !i.favorite, isUpdating: true }
                : i
        );

        setLibraryItems(updated);
        showToast(item.favorite ? "Removed from favorites" : "Added to favorites");

        try {
            // ✅ FIXED: Sanitize before saving
            const cleanLibrary = updated
                .filter(i => !i.isStandaloneBookmark)
                .map(sanitizeLibraryItem);

            await saveLibrary(cleanLibrary);
            window.dispatchEvent(new CustomEvent('libraryUpdated', {
                detail: cleanLibrary
            }));
        } catch (error) {
            console.error("Error updating favorite:", error);
            // Revert on error
            const reverted = updated.map((i) =>
                i.id === item.id && i.type === item.type
                    ? { ...i, favorite: item.favorite, isUpdating: false }
                    : i
            );
            setLibraryItems(reverted);
            showToast("Error updating favorite");
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleBookmarkToggle = async (e, item) => {
        e.stopPropagation();
        const itemKey = `${item.type}-${item.id}`;
        setUpdatingItemId(itemKey);

        const currentBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const isCurrentlyBookmarked = currentBookmarks.some(b =>
            String(b.id) === String(item.id) && b.type === item.type
        );

        let newBookmarks;

        if (isCurrentlyBookmarked) {
            // Remove from bookmarks
            newBookmarks = currentBookmarks.filter(b =>
                !(String(b.id) === String(item.id) && b.type === item.type)
            );
            showToast("Removed from bookmarks");
        } else {
            // Add to bookmarks
            newBookmarks = [...currentBookmarks, {
                id: item.id,
                type: item.type,
                title: item.title || item.name,
                image: item.image || "https://via.placeholder.com/300x450?text=No+Image",
                dateAdded: new Date().toISOString()
            }];
            showToast("Added to bookmarks");
        }

        // Update UI
        localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
        setBookmarks(newBookmarks);

        // Update library items
        setLibraryItems(prev => prev.map(i =>
            i.id === item.id && i.type === item.type
                ? { ...i, bookmarked: !isCurrentlyBookmarked, isUpdating: false }
                : i
        ));

        setUpdatingItemId(null);
        window.dispatchEvent(new Event('bookmarksUpdated'));
    };

    const handleFilterClick = useCallback((cat) => {
        setFilter((prev) => (prev === cat ? "All" : cat));
    }, []);

    const handleTypeFilterClick = useCallback((type) => {
        setTypeFilter((prev) => (prev === type ? "All" : type));
    }, []);

    const getStatusColor = useCallback((status, isFavorite, isStandaloneBookmark) => {
        if (isStandaloneBookmark) return "bg-gradient-to-r from-yellow-600 to-yellow-500";
        if (isFavorite) return "bg-gradient-to-r from-pink-600 to-red-500";
        switch (status) {
            case "Completed": return "bg-gradient-to-r from-green-600 to-green-500";
            case "Watching": return "bg-gradient-to-r from-yellow-500 to-yellow-400";
            case "Rewatching": return "bg-gradient-to-r from-blue-500 to-blue-400";
            case "Dropped": return "bg-gradient-to-r from-red-600 to-red-500";
            case "Considering": return "bg-gradient-to-r from-purple-600 to-purple-500";
            case "Watchlist": return "bg-gradient-to-r from-gray-700 to-gray-600";
            case "Bookmarked": return "bg-gradient-to-r from-yellow-600 to-yellow-500";
            default: return "bg-gradient-to-r from-gray-700 to-gray-600";
        }
    }, []);

    const getTypeIcon = useCallback((item) => {
        const contentType = detectContentType(item);
        switch (contentType) {
            case "movie": return <Film size={14} />;
            case "series": return <Tv size={14} />;
            case "anime": return <Sparkles size={14} />;
            default: return <Folder size={14} />;
        }
    }, [detectContentType]);

    const getTypeLabel = useCallback((item) => {
        const contentType = detectContentType(item);
        switch (contentType) {
            case "movie": return "Movie";
            case "series": return "Series";
            case "anime": return "Anime";
            default: return "Content";
        }
    }, [detectContentType]);

    // ✅ FIXED: Proper remove from library
    const handleRemoveFromLibrary = async (e, item) => {
        e.stopPropagation();
        e.preventDefault();

        const itemKey = `${item.type}-${item.id}`;
        setUpdatingItemId(itemKey);

        try {
            // Get current library
            const currentLib = await getLibrary();

            // Remove the item
            const updatedLib = currentLib.filter(libItem =>
                !(String(libItem.id) === String(item.id) && libItem.type === item.type)
            );

            // Save the sanitized library
            await saveLibrary(updatedLib);

            // Update UI immediately
            setLibraryItems(prev => prev.filter(i =>
                !(i.id === item.id && i.type === item.type)
            ));

            // Remove from bookmarks
            const currentBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
            const newBookmarks = currentBookmarks.filter(b =>
                !(String(b.id) === String(item.id) && b.type === item.type)
            );
            localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
            setBookmarks(newBookmarks);

            showToast("Removed from library");

            // ✅ CRITICAL: Dispatch events AFTER saving
            setTimeout(() => {
                window.dispatchEvent(new Event('bookmarksUpdated'));
                window.dispatchEvent(new CustomEvent('libraryUpdated', {
                    detail: updatedLib
                }));
            }, 100);

        } catch (error) {
            console.error("Error removing from library:", error);
            showToast("Error removing item");
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleRemoveStandaloneBookmark = async (e, item) => {
        e.stopPropagation();
        const itemKey = `${item.type}-${item.id}`;
        setUpdatingItemId(itemKey);

        const currentBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const newBookmarks = currentBookmarks.filter(b =>
            !(String(b.id) === String(item.id) && b.type === item.type)
        );

        localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
        setBookmarks(newBookmarks);
        showToast("Removed from bookmarks");

        // Update library items (remove standalone bookmark)
        setLibraryItems(prev => prev.filter(i =>
            !(i.id === item.id && i.type === item.type && i.isStandaloneBookmark)
        ));

        setUpdatingItemId(null);
        window.dispatchEvent(new Event('bookmarksUpdated'));
    };

    return (
        <div className={`pt-16 sm:pt-24 px-3 sm:px-6 pb-6 sm:pb-16 min-h-screen transition-all duration-300 ${
            isDark
                ? "bg-gradient-to-b from-[#0b0b0b] to-black"
                : "bg-gradient-to-b from-gray-50 to-gray-100"
        }`}>
            <div className="max-w-7xl mx-auto">
                {/* Header - Centered */}
                <div className="flex flex-col items-center mb-6 sm:mb-12 px-2">
                    <h2 className={`text-xl sm:text-4xl font-bold mb-2 sm:mb-4 ${
                        isDark ? "text-blue-400" : "text-blue-600"
                    }`}>
                        🎬 My Library
                    </h2>
                    <p className={`text-xs sm:text-base ${
                        isDark ? "text-gray-400" : "text-gray-600"
                    } text-center max-w-md`}>
                        Manage your watchlist, track progress, and organize your favorite content
                    </p>
                </div>

                {/* Search Bar - ALWAYS VISIBLE */}
                <div className="flex justify-center mb-6 sm:mb-10 px-2">
                    <div className="relative w-full max-w-xl">
                        <input
                            type="text"
                            placeholder="Search in your library..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl border transition-all duration-200 text-sm sm:text-base ${
                                isDark
                                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            }`}
                        />

                        {/* Search Icon */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            🔍
                        </div>

                        {/* Clear Button */}
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                title="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Type Filter Tabs - ONLY WHEN NOT SEARCHING */}
                {!isSearching && (
                    <div className="flex justify-center mb-6 sm:mb-10 px-2">
                        <div className="flex overflow-x-auto gap-2 sm:gap-4 pb-2 scrollbar-hide max-w-full w-full justify-center">
                            {typeFilters.map((type) => {
                                const isActive = typeFilter === type.value;
                                return (
                                    <button
                                        key={type.value}
                                        onClick={() => handleTypeFilterClick(type.value)}
                                        className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0 whitespace-nowrap ${
                                            isActive
                                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                                                : isDark
                                                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                                        }`}
                                    >
                                        <span className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5">
                                            {type.icon}
                                        </span>
                                        <span className="truncate">{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Status Filter Tabs - ONLY WHEN NOT SEARCHING */}
                {!isSearching && (
                    <div className="flex justify-center mb-6 sm:mb-12 px-2">
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-4xl w-full">
                            {statusFilters.map((cat) => {
                                const isActive = filter === cat.value;
                                return (
                                    <button
                                        key={cat.value}
                                        onClick={() => handleFilterClick(cat.value)}
                                        className={`flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                                            isActive
                                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                                                : isDark
                                                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                                        }`}
                                    >
                                        <span className="flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4">
                                            {cat.icon}
                                        </span>
                                        <span className="truncate">{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Library Overview - ONLY WHEN NOT SEARCHING */}
                {!isSearching && (
                    <div className="flex justify-center mb-6 sm:mb-12 px-2">
                        <div className={`rounded-xl sm:rounded-3xl p-4 sm:p-8 shadow-lg sm:shadow-xl max-w-2xl w-full ${
                            isDark ? "bg-gray-800/80" : "bg-white/90"
                        }`}>
                            <div className="flex flex-col items-center mb-4 sm:mb-6">
                                <h3 className={`text-base sm:text-2xl font-bold mb-1 sm:mb-2 ${
                                    isDark ? "text-white" : "text-gray-900"
                                }`}>📊 Library Overview</h3>
                                <p className={`text-xs sm:text-sm ${
                                    isDark ? "text-gray-400" : "text-gray-600"
                                } text-center`}>
                                    Your content statistics at a glance
                                </p>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-6 text-center">
                                <div className={`p-3 sm:p-5 rounded-lg sm:rounded-2xl ${
                                    isDark ? "bg-blue-900/20" : "bg-blue-50"
                                }`}>
                                    <div className="flex flex-col items-center">
                                        <span className={`text-lg sm:text-3xl font-bold mb-1 sm:mb-2 ${
                                            isDark ? "text-blue-400" : "text-blue-600"
                                        }`}>{typeStats.all}</span>
                                        <div className={`text-[10px] sm:text-sm ${
                                            isDark ? "text-gray-400" : "text-gray-600"
                                        }`}>Total</div>
                                    </div>
                                </div>
                                <div className={`p-3 sm:p-5 rounded-lg sm:rounded-2xl ${
                                    isDark ? "bg-green-900/20" : "bg-green-50"
                                }`}>
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-green-500">
                                            <Film size={16} className="sm:w-5 sm:h-5" />
                                        </div>
                                        <div className={`text-[10px] sm:text-sm ${
                                            isDark ? "text-gray-400" : "text-gray-600"
                                        }`}>Movies</div>
                                    </div>
                                </div>
                                <div className={`p-3 sm:p-5 rounded-lg sm:rounded-2xl ${
                                    isDark ? "bg-purple-900/20" : "bg-purple-50"
                                }`}>
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-purple-500">
                                            <Tv size={16} className="sm:w-5 sm:h-5" />
                                        </div>
                                        <div className={`text-[10px] sm:text-sm ${
                                            isDark ? "text-gray-400" : "text-gray-600"
                                        }`}>Series</div>
                                    </div>
                                </div>
                                <div className={`p-3 sm:p-5 rounded-lg sm:rounded-2xl ${
                                    isDark ? "bg-pink-900/20" : "bg-pink-50"
                                }`}>
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-pink-500">
                                            <Sparkles size={16} className="sm:w-5 sm:h-5" />
                                        </div>
                                        <div className={`text-[10px] sm:text-sm ${
                                            isDark ? "text-gray-400" : "text-gray-600"
                                        }`}>Anime</div>
                                    </div>
                                </div>
                                <div className={`p-3 sm:p-5 rounded-lg sm:rounded-2xl ${
                                    isDark ? "bg-yellow-900/20" : "bg-yellow-50"
                                }`}>
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-yellow-500">
                                            <BookmarkIcon size={16} className="sm:w-5 sm:h-5" />
                                        </div>
                                        <div className={`text-[10px] sm:text-sm ${
                                            isDark ? "text-gray-400" : "text-gray-600"
                                        }`}>Bookmarks</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Optional Polish: Search Results Label */}
                {isSearching && (
                    <div className="flex justify-center mb-4 sm:mb-6 px-2">
                        <p className={`text-sm sm:text-base ${
                            isDark ? "text-gray-300" : "text-gray-600"
                        } text-center`}>
                            🔍 Showing results for "<span className="font-semibold">{searchQuery}</span>"
                        </p>
                    </div>
                )}

                {/* Loading State */}
                {isLoading ? (
                    <div className={`text-center py-12 sm:py-20 ${isSearching ? 'py-6 sm:py-10' : ''}`}>
                        <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500 mb-3 sm:mb-4"></div>
                        <p className={`text-sm sm:text-xl mb-3 sm:mb-6 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                        }`}>
                            Loading your library...
                        </p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className={`text-center py-12 sm:py-20 ${isSearching ? 'py-6 sm:py-10' : ''}`}>
                        <div className="text-4xl sm:text-7xl mb-3 sm:mb-6">
                            {searchQuery ? "🔍" : "📚"}
                        </div>
                        <p className={`text-base sm:text-xl mb-3 sm:mb-6 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                        }`}>
                            {searchQuery
                                ? `No results found for "${searchQuery}"`
                                : typeFilter === 'All' && filter === 'All'
                                    ? "Your library is empty. Add some content to get started!"
                                    : typeFilter !== 'All' && filter === 'All'
                                        ? `No ${typeFilter.toLowerCase()} found in your library.`
                                        : filter !== 'All'
                                            ? `No ${filter.toLowerCase()} found in ${typeFilter.toLowerCase() === 'all' ? 'your library' : typeFilter.toLowerCase()}.`
                                            : "No items found."}
                        </p>
                        {searchQuery && (
                            <p className={`text-xs sm:text-base ${
                                isDark ? "text-gray-500" : "text-gray-400"
                            } mb-4`}>
                                Try a different search term or clear the search
                            </p>
                        )}
                        <p className={`text-xs sm:text-base ${
                            isDark ? "text-gray-500" : "text-gray-400"
                        }`}>
                            Go to Movies or Series tabs to add content to your library!
                        </p>
                    </div>
                ) : (
                    // Cards Container with Dynamic Spacing
                    <div className={`grid gap-4 sm:gap-6 md:gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-all px-2 sm:px-0 ${
                        isSearching ? "mt-4" : "mt-16"
                    }`}>
                        {filteredItems.map((item) => {
                            const isStandaloneBookmark = item.isStandaloneBookmark;
                            const itemKey = `${item.type}-${item.id}`;
                            const isUpdating = updatingItemId === itemKey || item.isUpdating;

                            return (
                                <div
                                    key={itemKey}
                                    onClick={() => !isUpdating && navigate(`/details/${item.type}/${item.id}`)}
                                    className={`relative group rounded-xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer ${
                                        isDark ? "bg-gray-800" : "bg-white"
                                    } ${isUpdating ? 'opacity-70' : ''}`}
                                >
                                    <div className="relative">
                                        <img
                                            src={
                                                item.image ||
                                                "https://via.placeholder.com/300x450?text=No+Image"
                                            }
                                            alt={item.title || "Untitled"}
                                            onError={(e) =>
                                                (e.target.src =
                                                    "https://via.placeholder.com/300x450?text=No+Image")
                                            }
                                            className="w-full h-40 sm:h-56 md:h-64 lg:h-72 object-cover group-hover:opacity-80 transition-opacity duration-300"
                                        />

                                        {/* Type Badge */}
                                        <div className={`absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-2 max-w-[70%] sm:max-w-none ${
                                            isDark ? "bg-gray-900/90 text-white" : "bg-black/80 text-white"
                                        }`}>
                                            {getTypeIcon(item)}
                                            <span className="truncate">{getTypeLabel(item)}</span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1 sm:gap-2">
                                            {/* Favorite toggle - only for library items */}
                                            {!isStandaloneBookmark && (
                                                <button
                                                    onClick={(e) => !isUpdating && handleFavoriteToggle(e, item)}
                                                    disabled={isUpdating}
                                                    className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:scale-105 sm:hover:scale-110 transition-transform z-20 ${
                                                        isDark ? "bg-gray-900/90" : "bg-black/80"
                                                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title={item.favorite ? "Remove from favorites" : "Add to favorites"}
                                                >
                                                    {isUpdating ? (
                                                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t border-white"></div>
                                                    ) : item.favorite ? (
                                                        <Heart size={14} className="sm:w-4 sm:h-4 text-red-500 fill-red-500" />
                                                    ) : (
                                                        <Heart size={14} className="sm:w-4 sm:h-4 text-white" />
                                                    )}
                                                </button>
                                            )}

                                            {/* Bookmark toggle */}
                                            <button
                                                onClick={(e) => !isUpdating && handleBookmarkToggle(e, item)}
                                                disabled={isUpdating}
                                                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:scale-105 sm:hover:scale-110 transition-transform z-20 ${
                                                    isDark ? "bg-gray-900/90" : "bg-black/80"
                                                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={item.bookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
                                            >
                                                {isUpdating ? (
                                                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:h-4 border-t border-white"></div>
                                                ) : item.bookmarked ? (
                                                    <BookmarkIcon size={14} className="sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
                                                ) : (
                                                    <BookmarkIcon size={14} className="sm:w-4 sm:h-4 text-white" />
                                                )}
                                            </button>

                                            {/* Remove button */}
                                            {isStandaloneBookmark ? (
                                                <button
                                                    onClick={(e) => !isUpdating && handleRemoveStandaloneBookmark(e, item)}
                                                    disabled={isUpdating}
                                                    className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:scale-105 sm:hover:scale-110 transition-transform z-20 ${
                                                        isDark ? "bg-gray-900/90" : "bg-black/80"
                                                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title="Remove from bookmarks"
                                                >
                                                    {isUpdating ? (
                                                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:h-4 border-t border-white"></div>
                                                    ) : (
                                                        <Trash2 size={14} className="sm:w-4 sm:h-4 text-white" />
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => !isUpdating && handleRemoveFromLibrary(e, item)}
                                                    disabled={isUpdating}
                                                    className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:scale-105 sm:hover:scale-110 transition-transform z-20 ${
                                                        isDark ? "bg-gray-900/90" : "bg-black/80"
                                                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title="Remove from library"
                                                >
                                                    {isUpdating ? (
                                                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:h-4 border-t border-white"></div>
                                                    ) : (
                                                        <Trash2 size={14} className="sm:w-4 sm:h-4 text-white" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 text-white z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                        <h3 className="text-sm sm:text-lg md:text-xl font-bold line-clamp-2 mb-1 sm:mb-2">
                                            {item.title || "Untitled"}
                                        </h3>
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-xs sm:text-sm">
                                            <span
                                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg ${getStatusColor(item.status, item.favorite, isStandaloneBookmark)} text-white flex items-center gap-1 w-fit`}
                                            >
                                                {item.favorite ? (
                                                    <>
                                                        <Heart size={10} className="sm:w-3 sm:h-3" />
                                                        <span>Favorite</span>
                                                    </>
                                                ) : isStandaloneBookmark ? (
                                                    <>
                                                        <BookmarkIcon size={10} className="sm:w-3 sm:h-3" />
                                                        <span>Bookmarked</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        {item.status === "Rewatching" && <RotateCw size={10} className="sm:w-3 sm:h-3" />}
                                                        {item.status === "Watching" && <Eye size={10} className="sm:w-3 sm:h-3" />}
                                                        {item.status === "Considering" && <HelpCircle size={10} className="sm:w-3 sm:h-3" />}
                                                        {item.status === "Completed" && <span className="text-xs sm:text-sm">✓</span>}
                                                        {item.status === "Dropped" && <Trash2 size={10} className="sm:w-3 sm:h-3" />}
                                                        {item.status === "Watchlist" && <ListChecks size={10} className="sm:w-3 sm:h-3" />}
                                                        {item.status === "Bookmarked" && <BookmarkIcon size={10} className="sm:w-3 sm:h-3" />}
                                                        <span className="truncate">
                                                            {item.status === "Rewatching" ? "Rewatch" :
                                                                item.status === "Considering" ? "Consider" :
                                                                    item.status === "Bookmarked" ? "Bookmarked" :
                                                                        item.status}
                                                        </span>
                                                    </>
                                                )}
                                            </span>
                                            <span className="text-xs sm:text-sm bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded flex items-center gap-1 w-fit">
                                                {getTypeIcon(item)}
                                                <span>{getTypeLabel(item)}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Toast Message */}
                {toast && (
                    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 bg-black/90 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm shadow-lg z-50 animate-fadeIn max-w-[90%] sm:max-w-none">
                        {toast}
                    </div>
                )}

                {/* Link to Profile Stats - ONLY WHEN NOT SEARCHING */}
                {!isSearching && (
                    <div className="mt-8 sm:mt-16 flex justify-center px-2 sm:px-0">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-3xl p-4 sm:p-8 md:p-10 text-white max-w-2xl w-full text-center">
                            <h3 className="text-base sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-6">📊 View Detailed Statistics</h3>
                            <p className="text-sm sm:text-lg md:text-xl mb-4 sm:mb-8 text-blue-100">
                                Check your watch time, top genres, and track your progress in your profile!
                            </p>
                            <button
                                onClick={() => navigate('/profile')}
                                className="bg-white text-blue-600 px-4 sm:px-8 md:px-10 py-2 sm:py-4 rounded-lg sm:rounded-2xl font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base flex items-center justify-center gap-1 sm:gap-2 mx-auto"
                            >
                                View Profile Stats
                                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LibraryPage;