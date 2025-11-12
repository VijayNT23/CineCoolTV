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
        <div className="relative group my-8">
            <h2 className="text-2xl font-semibold mb-3 px-8">{title}</h2>

            {/* Scroll Buttons */}
            <button
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 p-3 rounded-full opacity-0 group-hover:opacity-100 transition"
                onClick={() => scroll("left")}
            >
                <ChevronLeft size={28} className="text-white" />
            </button>
            <button
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 p-3 rounded-full opacity-0 group-hover:opacity-100 transition"
                onClick={() => scroll("right")}
            >
                <ChevronRight size={28} className="text-white" />
            </button>

            {/* Movie Posters */}
            <div
                ref={rowRef}
                className="flex overflow-x-scroll scrollbar-hide space-x-4 px-8 scroll-smooth snap-x snap-mandatory"
            >
                {movies.map((m) => (
                    <motion.div
                        key={m.id}
                        whileHover={{ scale: 1.15 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="relative min-w-[160px] snap-center cursor-pointer"
                        onClick={() => onMovieClick(m)}
                    >
                        <img
                            src={`https://image.tmdb.org/t/p/w300${m.poster_path}`}
                            alt={m.title}
                            className="w-40 h-60 object-cover rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center rounded-xl transition">
                            <p className="text-sm font-semibold text-white text-center px-2">
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
