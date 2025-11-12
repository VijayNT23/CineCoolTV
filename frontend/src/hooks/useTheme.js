// src/hooks/useTheme.js (if you want to keep this file)
import { useTheme as useThemeContext } from '../context/ThemeContext';

export const useTheme = () => {
    const context = useThemeContext();

    // Return the same interface as the context
    return {
        theme: context.theme,
        toggleTheme: context.toggleTheme,
        isDark: context.isDark
    };
};