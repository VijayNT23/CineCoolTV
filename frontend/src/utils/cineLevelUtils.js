// src/utils/cineLevelUtils.js
// CineLevel XP System - Gamification for CineCoolTV

/**
 * Calculate XP based on user actions
 * Reduced XP values to make progression more challenging
 */
export const calculateXP = {
    movieWatched: 25,      // Reduced from 50
    episodeWatched: 10,    // Reduced from 20
    reviewWritten: 15,     // Reduced from 30
    hourWatchTime: 5,      // Reduced from 10
    addToLibrary: 2,       // Reduced from 5
};

/**
 * Get CineLevel status based on XP
 * Increased thresholds to make progression more challenging
 */
export function getCineStatus(xp) {
    if (xp < 1000) return { level: 1, title: "🎟️ Casual Viewer", emoji: "🎟️" };
    if (xp < 2500) return { level: 2, title: "🍿 Weekend Binger", emoji: "🍿" };
    if (xp < 5000) return { level: 3, title: "📼 Movie Buff", emoji: "📼" };
    if (xp < 8500) return { level: 4, title: "🎞️ Cinema Enthusiast", emoji: "🎞️" };
    if (xp < 13000) return { level: 5, title: "🎬 CineAddict", emoji: "🎬" };
    if (xp < 18500) return { level: 6, title: "🍷 Film Connoisseur", emoji: "🍷" };
    if (xp < 25000) return { level: 7, title: "🧠 Critic in the Making", emoji: "🧠" };
    if (xp < 33000) return { level: 8, title: "🔥 CineXphile", emoji: "🔥" };
    if (xp < 42000) return { level: 9, title: "👑 Cinema Sage", emoji: "👑" };
    return { level: 10, title: "⚡ CineGod", emoji: "⚡" };
}

/**
 * Get next level info
 * Updated to match new level thresholds
 */
export function getNextLevelInfo(xp) {
    const levels = [1000, 2500, 5000, 8500, 13000, 18500, 25000, 33000, 42000];

    for (let i = 0; i < levels.length; i++) {
        if (xp < levels[i]) {
            return {
                nextLevelXP: levels[i],
                xpNeeded: levels[i] - xp,
                progress: (xp / levels[i]) * 100,
            };
        }
    }

    // Max level reached
    return {
        nextLevelXP: 42000,
        xpNeeded: 0,
        progress: 100,
    };
}

/**
 * Calculate total XP from library
 */
export function calculateTotalXP(library) {
    let totalXP = 0;

    library.forEach(item => {
        // XP for adding to library
        totalXP += calculateXP.addToLibrary;

        // XP for completed items
        if (item.status === "Completed" || item.status === "completed") {
            if (item.type === "movie") {
                totalXP += calculateXP.movieWatched;
            } else if (item.type === "tv" || item.type === "series" || item.type === "anime") {
                // For series, calculate based on episodes or duration
                const episodes = item.numberOfEpisodes || 1;
                totalXP += calculateXP.episodeWatched * episodes;
            }

            // XP for watch time
            const durationInHours = (item.duration || 0) / 60;
            totalXP += Math.floor(durationInHours * calculateXP.hourWatchTime);
        }
    });

    return totalXP;
}

/**
 * Get fun message based on watch time
 */
export function getFunMessage(totalHours) {
    if (totalHours < 10) return "Just getting started! 🌱";
    if (totalHours < 50) return `You've invested ${totalHours} hours. Not bad! 🎬`;
    if (totalHours < 100) return `${totalHours} hours of pure cinema. Respect! 🎭`;
    if (totalHours < 200) return `${totalHours} hours wasted... I mean invested! 😄`;
    if (totalHours < 500) return `${totalHours} hours! You're a true cinephile! 🍿`;
    if (totalHours < 1000) return `${totalHours} hours! That's dedication! 🏆`;
    return `${totalHours} hours! You've basically lived in a cinema! 🎪`;
}

/**
 * Calculate anime-specific stats
 */
export function calculateAnimeStats(library) {
    const animeItems = library.filter(item => item.type === "anime");

    const completed = animeItems.filter(item =>
        item.status === "Completed" || item.status === "completed"
    );

    let totalEpisodes = 0;
    let totalMinutes = 0;

    completed.forEach(item => {
        totalEpisodes += item.numberOfEpisodes || 0;
        totalMinutes += item.duration || 0;
    });

    return {
        total: animeItems.length,
        completed: completed.length,
        favorites: animeItems.filter(item => item.favorite).length,
        totalEpisodes,
        totalMinutes,
        totalHours: Math.floor(totalMinutes / 60),
    };
}
