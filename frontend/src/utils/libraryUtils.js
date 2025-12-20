// src/utils/libraryUtils.js

// Helper function to get the library key based on current user
const getLibraryKey = () => {
  try {
    const userProfile = localStorage.getItem("userProfile");
    if (userProfile) {
      const user = JSON.parse(userProfile);
      return user?.email ? `library_${user.email}` : "library_guest";
    }
    return "library_guest";
  } catch (error) {
    console.error("Error getting library key:", error);
    return "library_guest";
  }
};

// Get current user email for library scoping
export const getCurrentUserEmail = () => {
  try {
    const userProfile = localStorage.getItem("userProfile");
    if (userProfile) {
      const user = JSON.parse(userProfile);
      return user?.email || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting current user email:", error);
    return null;
  }
};

// Get library from localStorage with user scope
export const getLibrary = async () => {
  try {
    const key = getLibraryKey();
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting library:", error);
    return [];
  }
};

// Get library item by ID and type
export const getLibraryItem = async (id, type) => {
  try {
    const library = await getLibrary();
    return findItem(id, type, library);
  } catch (error) {
    console.error("Error getting library item:", error);
    return null;
  }
};

// Update library item
export const updateLibraryItem = async (id, type, updates) => {
  try {
    const library = await getLibrary();
    const idx = library.findIndex((i) => i.id === id && i.type === type);

    if (idx !== -1) {
      library[idx] = { ...library[idx], ...updates };
      await saveLibrary(library);
      return library[idx];
    }

    return null;
  } catch (error) {
    console.error("Error updating library item:", error);
    return null;
  }
};

// Find item in library
export const findItem = (id, type, library) =>
    library.find((i) => i.id === id && i.type === type);

// Save library to localStorage with user scope
export const saveLibrary = async (items) => {
  const key = getLibraryKey();
  localStorage.setItem(key, JSON.stringify(items));

  // Dispatch event for components to update
  window.dispatchEvent(new CustomEvent("libraryUpdated", { detail: items }));

  // Also dispatch a specific event for this user's library
  const userEmail = getCurrentUserEmail();
  window.dispatchEvent(new CustomEvent(`libraryUpdated_${userEmail || 'guest'}`, { detail: items }));
};

// Clear library for current user/guest
export const clearLibrary = async () => {
  const key = getLibraryKey();
  localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent("libraryUpdated", { detail: [] }));

  const userEmail = getCurrentUserEmail();
  window.dispatchEvent(new CustomEvent(`libraryUpdated_${userEmail || 'guest'}`, { detail: [] }));
};

// Clear ALL libraries (for logout or cleanup)
export const clearAllLibraries = async () => {
  // Clear guest library
  localStorage.removeItem("library_guest");

  // Clear all user libraries by finding keys that start with "library_"
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("library_") && key !== "library_guest") {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
  window.dispatchEvent(new CustomEvent("libraryUpdated", { detail: [] }));
};

// Check if item is in library
export const isInLibrary = async (id, type) => {
  try {
    const library = await getLibrary();
    return library.some(x => x.id === id && x.media_type === type);
  } catch (error) {
    console.error("Error checking if in library:", error);
    return false;
  }
};

// Check if item is favorite
export const isFavorite = async (id, type) => {
  try {
    const library = await getLibrary();
    const item = library.find(x => x.id === id && x.media_type === type);
    return item ? !!item.favorite : false;
  } catch (error) {
    console.error("Error checking favorite:", error);
    return false;
  }
};

// Toggle library item
export const toggleLibraryItem = async (item) => {
  const current = await getLibrary();
  const idx = current.findIndex((i) => i.id === item.id && i.type === item.type);

  if (idx !== -1) {
    current.splice(idx, 1);
  } else {
    current.push({
      id: item.id,
      media_type: item.media_type || item.type,
      title: item.title || item.name,
      poster_path: item.poster_path || item.backdrop_path || null,
      favorite: false,
      status: "Watchlist",
      duration: item.duration || getDefaultDuration(item.type),
      dateAdded: new Date().toISOString(),
      genres: item.genres || [],
      isRewatching: false,
      type: item.type,
      image: item.image || ""
    });
  }

  await saveLibrary(current);
  return current;
};

