// src/components/ShimmerCard.js
import React from "react";
import { useTheme } from "../context/ThemeContext";

const ShimmerCard = ({ isLargeRow }) => {
    const { theme } = useTheme();

    const cardWidth = isLargeRow
        ? "min-w-[140px] sm:min-w-[180px] md:min-w-[220px] max-w-[140px] sm:max-w-[180px] md:max-w-[220px] h-[200px] sm:h-[270px] md:h-[330px]"
        : "min-w-[120px] sm:min-w-[150px] md:min-w-[180px] max-w-[120px] sm:max-w-[150px] md:max-w-[180px] h-[170px] sm:h-[225px] md:h-[270px]";

    return (
        <div
            className={`relative flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden ${
                theme === "dark" ? "bg-gray-800" : "bg-gray-300"
            } ${cardWidth}`}
        >
            {/* Enhanced Smooth Shimmer */}
            <div className="absolute inset-0 shimmer-cinematic rounded-lg sm:rounded-xl"></div>

            {/* Subtle overlay for depth */}
            <div className={`absolute inset-0 rounded-lg sm:rounded-xl ${
                theme === "dark" ? "bg-gradient-to-t from-black/20 to-transparent" : "bg-gradient-to-t from-white/20 to-transparent"
            }`} />
        </div>
    );
};

export default ShimmerCard;