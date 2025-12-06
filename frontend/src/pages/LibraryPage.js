// src/pages/LibraryPage.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
    getLibrary,
    saveLibrary,
} from "../utils/libraryUtils";

// Import Lucide Icons
import { 
    Film, 
    Tv, 
    Sparkles, 
    Folder,
    Bookmark as BookmarkIcon,
    Heart,
    Clock,
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
    const lastUpdatedRef = useRef(null);
    const navigate = useNavigate();

    // Load library and bookmarks - UPDATED
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

            const lib = await getLibrary();
            console.log("Library loaded:", lib); // Debug log
            
            // Load bookmarks from localStorage
            const bookmarkData = JSON.parse(localStorage.getItem('bookmarks') || '[]');
            console.log("Bookmarks loaded:", bookmarkData); // Debug log
            
            // Merge bookmarks status into library items
            const mergedLib = (lib || []).map(item => {
                const isBookmarked = bookmarkData.some(b => 
                    b.id.toString() === item.id.toString() && b.type === item.type
                );
                console.log(`Item ${item.id} (${item.type}) is bookmarked:`, isBookmarked); // Debug log
                return {
                    ...item,
                    bookmarked: isBookmarked
                };
            });
            
            console.log("Merged library:", mergedLib); // Debug log
            setLibraryItems(mergedLib);
            setBookmarks(bookmarkData);
            lastUpdatedRef.current = JSON.stringify(mergedLib);
            setIsLoading(false);
        };
        loadLibrary();

        const handleLibUpdate = (e) => {
            console.log("Library updated event received"); // Debug log
            const bookmarkData = JSON.parse(localStorage.getItem('bookmarks') || '[]');
            
            // If event has detail, use it, otherwise reload
            if (e.detail) {
                const newLib = e.detail;
                
                // Merge bookmarks status into new library items
                const mergedLib = newLib.map(item => ({
                    ...item,
                    bookmarked: bookmarkData.some(b => 
                        b.id.toString() === item.id.toString() && b.type === item.type
                    )
                }));
                
                const newSerialized = JSON.stringify(mergedLib);
                if (newSerialized !== lastUpdatedRef.current) {
                    setLibraryItems(mergedLib);
                    setBookmarks(bookmarkData);
                    lastUpdatedRef.current = newSerialized;
                }
            } else {
                // Reload library if no detail provided
                loadLibrary();
            }
        };

        const handleBookmarkUpdate = () => {
            console.log("Bookmarks updated event received"); // Debug log
            const bookmarkData = JSON.parse(localStorage.getItem('bookmarks') || '[]');
            console.log("Updated bookmarks:", bookmarkData); // Debug log
            setBookmarks(bookmarkData);
            
            // Update library items with new bookmark status
            setLibraryItems(prev => prev.map(item => ({
                ...item,
                bookmarked: bookmarkData.some(b => 
                    b.id.toString() === item.id.toString() && b.type === item.type
                )
            })));
            
            // Also reload library to sync any changes
            loadLibrary();
        };

        window.addEventListener("libraryUpdated", handleLibUpdate);
        window.addEventListener("bookmarksUpdated", handleBookmarkUpdate);
        
        return () => {
            window.removeEventListener("libraryUpdated", handleLibUpdate);
            window.removeEventListener("bookmarksUpdated", handleBookmarkUpdate);
        };
    }, [currentUser]);

    const statusFilters = [
        { value: "All", icon: <Folder size={18} />, label: "All" },
        { value: "Watchlist", icon: <ListChecks size={18} />, label: "Watchlist" },
        { value: "Watching", icon: <Eye size={18} />, label: "Watching" },
        { value: "Considering", icon: <HelpCircle size={18} />, label: "Consider" },
        { value: "Dropped", icon: <Trash2 size={18} />, label: "Dropped" },
        { value: "Completed", icon: "✓", label: "Completed" },
        { value: "Rewatching", icon: <RotateCw size={18} />, label: "Rewatch" },
        { value: "Favorites", icon: <Heart size={18} />, label: "Favs" },
        { value: "Bookmarks", icon: <BookmarkIcon size={18} />, label: "Bookmarks" },
    ];

    const typeFilters = [
        { value: "All", icon: <Folder size={20} />, label: "All" },
        { value: "Movies", icon: <Film size={20} />, label: "Movies" },
        { value: "Series", icon: <Tv size={20} />, label: "Series" },
        { value: "Anime", icon: <Sparkles size={20} />, label: "Anime" },
    ];

    const detectContentType = (item) => {
        if (item.type === "anime") return "anime";
        if (item.type === "series" || item.type === "tv") return "series";
        if (item.type === "movie") return "movie";
        return item.type;
    };

    const getFilteredItems = () => {
        let items = libraryItems;

        if (typeFilter !== "All") {
            items = items.filter(item => {
                const contentType = detectContentType(item);
                if (typeFilter === "Movies") return contentType === "movie";
                if (typeFilter === "Series") return contentType === "series";
                if (typeFilter === "Anime") return contentType === "anime";
                return true;
            });
        }

        if (filter === "All") return items;
        if (filter === "Favorites") return items.filter((i) => i.favorite);
        if (filter === "Bookmarks") {
            // Show bookmarked items from library AND standalone bookmarks
            const libraryBookmarks = items.filter(item => item.bookmarked);
            
            // Also include standalone bookmarks that aren't in the library
            const standaloneBookmarks = bookmarks.filter(bookmark => 
                !libraryItems.some(item => 
                    String(item.id) === String(bookmark.id) && item.type === bookmark.type
                )
            ).map(bookmark => ({
                id: bookmark.id,
                type: bookmark.type,
                title: bookmark.title,
                image: bookmark.image,
                bookmarked: true,
                status: "Bookmarked", // Special status for standalone bookmarks
                favorite: false,
                isStandaloneBookmark: true
            }));
            
            return [...libraryBookmarks, ...standaloneBookmarks];
        }
        return items.filter((i) => i.status === filter);
    };

    const filteredItems = getFilteredItems();

    const getTypeStats = () => {
        const movies = libraryItems.filter(item => detectContentType(item) === "movie");
        const series = libraryItems.filter(item => detectContentType(item) === "series");
        const anime = libraryItems.filter(item => detectContentType(item) === "anime");
        const bookmarked = libraryItems.filter(item => item.bookmarked);
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
        window.dispatchEvent(new CustomEvent('libraryUpdated', { detail: updated }));
    };

    const handleBookmarkToggle = async (e, item) => {
        e.stopPropagation();
        
        const currentBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        let newBookmarks;
        
        if (item.bookmarked) {
            // Remove from bookmarks
            newBookmarks = currentBookmarks.filter(b => 
                !(b.id.toString() === item.id.toString() && b.type === item.type)
            );
            console.log("Removing bookmark for:", item.id, item.type); // Debug log
        } else {
            // Add to bookmarks
            newBookmarks = [...currentBookmarks, {
                id: item.id,
                type: item.type,
                title: item.title || item.name,
                image: item.image || "https://via.placeholder.com/300x450?text=No+Image",
                dateAdded: new Date().toISOString()
            }];
            console.log("Adding bookmark for:", item.id, item.type); // Debug log
        }
        
        localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
        console.log("Updated bookmarks in localStorage:", newBookmarks); // Debug log
        
        // Update local state
        setBookmarks(newBookmarks);
        
        // If item is in library, update its bookmarked status
        if (libraryItems.some(i => i.id === item.id && i.type === item.type)) {
            setLibraryItems(prev => prev.map(i => 
                i.id === item.id && i.type === item.type
                    ? { ...i, bookmarked: !item.bookmarked }
                    : i
            ));
        } else {
            // If it's a standalone bookmark that was removed, reload library
            const lib = await getLibrary();
            const updatedLib = (lib || []).map(i => ({
                ...i,
                bookmarked: newBookmarks.some(b => 
                    b.id.toString() === i.id.toString() && b.type === i.type
                )
            }));
            setLibraryItems(updatedLib);
        }
        
        window.dispatchEvent(new Event('bookmarksUpdated'));
    };

    const handleFilterClick = (cat) => {
        setFilter((prev) => (prev === cat ? "All" : cat));
    };

    const handleTypeFilterClick = (type) => {
        setTypeFilter((prev) => (prev === type ? "All" : type));
    };

    const getStatusColor = (status, isFavorite, isStandaloneBookmark) => {
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
    };

    const getTypeIcon = (item) => {
        const contentType = detectContentType(item);
        switch (contentType) {
            case "movie": return <Film size={16} />;
            case "series": return <Tv size={16} />;
            case "anime": return <Sparkles size={16} />;
            default: return <Folder size={16} />;
        }
    };

    const getTypeLabel = (item) => {
        const contentType = detectContentType(item);
        switch (contentType) {
            case "movie": return "Movie";
            case "series": return "Series";
            case "anime": return "Anime";
            default: return "Content";
        }
    };

    const handleRemoveFromLibrary = async (e, item) => {
        e.stopPropagation();
        const updated = libraryItems.filter(i => 
            !(i.id === item.id && i.type === item.type)
        );
        await saveLibrary(updated);
        setLibraryItems(updated);
        
        // Remove from bookmarks
        const currentBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const newBookmarks = currentBookmarks.filter(b => 
            !(b.id.toString() === item.id.toString() && b.type === item.type)
        );
        localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
        window.dispatchEvent(new Event('bookmarksUpdated'));
        
        window.dispatchEvent(new CustomEvent('libraryUpdated', { detail: updated }));
    };

    const handleRemoveStandaloneBookmark = async (e, item) => {
        e.stopPropagation();
        
        // Remove from bookmarks
        const currentBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const newBookmarks = currentBookmarks.filter(b => 
            !(b.id.toString() === item.id.toString() && b.type === item.type)
        );
        localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
        setBookmarks(newBookmarks);
        
        window.dispatchEvent(new Event('bookmarksUpdated'));
    };

    return (
        <div className={`pt-20 sm:pt-24 px-4 sm:px-6 pb-8 sm:pb-16 min-h-screen transition-all duration-500 ${
            isDark
                ? "bg-gradient-to-b from-[#0b0b0b] to-black"
                : "bg-gradient-to-b from-gray-50 to-gray-100"
        }`}>
            <div className="max-w-7xl mx-auto">
                {/* Header - Centered */}
                <div className="flex flex-col items-center mb-8 sm:mb-12">
                    <h2 className={`text-2xl sm:text-4xl font-bold mb-4 ${
                        isDark ? "text-blue-400" : "text-blue-600"
                    }`}>
                        🎬 My Library
                    </h2>
                    <p className={`text-sm sm:text-base ${
                        isDark ? "text-gray-400" : "text-gray-600"
                    } text-center max-w-md`}>
                        Manage your watchlist, track progress, and organize your favorite content
                    </p>
                </div>

                {/* Type Filter Tabs - CENTERED AND WITHOUT NUMBERS */}
                <div className="flex justify-center mb-8 sm:mb-10">
                    <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-3 scrollbar-hide max-w-full px-4">
                        {typeFilters.map((type) => {
                            const isActive = typeFilter === type.value;
                            return (
                                <button
                                    key={type.value}
                                    onClick={() => handleTypeFilterClick(type.value)}
                                    className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium transition-all duration-300 shadow-lg flex-shrink-0 ${
                                        isActive
                                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-105"
                                            : isDark
                                                ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105"
                                                : "bg-white text-gray-700 hover:bg-gray-200 hover:scale-105"
                                    }`}
                                >
                                    <span className="flex items-center justify-center w-5 h-5">
                                        {type.icon}
                                    </span>
                                    <span>{type.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Status Filter Tabs - CENTERED */}
                <div className="flex justify-center mb-8 sm:mb-12">
                    <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl">
                        {statusFilters.map((cat) => {
                            const isActive = filter === cat.value;
                            return (
                                <button
                                    key={cat.value}
                                    onClick={() => handleFilterClick(cat.value)}
                                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg ${
                                        isActive
                                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-105"
                                            : isDark
                                                ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105"
                                                : "bg-white text-gray-700 hover:bg-gray-200 hover:scale-105"
                                    }`}
                                >
                                    <span className="flex items-center justify-center w-4 h-4">
                                        {cat.icon}
                                    </span>
                                    <span>{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Stats Summary - CENTERED AND WITHOUT NUMBERS */}
                <div className="flex justify-center mb-8 sm:mb-12">
                    <div className={`rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl w-full ${
                        isDark ? "bg-gray-800" : "bg-white"
                    }`}>
                        <div className="flex flex-col items-center mb-6">
                            <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${
                                isDark ? "text-white" : "text-gray-900"
                            }`}>📊 Library Overview</h3>
                            <p className={`text-sm ${
                                isDark ? "text-gray-400" : "text-gray-600"
                            } text-center`}>
                                Your content statistics at a glance
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 text-center">
                            <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl ${
                                isDark ? "bg-blue-900/20" : "bg-blue-50"
                            }`}>
                                <div className="flex flex-col items-center">
                                    <span className={`text-2xl sm:text-3xl font-bold mb-2 ${
                                        isDark ? "text-blue-400" : "text-blue-600"
                                    }`}>{typeStats.all}</span>
                                    <div className={`text-xs sm:text-sm ${
                                        isDark ? "text-gray-400" : "text-gray-600"
                                    }`}>Total</div>
                                </div>
                            </div>
                            <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl ${
                                isDark ? "bg-green-900/20" : "bg-green-50"
                            }`}>
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center justify-center w-6 h-6 mb-2 text-green-500">
                                        <Film size={20} />
                                    </div>
                                    <div className={`text-xs sm:text-sm ${
                                        isDark ? "text-gray-400" : "text-gray-600"
                                    }`}>Movies</div>
                                </div>
                            </div>
                            <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl ${
                                isDark ? "bg-purple-900/20" : "bg-purple-50"
                            }`}>
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center justify-center w-6 h-6 mb-2 text-purple-500">
                                        <Tv size={20} />
                                    </div>
                                    <div className={`text-xs sm:text-sm ${
                                        isDark ? "text-gray-400" : "text-gray-600"
                                    }`}>Series</div>
                                </div>
                            </div>
                            <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl ${
                                isDark ? "bg-pink-900/20" : "bg-pink-50"
                            }`}>
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center justify-center w-6 h-6 mb-2 text-pink-500">
                                        <Sparkles size={20} />
                                    </div>
                                    <div className={`text-xs sm:text-sm ${
                                        isDark ? "text-gray-400" : "text-gray-600"
                                    }`}>Anime</div>
                                </div>
                            </div>
                            <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl ${
                                isDark ? "bg-yellow-900/20" : "bg-yellow-50"
                            }`}>
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center justify-center w-6 h-6 mb-2 text-yellow-500">
                                        <BookmarkIcon size={20} />
                                    </div>
                                    <div className={`text-xs sm:text-sm ${
                                        isDark ? "text-gray-400" : "text-gray-600"
                                    }`}>Bookmarks</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="text-center py-16 sm:py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                        <p className={`text-lg sm:text-xl mb-4 sm:mb-6 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                        }`}>
                            Loading your library...
                        </p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-16 sm:py-20">
                        <div className="text-5xl sm:text-7xl mb-4 sm:mb-6">📚</div>
                        <p className={`text-lg sm:text-xl mb-4 sm:mb-6 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                        }`}>
                            {typeFilter === 'All' && filter === 'All'
                                ? "Your library is empty. Add some content to get started!"
                                : typeFilter !== 'All' && filter === 'All'
                                ? `No ${typeFilter.toLowerCase()} found in your library.`
                                : filter !== 'All'
                                ? `No ${filter.toLowerCase()} found in ${typeFilter.toLowerCase() === 'all' ? 'your library' : typeFilter.toLowerCase()}.`
                                : "No items found."}
                        </p>
                        <p className={`text-sm sm:text-base ${
                            isDark ? "text-gray-500" : "text-gray-400"
                        }`}>
                            Go to Movies or Series tabs to add content to your library!
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:gap-8 md:gap-10 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-all">
                        {filteredItems.map((item) => {
                            const isStandaloneBookmark = item.isStandaloneBookmark;
                            return (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    onClick={() => navigate(`/details/${item.type}/${item.id}`)}
                                    className={`relative group rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer ${
                                        isDark ? "bg-gray-800" : "bg-white"
                                    }`}
                                >
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
                                        className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover group-hover:opacity-80 transition-opacity duration-300"
                                    />

                                    {/* Type Badge */}
                                    <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                                        isDark ? "bg-gray-900/90 text-white" : "bg-black/80 text-white"
                                    }`}>
                                        {getTypeIcon(item)}
                                        <span>{getTypeLabel(item)}</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="absolute top-3 right-3 flex gap-2">
                                        {/* Favorite toggle - only for library items */}
                                        {!isStandaloneBookmark && (
                                            <button
                                                onClick={(e) => handleFavoriteToggle(e, item)}
                                                className={`p-2 rounded-full hover:scale-110 transition-transform z-20 ${
                                                    isDark ? "bg-gray-900/90" : "bg-black/80"
                                                }`}
                                                title={item.favorite ? "Remove from favorites" : "Add to favorites"}
                                            >
                                                {item.favorite ? (
                                                    <Heart size={18} className="text-red-500 fill-red-500" />
                                                ) : (
                                                    <Heart size={18} className="text-white" />
                                                )}
                                            </button>
                                        )}
                                        
                                        {/* Bookmark toggle */}
                                        <button
                                            onClick={(e) => handleBookmarkToggle(e, item)}
                                            className={`p-2 rounded-full hover:scale-110 transition-transform z-20 ${
                                                isDark ? "bg-gray-900/90" : "bg-black/80"
                                            }`}
                                            title={item.bookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
                                        >
                                            {item.bookmarked ? (
                                                <BookmarkIcon size={18} className="text-yellow-400 fill-yellow-400" />
                                            ) : (
                                                <BookmarkIcon size={18} className="text-white" />
                                            )}
                                        </button>
                                        
                                        {/* Remove button - different for standalone bookmarks vs library items */}
                                        {isStandaloneBookmark ? (
                                            <button
                                                onClick={(e) => handleRemoveStandaloneBookmark(e, item)}
                                                className={`p-2 rounded-full hover:scale-110 transition-transform z-20 ${
                                                    isDark ? "bg-gray-900/90" : "bg-black/80"
                                                }`}
                                                title="Remove from bookmarks"
                                            >
                                                <Trash2 size={18} className="text-white" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => handleRemoveFromLibrary(e, item)}
                                                className={`p-2 rounded-full hover:scale-110 transition-transform z-20 ${
                                                    isDark ? "bg-gray-900/90" : "bg-black/80"
                                                }`}
                                                title="Remove from library"
                                            >
                                                <Trash2 size={18} className="text-white" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Bookmark Badge */}
                                    {item.bookmarked && (
                                        <div className="absolute top-3 left-32 bg-yellow-500/90 text-black px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1">
                                            <BookmarkIcon size={12} />
                                            <span>Bookmarked</span>
                                        </div>
                                    )}

                                    {/* Info overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                        <h3 className="text-base sm:text-lg md:text-xl font-bold line-clamp-2 mb-2">
                                            {item.title || "Untitled"}
                                        </h3>
                                        <div className="flex justify-between items-center text-sm">
                                            <span
                                                className={`px-3 py-1.5 rounded-lg ${getStatusColor(item.status, item.favorite, isStandaloneBookmark)} text-white flex items-center gap-1`}
                                            >
                                                {item.favorite ? (
                                                    <>
                                                        <Heart size={12} />
                                                        <span>Favorite</span>
                                                    </>
                                                ) : isStandaloneBookmark ? (
                                                    <>
                                                        <BookmarkIcon size={12} />
                                                        <span>Bookmarked</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        {item.status === "Rewatching" && <RotateCw size={12} />}
                                                        {item.status === "Watching" && <Eye size={12} />}
                                                        {item.status === "Considering" && <HelpCircle size={12} />}
                                                        {item.status === "Completed" && "✓"}
                                                        {item.status === "Dropped" && <Trash2 size={12} />}
                                                        {item.status === "Watchlist" && <ListChecks size={12} />}
                                                        {item.status === "Bookmarked" && <BookmarkIcon size={12} />}
                                                        <span>
                                                            {item.status === "Rewatching" ? "Rewatch" :
                                                             item.status === "Considering" ? "Consider" : 
                                                             item.status === "Bookmarked" ? "Bookmarked" :
                                                             item.status}
                                                        </span>
                                                    </>
                                                )}
                                            </span>
                                            <span className="text-sm bg-white/20 px-3 py-1.5 rounded flex items-center gap-1">
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

                {/* Link to Profile Stats - CENTERED */}
                <div className="mt-12 sm:mt-16 flex justify-center">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 text-white max-w-2xl w-full text-center">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">📊 View Detailed Statistics</h3>
                        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-blue-100">
                            Check your watch time, top genres, and track your progress in your profile!
                        </p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="bg-white text-blue-600 px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:bg-gray-100 transition-colors text-base sm:text-lg flex items-center justify-center gap-2 mx-auto"
                        >
                            View Profile Stats
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibraryPage;