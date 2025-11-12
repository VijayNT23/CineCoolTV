import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useUserLists } from "../hooks/useUserLists";

const MovieDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [activeTab, setActiveTab] = useState("trailer");
    const { addToList, removeFromList, isInList } = useUserLists();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch(
                    `https://api.themoviedb.org/3/movie/${id}?api_key=${
                        import.meta.env.VITE_TMDB_API_KEY
                    }&append_to_response=videos,credits,similar`
                );
                const data = await res.json();
                setMovie(data);
            } catch (err) {
                console.error("Error fetching movie:", err);
            }
        };
        fetchDetails();
    }, [id]);

    if (!movie)
        return (
            <div className="text-white flex justify-center items-center h-screen">
                Loading...
            </div>
        );

    const trailer = movie.videos?.results?.find((v) => v.type === "Trailer");
    const bgImage = `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;

    const buttons = [
        "Watching",
        "Completed",
        "Favorite",
        "Dropped",
        "Considering",
        "Watchlist",
    ];

    return (
        <div
            className="relative min-h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

            <div className="relative z-10 max-w-6xl mx-auto p-6 text-white">
                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition"
                >
                    ← Back
                </button>

                {/* Movie Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-start bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg"
                >
                    <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full md:w-1/3 object-cover"
                    />
                    <div className="p-6 flex-1">
                        <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
                        <p className="text-gray-300 mb-2">
                            {movie.release_date?.slice(0, 4)} •{" "}
                            {movie.genres.map((g) => g.name).join(", ")}
                        </p>
                        <p className="text-sm text-gray-400 mb-4">{movie.runtime} min</p>

                        <div className="flex items-center mb-4">
                            <Star className="text-yellow-400 mr-2" />
                            <span className="font-semibold text-lg">
                {movie.vote_average.toFixed(1)}
              </span>
                        </div>

                        <p className="text-gray-300 mb-6 leading-relaxed">
                            {movie.overview || "No description available."}
                        </p>

                        {/* User List Buttons */}
                        <div className="flex flex-wrap gap-3 mb-4">
                            {buttons.map((list) => (
                                <button
                                    key={list}
                                    onClick={() =>
                                        isInList(list, movie.id)
                                            ? removeFromList(list, movie.id)
                                            : addToList(list, movie)
                                    }
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                                        isInList(list, movie.id)
                                            ? "bg-red-500 hover:bg-red-600"
                                            : "bg-white/10 hover:bg-white/20"
                                    }`}
                                >
                                    {isInList(list, movie.id) ? `Remove ${list}` : `Add to ${list}`}
                                </button>
                            ))}
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-4 mb-4 border-b border-white/20 pb-2">
                            {["trailer", "cast", "comments"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`capitalize pb-1 transition ${
                                        activeTab === tab
                                            ? "border-b-2 border-red-500 text-white"
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        {activeTab === "trailer" && (
                            <div className="rounded-xl overflow-hidden">
                                {trailer ? (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${trailer.key}`}
                                        title="Trailer"
                                        className="w-full h-64 md:h-80 rounded-xl"
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <p className="text-gray-400">No trailer available 🎬</p>
                                )}
                            </div>
                        )}

                        {activeTab === "cast" && (
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                                {movie.credits.cast.slice(0, 10).map((actor) => (
                                    <div key={actor.id} className="text-center">
                                        <img
                                            src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                                            alt={actor.name}
                                            className="rounded-xl mb-2"
                                        />
                                        <p className="text-sm">{actor.name}</p>
                                        <p className="text-xs text-gray-400">{actor.character}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === "comments" && (
                            <div className="mt-4 space-y-2">
                                <p className="text-gray-400">Comments feature coming soon 💬</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Similar Movies Section */}
                {movie.similar?.results?.length > 0 && (
                    <div className="mt-10">
                        <h2 className="text-2xl font-semibold mb-4">
                            More Like {movie.title}
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {movie.similar.results.slice(0, 10).map((m) => (
                                <motion.div
                                    key={m.id}
                                    whileHover={{ scale: 1.05 }}
                                    className="relative cursor-pointer group"
                                    onClick={() => navigate(`/movie/${m.id}`)}
                                >
                                    <img
                                        src={`https://image.tmdb.org/t/p/w300${m.poster_path}`}
                                        alt={m.title}
                                        className="rounded-xl w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-center p-2 rounded-xl">
                                        <p className="text-white text-sm font-medium">
                                            {m.title}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovieDetails;
