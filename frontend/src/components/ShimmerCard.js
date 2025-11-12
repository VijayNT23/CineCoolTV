// src/components/ShimmerCard.js
import React from "react";
import { useTheme } from "../context/ThemeContext";

const ShimmerCard = ({ isLargeRow }) => {
    const { theme } = useTheme();

    const cardWidth = isLargeRow
        ? "min-w-[220px] max-w-[220px] h-[330px]"
        : "min-w-[180px] max-w-[180px] h-[270px]";

    return (
        <div
            className={`relative flex-shrink-0 rounded-xl overflow-hidden ${
                theme === "dark" ? "bg-gray-800" : "bg-gray-300"
            } ${cardWidth}`}
        >
            {/* Enhanced Smooth Shimmer */}
            <div className="absolute inset-0 shimmer-cinematic rounded-xl"></div>

            {/* Subtle overlay for depth */}
            <div className={`absolute inset-0 rounded-xl ${
                theme === "dark" ? "bg-gradient-to-t from-black/20 to-transparent" : "bg-gradient-to-t from-white/20 to-transparent"
            }`} />
        </div>
    );
};

export default ShimmerCard;