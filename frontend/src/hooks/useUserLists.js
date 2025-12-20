// src/hooks/useUserLists.js
// ✅ FIXED: Removed Firebase, now uses backend API + localStorage
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const STORAGE_KEY = "cinecoolLibrary";

export function useUserLists() {
    const { currentUser, API } = useAuth();
    const [lists, setLists] = useState({
        watchlist: [],
        watching: [],
        considering: [],
        dropped: [],
        favorite: [],
        completed: [],
    });

    // ✅ Load lists from backend or localStorage
    useEffect(() => {
        const loadLists = async () => {
            if (currentUser) {
                // User logged in → Load from backend
                try {
                    const response = await API.get("/api/user/lists");
                    if (response.data) {
                        setLists(response.data.lists || lists);
                    }
                } catch (error) {
                    console.error("Error loading lists from backend:", error);
                    // Fallback to localStorage
                    const saved = localStorage.getItem(STORAGE_KEY);
                    if (saved) setLists(JSON.parse(saved));
                }
            } else {
                // Guest → Load from localStorage
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) setLists(JSON.parse(saved));
            }
        };

        loadLists();
    }, [currentUser]);

    // ✅ Sync lists to backend or localStorage
    useEffect(() => {
        const sync = async () => {
            if (currentUser) {
                // Save to backend
                try {
                    await API.post("/api/user/lists", { lists });
                } catch (error) {
                    console.error("Error syncing lists to backend:", error);
                    // Fallback to localStorage
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
                }
            } else {
                // Save to localStorage
                localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
            }

            // Notify other components
            window.dispatchEvent(
                new CustomEvent("libraryUpdated", { detail: getLibraryFromLists(lists) })
            );
        };

        sync();
    }, [lists, currentUser]);

    // ✅ Add item to list
    const addToList = (listName, item) => {
        setLists((prev) => ({
            ...prev,
            [listName]: prev[listName].some((i) => i.id === item.id)
                ? prev[listName]
                : [...prev[listName], item],
        }));
    };

    // ✅ Remove item from list
    const removeFromList = (listName, id) => {
        setLists((prev) => ({
            ...prev,
            [listName]: prev[listName].filter((i) => i.id !== id),
        }));
    };

    // ✅ Check item existence
    const isInList = (listName, id) => lists[listName]?.some((i) => i.id === id);

    return { user: currentUser, lists, addToList, removeFromList, isInList };
}

// 🔹 Helper — flatten all lists for display/stat use
export function getLibraryFromLists(lists) {
    const all = [];
    Object.entries(lists).forEach(([status, items]) => {
        items.forEach((it) => all.push({ ...it, status }));
    });
    return all;
}
