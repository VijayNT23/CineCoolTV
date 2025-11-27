// src/components/MovieRow.js
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MovieRow = ({ title, fetchUrl, apiKey, onMovieClick }) => {
    const [movies, setMovies] = useState([]);
    const rowRef = useRef(null);

    useEffect(() => {
        const getMovies = async () => {
            try {
                const res = await axios.get(`${fetchUrl}?api_key=${apiKey}`);
                setMovies(res.data.results);
            } catch (error) {
                console.error("Error fetching movies:", error);
            }
        };
        getMovies();
    }, [fetchUrl, apiKey]);

    const scroll = (direction) => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollAmount = direction === "left" ? -clientWidth : clientWidth;
            rowRef.current.scrollTo({
                left: scrollLeft + scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <div className="relative group my-4 sm:my-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 sm:mb-3 px-4 sm:px-8">{title}</h2>

            {/* Scroll Buttons - Hidden on mobile, visible on hover for desktop */}
            <button
                className="hidden sm:flex absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 p-2 sm:p-3 rounded-full opacity-0 group-hover:opacity-100 transition"
                onClick={() => scroll("left")}
            >
                <ChevronLeft size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </button>
            <button
                className="hidden sm:flex absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 p-2 sm:p-3 rounded-full opacity-0 group-hover:opacity-100 transition"
                onClick={() => scroll("right")}
            >
                <ChevronRight size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </button>

            {/* Movie Posters */}
            <div
                ref={rowRef}
                className="flex overflow-x-auto scrollbar-hide space-x-3 sm:space-x-4 px-4 sm:px-8 scroll-smooth snap-x snap-mandatory"
            >
                {movies.map((m) => (
                    <motion.div
                        key={m.id}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="relative min-w-[120px] sm:min-w-[140px] md:min-w-[160px] snap-center cursor-pointer flex-shrink-0"
                        onClick={() => onMovieClick(m)}
                    >
                        <img
                            src={`https://image.tmdb.org/t/p/w300${m.poster_path}`}
                            alt={m.title}
                            className="w-28 h-40 sm:w-36 sm:h-52 md:w-40 md:h-60 object-cover rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center rounded-lg sm:rounded-xl transition">
                            <p className="text-xs sm:text-sm font-semibold text-white text-center px-1 sm:px-2 line-clamp-2">
                                {m.title || m.name}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default MovieRow;