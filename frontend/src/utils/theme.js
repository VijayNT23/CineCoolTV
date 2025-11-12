// src/utils/theme.js

export function applyTheme(theme) {
    const root = document.documentElement;

    // Add or remove the dark class from the HTML tag
    if (theme === "dark") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }

    // Save preference in localStorage
    localStorage.setItem("theme", theme);
}

export function getInitialTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) return savedTheme;

    // Respect system preference if no saved preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
}
