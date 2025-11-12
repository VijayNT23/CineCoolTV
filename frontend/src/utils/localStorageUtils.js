// src/utils/localStorageUtils.js

// Unique key for each user's lists
export const getUserLibraryKey = (userId = "guest") => `user_${userId}_library`;

// Initialize default structure
const defaultLibrary = {
    watchlist: [],
    watching: [],
    considering: [],
    dropped: [],
    favourite: [],
    completed: []
};

// Fetch user's lists
export const getLibrary = (userId = "guest") => {
    try {
        const data = localStorage.getItem(getUserLibraryKey(userId));
        return data ? JSON.parse(data) : { ...defaultLibrary };
    } catch (err) {
        console.error("Error reading library from storage:", err);
        return { ...defaultLibrary };
    }
};

// Save updated lists
export const saveLibrary = (userId = "guest", updatedLibrary) => {
    try {
        localStorage.setItem(getUserLibraryKey(userId), JSON.stringify(updatedLibrary));
    } catch (err) {
        console.error("Error saving library to storage:", err);
    }
};

// Toggle movie/show in a specific list
export const toggleInLibrary = (userId, category, item) => {
    const lib = getLibrary(userId);
    const exists = lib[category].some((i) => i.id === item.id);
    lib[category] = exists
        ? lib[category].filter((i) => i.id !== item.id)
        : [...lib[category], item];
    saveLibrary(userId, lib);
    return lib;
};

// Check if an item exists in a category
export const isInLibrary = (userId, category, itemId) => {
    const lib = getLibrary(userId);
    return lib[category].some((i) => i.id === itemId);
};
