// src/pages/ProfileTab.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Pencil, Check, LogOut, BarChart3, Heart, Tv, Film, Clock, Calendar, Mail, ChevronDown, Star, Trophy, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { clearLibrary, getLibrary } from "../utils/libraryUtils";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { calculateTotalXP, getCineStatus, getNextLevelInfo, getFunMessage, calculateAnimeStats } from "../utils/cineLevelUtils";

const defaultAvatar = "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";

const ProfileTab = () => {
    const { currentUser, logout } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [profile, setProfile] = useState({
        name: "Guest",
        email: "",
        avatar: defaultAvatar,
        joined: new Date().toLocaleDateString(),
    });
    const [editing, setEditing] = useState(false);
    const [library, setLibrary] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        favorites: 0,
        movies: 0,
        shows: 0,
        anime: 0,
    });
    const [filteredStats, setFilteredStats] = useState({
        total: 0,
        completed: 0,
        favorites: 0,
    });
    const [timeStats, setTimeStats] = useState({
        total: { months: 0, days: 0, hours: 0, minutes: 0 },
        thisMonth: { days: 0, hours: 0, minutes: 0 },
        lastMonth: { days: 0, hours: 0, minutes: 0 },
        movies: { months: 0, days: 0, hours: 0, minutes: 0 },
        shows: { months: 0, days: 0, hours: 0, minutes: 0 },
        anime: { months: 0, days: 0, hours: 0, minutes: 0 },
        thisMonthMovies: { days: 0, hours: 0, minutes: 0 },
        thisMonthShows: { days: 0, hours: 0, minutes: 0 },
        thisMonthAnime: { days: 0, hours: 0, minutes: 0 },
        lastMonthMovies: { days: 0, hours: 0, minutes: 0 },
        lastMonthShows: { days: 0, hours: 0, minutes: 0 },
        lastMonthAnime: { days: 0, hours: 0, minutes: 0 },
    });
    const [genreStats, setGenreStats] = useState({
        thisMonth: [],
        allTime: [],
    });
    const [filter, setFilter] = useState("all");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [xpStats, setXpStats] = useState({
        totalXP: 0,
        level: 1,
        title: "🎟️ Casual Viewer",
        emoji: "🎟️",
        nextLevelXP: 500,
        xpNeeded: 500,
        progress: 0,
    });
    const [animeStats, setAnimeStats] = useState({
        total: 0,
        completed: 0,
        favorites: 0,
        totalEpisodes: 0,
        totalMinutes: 0,
        totalHours: 0,
    });
    const [authMode, setAuthMode] = useState(null);
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authError, setAuthError] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const nameRef = useRef();

    // Reset all stats when user logs out
    const resetAllStats = useCallback(() => {
        setLibrary([]);
        setStats({
            total: 0,
            completed: 0,
            favorites: 0,
            movies: 0,
            shows: 0,
            anime: 0,
        });
        setFilteredStats({
            total: 0,
            completed: 0,
            favorites: 0,
        });
        setTimeStats({
            total: { months: 0, days: 0, hours: 0, minutes: 0 },
            thisMonth: { days: 0, hours: 0, minutes: 0 },
            lastMonth: { days: 0, hours: 0, minutes: 0 },
            movies: { months: 0, days: 0, hours: 0, minutes: 0 },
            shows: { months: 0, days: 0, hours: 0, minutes: 0 },
            anime: { months: 0, days: 0, hours: 0, minutes: 0 },
            thisMonthMovies: { days: 0, hours: 0, minutes: 0 },
            thisMonthShows: { days: 0, hours: 0, minutes: 0 },
            thisMonthAnime: { days: 0, hours: 0, minutes: 0 },
            lastMonthMovies: { days: 0, hours: 0, minutes: 0 },
            lastMonthShows: { days: 0, hours: 0, minutes: 0 },
            lastMonthAnime: { days: 0, hours: 0, minutes: 0 },
        });
        setGenreStats({
            thisMonth: [],
            allTime: [],
        });
    }, []);

    // Load profile from Firebase or localStorage
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                if (currentUser) {
                    const ref = doc(db, "users", currentUser.uid, "profile", "info");
                    const snap = await getDoc(ref);
                    const data = snap.exists()
                        ? snap.data()
                        : {
                            name: currentUser.displayName || "New User",
                            email: currentUser.email,
                            avatar: currentUser.photoURL || defaultAvatar,
                            joined: new Date().toLocaleDateString(),
                        };
                    setProfile(data);
                    await setDoc(ref, data, { merge: true });
                    localStorage.setItem("userProfile", JSON.stringify({ uid: currentUser.uid, ...data }));
                } else {
                    // Guest mode - load from localStorage or set default
                    const stored = localStorage.getItem("userProfile");
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        setProfile({
                            name: parsed.name || "Guest",
                            email: "",
                            avatar: parsed.avatar || defaultAvatar,
                            joined: "",
                        });
                    } else {
                        setProfile({
                            name: "Guest",
                            email: "",
                            avatar: defaultAvatar,
                            joined: "",
                        });
                    }
                    resetAllStats();
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            }
        };
        fetchProfile();
    }, [currentUser, resetAllStats]);

    // Save profile name - works for both guest and logged-in users
    const saveName = async () => {
        setEditing(false);
        if (currentUser) {
            await setDoc(doc(db, "users", currentUser.uid, "profile", "info"), profile, { merge: true });
            localStorage.setItem("userProfile", JSON.stringify({ uid: currentUser.uid, ...profile }));
        } else {
            localStorage.setItem("userProfile", JSON.stringify(profile));
        }
    };

    // Change avatar - works for both guest and logged-in users
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const newProfile = { ...profile, avatar: reader.result };
            setProfile(newProfile);

            if (!currentUser) {
                localStorage.setItem("userProfile", JSON.stringify(newProfile));
            }
        };
        reader.readAsDataURL(file);
    };

    // Logout
    const handleLogout = async () => {
        await logout();
        clearLibrary();
        localStorage.removeItem("userProfile");
        setProfile({
            name: "Guest",
            email: "",
            avatar: defaultAvatar,
            joined: "",
        });
        resetAllStats();
        window.dispatchEvent(new CustomEvent("libraryUpdated"));
    };

    // Auth handlers
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError("");
        try {
            await signInWithEmailAndPassword(auth, authEmail, authPassword);
            setAuthMode(null);
            setAuthEmail("");
            setAuthPassword("");
        } catch (err) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleEmailSignup = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError("");
        try {
            await createUserWithEmailAndPassword(auth, authEmail, authPassword);
            setAuthMode(null);
            setAuthEmail("");
            setAuthPassword("");
        } catch (err) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setAuthLoading(true);
        setAuthError("");
        try {
            await signInWithPopup(auth, googleProvider);
            setAuthMode(null);
        } catch (err) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const closeAuthForm = () => {
        setAuthMode(null);
        setAuthError("");
        setAuthEmail("");
        setAuthPassword("");
    };

    // Calculate time statistics
    const calculateTimeStats = useCallback((library) => {
        if (!currentUser || library.length === 0) {
            setTimeStats({
                total: { months: 0, days: 0, hours: 0, minutes: 0 },
                thisMonth: { days: 0, hours: 0, minutes: 0 },
                lastMonth: { days: 0, hours: 0, minutes: 0 },
                movies: { months: 0, days: 0, hours: 0, minutes: 0 },
                shows: { months: 0, days: 0, hours: 0, minutes: 0 },
                anime: { months: 0, days: 0, hours: 0, minutes: 0 },
                thisMonthMovies: { days: 0, hours: 0, minutes: 0 },
                thisMonthShows: { days: 0, hours: 0, minutes: 0 },
                thisMonthAnime: { days: 0, hours: 0, minutes: 0 },
                lastMonthMovies: { days: 0, hours: 0, minutes: 0 },
                lastMonthShows: { days: 0, hours: 0, minutes: 0 },
                lastMonthAnime: { days: 0, hours: 0, minutes: 0 },
            });
            return;
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        let totalMinutes = 0;
        let thisMonthMinutes = 0;
        let lastMonthMinutes = 0;
        let moviesMinutes = 0;
        let showsMinutes = 0;
        let animeMinutes = 0;
        let thisMonthMoviesMinutes = 0;
        let thisMonthShowsMinutes = 0;
        let thisMonthAnimeMinutes = 0;
        let lastMonthMoviesMinutes = 0;
        let lastMonthShowsMinutes = 0;
        let lastMonthAnimeMinutes = 0;

        const completedItems = library.filter(item =>
            item.status === "Completed" || item.status === "completed"
        );

        completedItems.forEach(item => {
            const itemMinutes = item.duration || 0;
            totalMinutes += itemMinutes;

            const completionDate = item.dateCompleted ? new Date(item.dateCompleted) :
                item.dateAdded ? new Date(item.dateAdded) : null;

            const isThisMonth = completionDate &&
                completionDate.getMonth() === currentMonth &&
                completionDate.getFullYear() === currentYear;

            const isLastMonth = completionDate &&
                completionDate.getMonth() === lastMonth &&
                completionDate.getFullYear() === lastMonthYear;

            if (isThisMonth) {
                thisMonthMinutes += itemMinutes;
            }
            if (isLastMonth) {
                lastMonthMinutes += itemMinutes;
            }

            // Track by type
            if (item.type === "movie") {
                moviesMinutes += itemMinutes;
                if (isThisMonth) thisMonthMoviesMinutes += itemMinutes;
                if (isLastMonth) lastMonthMoviesMinutes += itemMinutes;
            } else if (item.type === "tv" || item.type === "series") {
                showsMinutes += itemMinutes;
                if (isThisMonth) thisMonthShowsMinutes += itemMinutes;
                if (isLastMonth) lastMonthShowsMinutes += itemMinutes;
            } else if (item.type === "anime") {
                animeMinutes += itemMinutes;
                if (isThisMonth) thisMonthAnimeMinutes += itemMinutes;
                if (isLastMonth) lastMonthAnimeMinutes += itemMinutes;
            }
        });

        const convertMinutes = (minutes) => {
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            const months = Math.floor(days / 30);
            return {
                months,
                days: days % 30,
                hours: hours % 24,
                minutes: minutes % 60
            };
        };

        setTimeStats({
            total: convertMinutes(totalMinutes),
            thisMonth: convertMinutes(thisMonthMinutes),
            lastMonth: convertMinutes(lastMonthMinutes),
            movies: convertMinutes(moviesMinutes),
            shows: convertMinutes(showsMinutes),
            anime: convertMinutes(animeMinutes),
            thisMonthMovies: convertMinutes(thisMonthMoviesMinutes),
            thisMonthShows: convertMinutes(thisMonthShowsMinutes),
            thisMonthAnime: convertMinutes(thisMonthAnimeMinutes),
            lastMonthMovies: convertMinutes(lastMonthMoviesMinutes),
            lastMonthShows: convertMinutes(lastMonthShowsMinutes),
            lastMonthAnime: convertMinutes(lastMonthAnimeMinutes),
        });
    }, [currentUser]);

    // Calculate genre statistics
    const calculateGenreStats = useCallback((library) => {
        if (!currentUser || library.length === 0) {
            setGenreStats({
                thisMonth: [],
                allTime: [],
            });
            return;
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const genreCountThisMonth = {};
        const genreCountAllTime = {};

        const completedItems = library.filter(item =>
            item.status === "Completed" || item.status === "completed"
        );

        completedItems.forEach(item => {
            const genres = item.genres || [];

            genres.forEach(genre => {
                genreCountAllTime[genre] = (genreCountAllTime[genre] || 0) + 1;
            });

            const completionDate = item.dateCompleted ? new Date(item.dateCompleted) :
                item.dateAdded ? new Date(item.dateAdded) : null;

            if (completionDate) {
                const completionMonth = completionDate.getMonth();
                const completionYear = completionDate.getFullYear();

                if (completionMonth === currentMonth && completionYear === currentYear) {
                    genres.forEach(genre => {
                        genreCountThisMonth[genre] = (genreCountThisMonth[genre] || 0) + 1;
                    });
                }
            }
        });

        const sortGenres = (genreObj) =>
            Object.entries(genreObj)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, count]) => ({ name, count }));

        setGenreStats({
            thisMonth: sortGenres(genreCountThisMonth),
            allTime: sortGenres(genreCountAllTime),
        });
    }, [currentUser]);

    // Calculate filtered stats
    const calculateFilteredStats = useCallback((library, filterType) => {
        let filteredItems = library;

        if (filterType !== "all") {
            filteredItems = library.filter(item => {
                if (filterType === "movies") return item.type === "movie";
                if (filterType === "shows") return item.type === "tv" || item.type === "series";
                if (filterType === "anime") return item.type === "anime";
                return true;
            });
        }

        const completedItems = filteredItems.filter(item =>
            item.status === "Completed" || item.status === "completed"
        );

        return {
            total: filteredItems.length,
            completed: completedItems.length,
            favorites: filteredItems.filter(item => item.favorite).length,
        };
    }, []);

    // Calculate all stats
    const calculateStats = useCallback(async () => {
        if (!currentUser) {
            resetAllStats();
            return;
        }

        const lib = await getLibrary();
        setLibrary(lib);

        if (lib.length > 0) {
            calculateTimeStats(lib);
            calculateGenreStats(lib);

            const completedItems = lib.filter(item =>
                item.status === "Completed" || item.status === "completed"
            );

            setStats({
                total: lib.length,
                completed: completedItems.length,
                favorites: lib.filter(item => item.favorite).length,
                movies: lib.filter(item => item.type === "movie").length,
                shows: lib.filter(item => item.type === "tv" || item.type === "series").length,
                anime: lib.filter(item => item.type === "anime").length,
            });

            setFilteredStats(calculateFilteredStats(lib, filter));

            // Calculate XP and CineLevel
            const totalXP = calculateTotalXP(lib);
            const cineStatus = getCineStatus(totalXP);
            const nextLevel = getNextLevelInfo(totalXP);

            setXpStats({
                totalXP,
                ...cineStatus,
                ...nextLevel,
            });

            // Calculate Anime Stats
            const animeData = calculateAnimeStats(lib);
            setAnimeStats(animeData);
        } else {
            resetAllStats();
        }
    }, [currentUser, calculateTimeStats, calculateGenreStats, calculateFilteredStats, filter, resetAllStats]);

    // Format time for display
    const formatTime = (time, showMonths = true) => {
        const parts = [];
        if (showMonths && time.months > 0) parts.push(`${time.months}mo`);
        if (time.days > 0) parts.push(`${time.days}d`);
        if (time.hours > 0) parts.push(`${time.hours}h`);
        if (time.minutes > 0 || parts.length === 0) parts.push(`${time.minutes}m`);
        return parts.join(" ");
    };

    // Real-time listener for library updates
    useEffect(() => {
        const calculateAndSetStats = async () => {
            await calculateStats();
        };

        calculateAndSetStats();

        const listener = async () => {
            await calculateAndSetStats();
        };

        window.addEventListener("libraryUpdated", listener);
        return () => window.removeEventListener("libraryUpdated", listener);
    }, [calculateStats]);

    // Update filtered stats when filter changes
    useEffect(() => {
        if (library.length > 0 && currentUser) {
            setFilteredStats(calculateFilteredStats(library, filter));
        }
    }, [filter, library, calculateFilteredStats, currentUser]);

    // Get filtered time stats
    const getFilteredTimeStats = () => {
        switch (filter) {
            case "movies":
                return timeStats.movies;
            case "shows":
                return timeStats.shows;
            case "anime":
                return timeStats.anime;
            default:
                return timeStats.total;
        }
    };

    // Get filtered "This Month" stats based on current filter
    const getFilteredThisMonthStats = () => {
        switch (filter) {
            case "movies":
                return timeStats.thisMonthMovies;
            case "shows":
                return timeStats.thisMonthShows;
            case "anime":
                return timeStats.thisMonthAnime;
            default:
                return timeStats.thisMonth;
        }
    };

    // Get filtered "Last Month" stats based on current filter
    const getFilteredLastMonthStats = () => {
        switch (filter) {
            case "movies":
                return timeStats.lastMonthMovies;
            case "shows":
                return timeStats.lastMonthShows;
            case "anime":
                return timeStats.lastMonthAnime;
            default:
                return timeStats.lastMonth;
        }
    };

    const getFilterTitle = () => {
        switch (filter) {
            case "movies": return "MOVIES";
            case "shows": return "TV SHOWS";
            case "anime": return "ANIME";
            default: return "ALL CONTENT";
        }
    };

    // Filter options with anime
    const filterOptions = [
        { value: "all", label: "ALL CONTENT", icon: "🎯" },
        { value: "movies", label: "MOVIES", icon: "🎬" },
        { value: "shows", label: "TV SHOWS", icon: "📺" },
        { value: "anime", label: "ANIME", icon: "🎌" },
    ];

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'} pt-20 px-4 pb-8`}>
            <motion.div
                className="max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Auth Form Modal */}
                <AnimatePresence>
                    {authMode && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={closeAuthForm}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className={`rounded-2xl p-6 w-full max-w-md shadow-2xl border ${
                                    isDark
                                        ? "bg-gray-900 border-white/20"
                                        : "bg-white border-gray-300"
                                }`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                        {authMode === "login" ? "Log In" : "Sign Up"}
                                    </h3>
                                    <button
                                        onClick={closeAuthForm}
                                        className={`p-2 rounded-full ${
                                            isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                                        }`}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={authMode === "login" ? handleEmailLogin : handleEmailSignup} className="space-y-4">
                                    <div>
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={authEmail}
                                            onChange={(e) => setAuthEmail(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 ${
                                                isDark
                                                    ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-500"
                                                    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                                            }`}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            value={authPassword}
                                            onChange={(e) => setAuthPassword(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 ${
                                                isDark
                                                    ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-500"
                                                    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
                                            }`}
                                            required
                                        />
                                    </div>
                                    {authError && (
                                        <p className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>
                                            {authError}
                                        </p>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={authLoading}
                                        className={`w-full py-3 rounded-xl font-bold transition-all duration-200 ${
                                            authLoading
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                                        } text-white`}
                                    >
                                        {authLoading ? "Processing..." : (authMode === "login" ? "Log In" : "Sign Up")}
                                    </button>
                                </form>

                                <div className="mt-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`flex-1 h-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>OR</span>
                                        <div className={`flex-1 h-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                    </div>

                                    <button
                                        onClick={handleGoogleAuth}
                                        disabled={authLoading}
                                        className={`w-full px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg flex items-center justify-center gap-3 ${
                                            isDark
                                                ? "bg-white text-gray-900 hover:bg-gray-100"
                                                : "bg-gray-900 text-white hover:bg-gray-800"
                                        } ${authLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        Continue with Google
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Compact Profile Card */}
                <div className={`relative rounded-xl p-4 mb-6 shadow-lg border ${
                    isDark
                        ? "bg-gradient-to-br from-gray-900/80 to-black/90 border-white/20"
                        : "bg-gradient-to-br from-white/95 to-gray-100/90 border-gray-300/50"
                }`}>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Avatar Section */}
                        <div className="relative group">
                            <div className={`w-16 h-16 rounded-full p-1 ${
                                isDark
                                    ? "bg-gradient-to-r from-purple-500 to-blue-500"
                                    : "bg-gradient-to-r from-blue-400 to-purple-500"
                            }`}>
                                <img
                                    src={profile.avatar}
                                    alt="avatar"
                                    className="w-full h-full rounded-full object-cover border-2 border-transparent"
                                />
                            </div>
                            <label className="absolute -bottom-1 -right-1 cursor-pointer transform group-hover:scale-110 transition-transform duration-200">
                                <div className={`p-2 rounded-full shadow-lg ${
                                    isDark
                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                        : "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                                }`}>
                                    <Pencil size={14} />
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </label>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                {editing ? (
                                    <>
                                        <input
                                            ref={nameRef}
                                            value={profile.name}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            className={`text-xl font-bold bg-transparent border-b-2 text-center sm:text-left focus:outline-none ${
                                                isDark
                                                    ? "border-white/50 text-white"
                                                    : "border-gray-800/50 text-gray-900"
                                            }`}
                                            placeholder="Enter your name"
                                        />
                                        <Check
                                            className="cursor-pointer text-green-500 hover:scale-110 transition-transform"
                                            size={18}
                                            onClick={saveName}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <h1 className={`text-xl font-bold ${
                                            isDark ? "text-white" : "text-gray-900"
                                        }`}>
                                            {profile.name}
                                        </h1>
                                        <Pencil
                                            className="cursor-pointer hover:scale-110 transition-transform"
                                            size={14}
                                            onClick={() => setEditing(true)}
                                        />
                                    </>
                                )}
                            </div>

                            {/* Only show email for logged-in users */}
                            {currentUser && profile.email && (
                                <p className={`text-sm mb-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                                    {profile.email}
                                </p>
                            )}

                            {/* Only show joined date for logged-in users */}
                            {currentUser && profile.joined && (
                                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                    Joined: {profile.joined}
                                </p>
                            )}

                            {/* CineLevel Status - Only show for logged-in users */}
                            {currentUser && (
                                <div className="mt-2">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                                        isDark
                                            ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30"
                                            : "bg-gradient-to-r from-purple-400/30 to-blue-400/30 border border-purple-400/50"
                                    }`}>
                                        <span className="text-lg">{xpStats.emoji}</span>
                                        <span className={`text-sm font-bold ${isDark ? "text-purple-300" : "text-purple-700"}`}>
                                            {xpStats.title}
                                        </span>
                                        <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                            (Level {xpStats.level})
                                        </span>
                                    </div>
                                    <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                        {xpStats.totalXP} XP • {getFunMessage(Math.floor(timeStats.total.months * 720 + timeStats.total.days * 24 + timeStats.total.hours))}
                                    </p>
                                    {/* XP Progress Bar */}
                                    {xpStats.level < 10 && (
                                        <div className="mt-2">
                                            <div className={`h-2 rounded-full overflow-hidden ${
                                                isDark ? "bg-gray-700" : "bg-gray-300"
                                            }`}>
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                                                    style={{ width: `${xpStats.progress}%` }}
                                                />
                                            </div>
                                            <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                {xpStats.xpNeeded} XP to next level
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Guest mode message */}
                            {!currentUser && (
                                <p className={`text-xs italic ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                    Guest mode - changes saved locally
                                </p>
                            )}

                            {/* Time Investment - Only show for logged-in users */}
                            {currentUser && (
                                <div className={`mt-3 p-3 rounded-xl backdrop-blur-sm border ${
                                    isDark
                                        ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30"
                                        : "bg-gradient-to-r from-yellow-400/30 to-orange-400/30 border-yellow-500/50"
                                }`}>
                                    <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                                        <Clock className={`${isDark ? "text-yellow-400" : "text-yellow-600"}`} size={16} />
                                        <p className={`text-xs font-bold ${isDark ? "text-yellow-400" : "text-yellow-600"}`}>
                                            TIME INVESTED
                                        </p>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <p className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                                            {formatTime(timeStats.total)}
                                        </p>
                                        <p className={`text-xs ${isDark ? "text-yellow-300" : "text-yellow-700"}`}>
                                            Total cinematic journey
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Auth Section - Centered & Prominent */}
                            <div className="mt-6">
                                {currentUser ? (
                                    <div className="text-center">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-xl bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-500 hover:to-pink-500 hover:scale-105 mx-auto"
                                        >
                                            <LogOut size={16} /> LOGOUT ACCOUNT
                                        </button>
                                    </div>
                                ) : (
                                    <div className={`text-center p-4 rounded-xl backdrop-blur-sm border ${isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                        <h4 className={`text-sm font-bold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                            🔐 SAVE YOUR PROGRESS
                                        </h4>
                                        <p className={`text-xs mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Sign up to save your library, stats, and preferences across all devices
                                        </p>
                                        
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => setAuthMode("signup")}
                                                className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 hover:scale-105"
                                            >
                                                🚀 SIGN UP FOR FREE
                                            </button>
                                            
                                            <div className="flex items-center gap-2 justify-center mt-2">
                                                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Already have an account?
                                                </span>
                                                <button
                                                    onClick={() => setAuthMode("login")}
                                                    className={`text-xs font-bold hover:underline ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                                                >
                                                    Log In
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                {currentUser ? (
                    <ProfileStats
                        currentUser={currentUser}
                        filter={filter}
                        setFilter={setFilter}
                        showFilterDropdown={showFilterDropdown}
                        setShowFilterDropdown={setShowFilterDropdown}
                        filterOptions={filterOptions}
                        getFilterTitle={getFilterTitle}
                        stats={stats}
                        filteredStats={filteredStats}
                        timeStats={timeStats}
                        genreStats={genreStats}
                        getFilteredTimeStats={getFilteredTimeStats}
                        getFilteredThisMonthStats={getFilteredThisMonthStats}
                        getFilteredLastMonthStats={getFilteredLastMonthStats}
                        formatTime={formatTime}
                        xpStats={xpStats}
                        animeStats={animeStats}
                        isDark={isDark}
                    />
                ) : (
                    <GuestStats setAuthMode={setAuthMode} handleGoogleAuth={handleGoogleAuth} isDark={isDark} />
                )}
            </motion.div>
        </div>
    );
};

// Guest Stats Component
const GuestStats = ({ setAuthMode, handleGoogleAuth, isDark }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            {/* Compact Guest Message */}
            <div className={`rounded-xl p-4 text-center shadow-lg backdrop-blur-xl border mb-4 ${
                isDark
                    ? "bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30"
                    : "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-400/50"
            }`}>
                <div className="text-3xl mb-3">🎭</div>
                <h3 className="text-lg font-bold mb-2">WELCOME TO CINECOOLTV</h3>
                <p className="text-xs mb-4 opacity-90">
                    Sign in to start building your personal cinematic library and unlock detailed statistics!
                </p>

                {/* Login/Sign Up Options */}
                <div className="space-y-3">
                    <button
                        onClick={handleGoogleAuth}
                        className={`w-full px-4 py-2 rounded-lg font-bold text-xs transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                            isDark
                                ? "bg-white text-gray-900 hover:bg-gray-100"
                                : "bg-gray-900 text-white hover:bg-gray-800"
                        }`}
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>

                    <div className="flex items-center gap-2">
                        <div className={`flex-1 h-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>OR</span>
                        <div className={`flex-1 h-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                    </div>

                    {/* Center these buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <button
                            onClick={() => setAuthMode("login")}
                            className={`px-4 py-2.5 rounded-lg font-bold text-xs transition-all duration-200 shadow-lg border flex-1 max-w-xs mx-auto ${
                                isDark
                                    ? "bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30"
                                    : "bg-blue-500/20 text-blue-600 border-blue-500/30 hover:bg-blue-500/30"
                            }`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => setAuthMode("signup")}
                            className={`px-4 py-2.5 rounded-lg font-bold text-xs transition-all duration-200 shadow-lg border flex-1 max-w-xs mx-auto ${
                                isDark
                                    ? "bg-green-600/20 text-green-400 border-green-500/30 hover:bg-green-600/30"
                                    : "bg-green-500/20 text-green-600 border-green-500/30 hover:bg-green-500/30"
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>

                <p className="text-xs mt-3 opacity-70">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>

            {/* Compact Features Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <CompactFeatureCard
                    icon="📊"
                    title="Track Journey"
                    description="Monitor watch time and favorites"
                    isDark={isDark}
                />
                <CompactFeatureCard
                    icon="🎬"
                    title="Build Library"
                    description="Add movies and shows to collection"
                    isDark={isDark}
                />
                <CompactFeatureCard
                    icon="⭐"
                    title="Get Stats"
                    description="Insights into watching habits"
                    isDark={isDark}
                />
            </div>
        </motion.div>
    );
};

// Compact Feature Card
const CompactFeatureCard = ({ icon, title, description, isDark }) => {
    return (
        <div className={`p-3 rounded-lg shadow-lg backdrop-blur-sm border text-center ${
            isDark
                ? "bg-white/10 border-white/20"
                : "bg-black/10 border-gray-300/50"
        }`}>
            <div className="text-xl mb-1">{icon}</div>
            <h4 className={`text-xs font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h4>
            <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}>{description}</p>
        </div>
    );
};

// Profile Stats Component
const ProfileStats = ({
                          filter,
                          setFilter,
                          showFilterDropdown,
                          setShowFilterDropdown,
                          filterOptions,
                          getFilterTitle,
                          stats,
                          filteredStats,
                          timeStats,
                          genreStats,
                          getFilteredTimeStats,
                          getFilteredThisMonthStats,
                          getFilteredLastMonthStats,
                          formatTime,
                          xpStats,
                          animeStats,
                          isDark
                      }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            {/* Stats Header with Filter */}
            <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-3">
                <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    CINEMATIC STATISTICS
                </h2>

                <div className="relative">
                    <button
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs transition-all duration-200 shadow-lg border backdrop-blur-sm ${
                            isDark
                                ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                                : "bg-black/10 hover:bg-black/20 border-gray-300/50 text-gray-900"
                        }`}
                    >
                        <span className="text-xs">{getFilterTitle()}</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showFilterDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className={`absolute top-full right-0 mt-2 w-40 rounded-lg shadow-xl border backdrop-blur-xl z-10 overflow-hidden ${
                                    isDark
                                        ? "bg-gray-900/95 border-white/20"
                                        : "bg-white/95 border-gray-300/50"
                                }`}
                            >
                                {filterOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setFilter(option.value);
                                            setShowFilterDropdown(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 transition-all duration-200 flex items-center justify-between text-xs font-semibold ${
                                            filter === option.value
                                                ? isDark
                                                    ? 'bg-blue-500/20 text-blue-400'
                                                    : 'bg-blue-500/20 text-blue-600'
                                                : isDark
                                                    ? 'hover:bg-white/10 text-white'
                                                    : 'hover:bg-black/10 text-gray-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{option.icon}</span>
                                            <span>{option.label}</span>
                                        </div>
                                        {option.value === "anime" && animeStats.total > 0 && (
                                            <div className={`text-xs px-1 py-0.5 rounded ${
                                                isDark ? "bg-pink-500/20 text-pink-300" : "bg-pink-500/20 text-pink-700"
                                            }`}>
                                                {animeStats.completed}/{animeStats.total}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* CineLevel XP Card */}
            <div className={`rounded-lg p-4 mb-4 shadow-lg backdrop-blur-sm border ${
                isDark
                    ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30"
                    : "bg-gradient-to-r from-purple-400/30 to-blue-400/30 border-purple-400/50"
            }`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="text-3xl">{xpStats.emoji}</div>
                        <div>
                            <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                {xpStats.title}
                            </h3>
                            <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                Level {xpStats.level} • {xpStats.totalXP} XP
                            </p>
                        </div>
                    </div>
                    <div className={`p-2 rounded-lg ${isDark ? "bg-white/10" : "bg-white/50"}`}>
                        <Zap className={`w-5 h-5 ${isDark ? "text-yellow-400" : "text-yellow-600"}`} />
                    </div>
                </div>
                {xpStats.level < 10 && (
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                                Progress to Level {xpStats.level + 1}
                            </span>
                            <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                                {Math.floor(xpStats.progress)}%
                            </span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${
                            isDark ? "bg-gray-700" : "bg-gray-300"
                        }`}>
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                                style={{ width: `${xpStats.progress}%` }}
                            />
                        </div>
                        <p className={`text-xs mt-1 text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            {xpStats.xpNeeded} XP needed
                        </p>
                    </div>
                )}
            </div>

            {/* Compact Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <CompactStatCard
                    icon={<Film className="text-blue-400" size={18} />}
                    title="MOVIES"
                    value={filter === "all" ? stats.movies : (filter === "movies" ? filteredStats.total : 0)}
                    gradient="from-blue-500 to-cyan-500"
                    isDark={isDark}
                />
                <CompactStatCard
                    icon={<Tv className="text-purple-400" size={18} />}
                    title="SHOWS"
                    value={filter === "all" ? stats.shows : (filter === "shows" ? filteredStats.total : 0)}
                    gradient="from-purple-500 to-pink-500"
                    isDark={isDark}
                />
                <CompactStatCard
                    icon={<span className="text-lg">🎌</span>}
                    title="ANIME"
                    value={filter === "all" ? stats.anime : (filter === "anime" ? filteredStats.total : 0)}
                    gradient="from-pink-500 to-rose-500"
                    subtitle={filter === "anime" && animeStats.totalEpisodes > 0 ? `${animeStats.totalEpisodes} episodes` : undefined}
                    isDark={isDark}
                />
                <CompactStatCard
                    icon={<BarChart3 className="text-green-400" size={18} />}
                    title="COMPLETED"
                    value={filteredStats.completed}
                    gradient="from-green-500 to-emerald-500"
                    isDark={isDark}
                />
                <CompactStatCard
                    icon={<Heart className="text-red-400" size={18} />}
                    title="FAVORITES"
                    value={filteredStats.favorites}
                    gradient="from-red-500 to-pink-500"
                    isDark={isDark}
                />
                <CompactStatCard
                    icon={<Star className="text-indigo-400" size={18} />}
                    title="TOTAL"
                    value={filteredStats.total}
                    gradient="from-indigo-500 to-purple-500"
                    isDark={isDark}
                />
            </div>

            {/* Compact Time Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <CompactTimeCard
                    icon={<Calendar className="text-green-400" size={18} />}
                    title="THIS MONTH"
                    time={getFilteredThisMonthStats()}
                    gradient="from-green-500 to-emerald-500"
                    isDark={isDark}
                />
                <CompactTimeCard
                    icon={<Clock className="text-blue-400" size={18} />}
                    title="LAST MONTH"
                    time={getFilteredLastMonthStats()}
                    gradient="from-blue-500 to-cyan-500"
                    isDark={isDark}
                />
                <CompactTimeCard
                    icon={<Trophy className="text-purple-400" size={18} />}
                    title={getFilterTitle()}
                    time={getFilteredTimeStats()}
                    gradient="from-purple-500 to-pink-500"
                    showMonths={true}
                    isDark={isDark}
                />
            </div>

            {/* Compact Genre Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <CompactGenreCard
                    title="THIS MONTH"
                    genres={genreStats.thisMonth}
                    emptyMessage="No genres this month"
                    gradient="from-orange-500 to-red-500"
                    isDark={isDark}
                />
                <CompactGenreCard
                    title="ALL TIME"
                    genres={genreStats.allTime}
                    emptyMessage="No genres yet"
                    gradient="from-blue-500 to-purple-500"
                    isDark={isDark}
                />
            </div>

            {/* Compact Feedback Section */}
            <div className={`rounded-lg p-4 text-center shadow-lg backdrop-blur-lg border ${
                isDark
                    ? "bg-gradient-to-br from-blue-600/15 to-purple-600/15 border-blue-500/20"
                    : "bg-gradient-to-br from-blue-400/20 to-purple-400/20 border-blue-400/30"
            }`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Mail size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
                    <h3 className={`text-sm font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                        FEEDBACK & SUPPORT
                    </h3>
                </div>
                <p className={`text-xs mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Have suggestions or need help?
                </p>
                <a
                    href="mailto:balannnced@gmail.com"
                    className={`text-xs font-bold hover:underline transition-all duration-200 ${
                        isDark ? "text-white hover:text-yellow-300" : "text-gray-900 hover:text-blue-600"
                    }`}
                >
                    balannnced@gmail.com
                </a>
            </div>
        </motion.div>
    );
};

// Compact Stat Card Component
const CompactStatCard = ({ icon, title, value, gradient, subtitle, isDark }) => {
    return (
        <div className={`relative rounded-lg p-3 shadow-lg backdrop-blur-sm border ${
            isDark
                ? "bg-white/10 border-white/20"
                : "bg-black/10 border-gray-300/50"
        }`}>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{title}</span>
                </div>
                <span className={`text-base font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                    {value}
                </span>
            </div>
            {subtitle && (
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {subtitle}
                </p>
            )}
        </div>
    );
};

// Compact Time Card Component
const CompactTimeCard = ({ icon, title, time, gradient, showMonths = false, isDark }) => {
    return (
        <div className={`relative rounded-lg p-3 shadow-lg backdrop-blur-sm border text-center ${
            isDark
                ? "bg-white/10 border-white/20"
                : "bg-black/10 border-gray-300/50"
        }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
                {icon}
                <h4 className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h4>
            </div>
            <div className={`text-lg font-bold mb-1 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {time.months > 0 && showMonths ? `${time.months}mo ` : ''}
                {time.days > 0 ? `${time.days}d ` : ''}
                {time.hours > 0 ? `${time.hours}h ` : ''}
                {time.minutes > 0 ? `${time.minutes}m` : '0m'}
            </div>
        </div>
    );
};

// Compact Genre Card Component
const CompactGenreCard = ({ title, genres, emptyMessage, gradient, isDark }) => {
    return (
        <div className={`rounded-lg p-3 shadow-lg backdrop-blur-sm border ${
            isDark
                ? "bg-white/10 border-white/20"
                : "bg-black/10 border-gray-300/50"
        }`}>
            <h4 className={`text-sm font-bold text-center mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {title}
            </h4>
            {genres.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-1">
                    {genres.map((genre, index) => (
                        <div key={genre.name} className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            isDark
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "bg-blue-500/20 text-blue-700 border border-blue-500/30"
                        }`}>
                            {genre.name} <span className="font-bold">({genre.count})</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className={`text-center py-1 text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>{emptyMessage}</p>
            )}
        </div>
    );
};

export default ProfileTab;