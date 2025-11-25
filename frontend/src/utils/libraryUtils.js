// src/utils/libraryUtils.js
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const LIBRARY_KEY = "user_library";

/**
 *  Get current user's ID (if logged in)
 */
const getUserId = () => {
    const user = JSON.parse(localStorage.getItem("userProfile"));
    return user?.uid || null;
};

export const getLibrary = async () => {
    const uid = getUserId();
    const localData = JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];

    if (!uid) return localData; // guest mode

    try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
            const data = snap.data()?.library || [];
            localStorage.setItem(LIBRARY_KEY, JSON.stringify(data));
            return data;
        } else return localData;
    } catch (err) {
        console.warn("⚠️ Firestore fetch failed, using local data:", err);
        return localData;
    }
};

/**
 * 🔹 Save library (local + Firestore)
 */
export const saveLibrary = async (items, skipDispatch = false) => {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(items));

    if (!skipDispatch) {
        window.dispatchEvent(new CustomEvent("libraryUpdated", { detail: items }));
    }

    const uid = getUserId();
    if (uid) {
        try {
            await setDoc(doc(db, "users", uid), { library: items }, { merge: true });
        } catch (err) {
            console.error("🔥 Firestore save failed, local cache only:", err);
        }
    }
};

/**
 * 🔹 Clear library (logout)
 */
export const clearLibrary = () => {
    localStorage.removeItem(LIBRARY_KEY);
    window.dispatchEvent(new CustomEvent("libraryUpdated", { detail: [] }));
};

/**
 * 🔹 Find a library item
 */
export const findItem = (id, type, library) =>
    library.find((i) => i.id === id && i.type === type);

/**
 * 🔹 Check if in library
 */
export const isInLibrary = (id, type) => {
    const library = JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
    return !!findItem(id, type, library);
};

/**
 * 🔹 Check if favorite
 */
export const isFavorite = (id, type) => {
    const library = JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
    const item = findItem(id, type, library);
    return item ? !!item.favorite : false;
};

/**
 * 🔹 Toggle Add/Remove item
 */
export const toggleLibraryItem = async (item) => {
    const current = JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
    const idx = current.findIndex((i) => i.id === item.id && i.type === item.type);

    if (idx !== -1) {
        current.splice(idx, 1);
    } else {
        current.push({
            ...item,
            favorite: false,
            status: "Watchlist",
            duration: item.duration || getDefaultDuration(item.type),
            dateAdded: new Date().toISOString(),
            genres: item.genres || [],
            isRewatching: false
        });
    }

    await saveLibrary(current);
};

/**
 * 🔹 NEW: Remove item from library
 */
export const removeFromLibrary = async (id, type) => {
    const current = JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
    const idx = current.findIndex((i) => i.id === id && i.type === type);

    if (idx !== -1) {
        current.splice(idx, 1);
        await saveLibrary(current);
        return true;
    }
    return false;
};

/**
 * 🔹 Toggle favorite
 */
export const toggleFavorite = async (id, type, itemData = {}) => {
    const current = JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
    const idx = current.findIndex((i) => i.id === id && i.type === type);

    if (idx !== -1) {
        current[idx].favorite = !current[idx].favorite;
    } else {
        current.push({
            id,
            type,
            favorite: true,
            status: "Watchlist",
            duration: itemData.duration || getDefaultDuration(type),
            dateAdded: new Date().toISOString(),
            title: itemData.title || "",
            image: itemData.image || "",
            genres: itemData.genres || [],
            isRewatching: false,
            ...itemData
        });
    }

    await saveLibrary(current);
};

/**
 * 🔹 Get default duration based on media type
 */
const getDefaultDuration = (type) => {
    switch (type) {
        case "movie":
            return 120; // Average movie length
        case "tv":
        case "series":
            return 45; // Average TV episode length (fallback only)
        case "anime":
            return 24; // Average anime episode length
        default:
            return 60; // Default fallback
    }
};

/**
 * 🔹 Calculate total duration for TV shows
 */
export const calculateTVShowDuration = (details) => {
    if (!details) return 0;

    const episodeRuntime = details.episode_run_time?.[0] || 45;
    const totalEpisodes = details.number_of_episodes || 0;

    return episodeRuntime * totalEpisodes;
};

/**
 * 🔹 Update item status
 */
export const updateLibraryStatus = (id, type, newStatus, itemData = {}) => {
    const library = JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
    const idx = library.findIndex((i) => i.id === id && i.type === type);

    if (idx !== -1) {
        library[idx].status = newStatus;

        // ✅ CRITICAL: Set completion date when status changes to "Completed"
        if (newStatus === "Completed" && !library[idx].dateCompleted) {
            library[idx].dateCompleted = new Date().toISOString();
        }

        // ✅ Also update genres if provided
        if (itemData.genres && itemData.genres.length > 0) {
            library[idx].genres = itemData.genres;
        }

        // ✅ FIXED: Update duration - use provided duration first, then calculate
        if (itemData.duration && itemData.duration > 0) {
            library[idx].duration = itemData.duration;
        } else if (!library[idx].duration || library[idx].duration === 0) {
            library[idx].duration = getDefaultDuration(type);
        }

        // ✅ Update rewatch status
        if (itemData.isRewatching !== undefined) {
            library[idx].isRewatching = itemData.isRewatching;
        }

        // ✅ Ensure title and image are set if missing
        if (!library[idx].title && itemData.title) {
            library[idx].title = itemData.title;
        }
        if (!library[idx].image && itemData.image) {
            library[idx].image = itemData.image;
        }

        saveLibrary(library);
    } else if (newStatus) {
        // ✅ Add new item with proper data if it doesn't exist
        const duration = itemData.duration > 0 ? itemData.duration : getDefaultDuration(type);

        const newItem = {
            id: Number(id),
            type,
            status: newStatus,
            favorite: false,
            duration: duration,
            title: itemData.title || "",
            image: itemData.image || "",
            genres: itemData.genres || [],
            dateAdded: new Date().toISOString(),
            isRewatching: itemData.isRewatching || false,
            ...(newStatus === "Completed" ? { dateCompleted: new Date().toISOString() } : {})
        };
        library.push(newItem);
        saveLibrary(library);
    }
};

/**
 * 🔹 Get item from library
 */
export const getLibraryItem = (id, type) => {
    const library = JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
    return findItem(id, type, library);
};

/**
 * 🔹 Update item data in library
 */
export const updateLibraryItem = async (id, type, updates) => {
    const library = JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
    const idx = library.findIndex((i) => i.id === id && i.type === type);

    if (idx !== -1) {
        library[idx] = { ...library[idx], ...updates };
        await saveLibrary(library);
        return library[idx];
    }
    return null;
};

/**
 * 🔹 Format duration for display
 */
export const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
    }
    return `${mins}m`;
};