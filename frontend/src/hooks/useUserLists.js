// src/hooks/useUserLists.js
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

const STORAGE_KEY = "cinecoolLibrary";

export function useUserLists() {
    const [user, setUser] = useState(null);
    const [lists, setLists] = useState({
        watchlist: [],
        watching: [],
        considering: [],
        dropped: [],
        favorite: [],
        completed: [],
    });

    // ✅ Detect Auth Changes
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);

            if (u) {
                // User logged in → Load their Firestore data
                const ref = doc(db, "users", u.uid);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.lists) setLists(data.lists);
                } else {
                    // Initialize new user
                    await setDoc(ref, { lists });
                }
            } else {
                // Guest → Load from localStorage
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) setLists(JSON.parse(saved));
            }
        });
        return () => unsub();
    }, [lists]);

    // ✅ Sync lists to Firestore or localStorage
    useEffect(() => {
        const sync = async () => {
            if (user) {
                try {
                    const ref = doc(db, "users", user.uid);
                    await updateDoc(ref, { lists });
                } catch {
                    await setDoc(doc(db, "users", user.uid), { lists });
                }
            } else {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
            }

            // Notify others (for library UI updates)
            window.dispatchEvent(
                new CustomEvent("libraryUpdated", { detail: getLibraryFromLists(lists) })
            );
        };

        sync();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lists, user]);

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

    return { user, lists, addToList, removeFromList, isInList };
}

// 🔹 Helper — flatten all lists for display/stat use
export function getLibraryFromLists(lists) {
    const all = [];
    Object.entries(lists).forEach(([status, items]) => {
        items.forEach((it) => all.push({ ...it, status }));
    });
    return all;
}