// Remove from library
export const removeFromLibrary = async (id, type) => {
  try {
    const current = await getLibrary();
    const idx = current.findIndex((i) => i.id === id && i.media_type === type);

    if (idx !== -1) {
      current.splice(idx, 1);
      await saveLibrary(current);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error removing from library:", error);
    return false;
  }
};

// Toggle favorite
export const toggleFavorite = async (id, type, itemData = {}) => {
  try {
    const current = await getLibrary();
    const idx = current.findIndex((i) => i.id === id && i.media_type === type);

    if (idx !== -1) {
      current[idx].favorite = !current[idx].favorite;
    } else {
      const newItem = {
        id,
        media_type: type,
        type,
        favorite: true,
        status: "Watchlist",
        duration: itemData.duration || getDefaultDuration(type),
        dateAdded: new Date().toISOString(),
        title: itemData.title || "",
        image: itemData.image || "",
        poster_path: itemData.poster_path || null,
        genres: itemData.genres || [],
        isRewatching: false,
        ...itemData
      };
      current.push(newItem);
    }

    await saveLibrary(current);
    return current;
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return [];
  }
};

// Get default duration
const getDefaultDuration = (type) => {
  switch (type) {
    case "movie":
      return 120;
    case "tv":
    case "series":
      return 45;
    case "anime":
      return 24;
    default:
      return 60;
  }
};

// Update library status
export const updateLibraryStatus = async (id, type, newStatus, itemData = {}) => {
  try {
    const library = await getLibrary();
    const idx = library.findIndex((i) => i.id === id && i.media_type === type);

    if (idx !== -1) {
      library[idx].status = newStatus;

      if (newStatus === "Completed" && !library[idx].dateCompleted) {
        library[idx].dateCompleted = new Date().toISOString();
      }

      if (itemData.genres && itemData.genres.length > 0) {
        library[idx].genres = itemData.genres;
      }

      if (itemData.duration && itemData.duration > 0) {
        library[idx].duration = itemData.duration;
      } else if (!library[idx].duration || library[idx].duration === 0) {
        library[idx].duration = getDefaultDuration(type);
      }

      if (itemData.isRewatching !== undefined) {
        library[idx].isRewatching = itemData.isRewatching;
      }
    } else if (newStatus) {
      const duration = itemData.duration > 0 ? itemData.duration : getDefaultDuration(type);
      const newItem = {
        id: Number(id),
        media_type: type,
        type,
        status: newStatus,
        favorite: false,
        duration: duration,
        title: itemData.title || "",
        image: itemData.image || "",
        poster_path: itemData.poster_path || null,
        genres: itemData.genres || [],
        dateAdded: new Date().toISOString(),
        isRewatching: itemData.isRewatching || false,
        ...(newStatus === "Completed" ? { dateCompleted: new Date().toISOString() } : {})
      };
      library.push(newItem);
    }

    await saveLibrary(library);
    return library;
  } catch (error) {
    console.error("Error updating library status:", error);
    return [];
  }
};

// Import library from JSON file
export const importLibraryFromFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);

        if (!Array.isArray(importedData)) {
          throw new Error("Invalid library format. Expected an array.");
        }

        const validLibrary = importedData.filter(item =>
            item && item.id && (item.media_type || item.type) && item.title
        );

        const currentLibrary = await getLibrary();
        const mergedLibrary = [...currentLibrary, ...validLibrary];

        const uniqueLibrary = mergedLibrary.filter((item, index, self) =>
                index === self.findIndex((t) => (
                    t.id === item.id && (t.media_type || t.type) === (item.media_type || item.type)
                ))
        );

        await saveLibrary(uniqueLibrary);
        resolve(uniqueLibrary.length);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

// Export library to JSON file
export const exportLibraryToFile = async () => {
  const library = await getLibrary();
  const userEmail = getCurrentUserEmail();
  const fileName = userEmail
      ? `cinecooltv-library-${userEmail.split('@')[0]}-${new Date().toISOString().split('T')[0]}.json`
      : `cinecooltv-library-guest-${new Date().toISOString().split('T')[0]}.json`;

  const dataStr = JSON.stringify(library, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Get library statistics for current user
export const getLibraryStats = async () => {
  const library = await getLibrary();

  const stats = {
    total: library.length,
    completed: library.filter(item => item.status === "Completed").length,
    favorites: library.filter(item => item.favorite).length,
    movies: library.filter(item => item.media_type === "movie" || item.type === "movie").length,
    shows: library.filter(item => item.media_type === "tv" || item.type === "tv" || item.type === "series").length,
    anime: library.filter(item => item.media_type === "anime" || item.type === "anime").length,
    watchlist: library.filter(item => item.status === "Watchlist").length,
    watching: library.filter(item => item.status === "Watching").length,
    planning: library.filter(item => item.status === "Planning").length,
    dropped: library.filter(item => item.status === "Dropped").length,
  };

  const totalMinutes = library
      .filter(item => item.status === "Completed")
      .reduce((total, item) => total + (item.duration || 0), 0);

  stats.totalWatchTime = {
    minutes: totalMinutes,
    hours: Math.floor(totalMinutes / 60),
    days: Math.floor(totalMinutes / 1440),
  };

  return stats;
};

// Get all library keys (for debugging or admin purposes)
export const getAllLibraryKeys = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("library_")) {
      keys.push(key);
    }
  }
  return keys;
};

// Migrate from old guest library to new user-scoped system
export const migrateOldLibrary = async () => {
  const oldGuestLibrary = localStorage.getItem("guest_library");
  if (oldGuestLibrary) {
    try {
      const libraryData = JSON.parse(oldGuestLibrary);
      const currentKey = getLibraryKey();

      // If we're currently guest, save the old library to the new key
      if (currentKey === "library_guest") {
        localStorage.setItem(currentKey, oldGuestLibrary);
        console.log("Migrated old guest library to new system");
      }

      // Remove the old key
      localStorage.removeItem("guest_library");

      return true;
    } catch (error) {
      console.error("Error migrating old library:", error);
      return false;
    }
  }
  return false;
};

// Initialize library system on first load
export const initializeLibrary = async () => {
  // Migrate from old system if needed
  await migrateOldLibrary();

  // Ensure current user has a library
  const library = await getLibrary();
  if (library.length === 0) {
    await saveLibrary([]);
  }

  return library;
};