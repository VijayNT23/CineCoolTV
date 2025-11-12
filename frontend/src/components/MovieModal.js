import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, X, ThumbsUp, MessageSquare } from "lucide-react";

const MovieModal = ({ movie, onClose }) => {
    const [liked, setLiked] = useState(false);
    const [favourite, setFavourite] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    if (!movie) return null;

    const handleAddComment = () => {
        if (newComment.trim() === "") return;
        setComments([...comments, newComment]);
        setNewComment("");
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900 dark:bg-gray-800 text-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl"
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
                    <h2 className="text-2xl font-bold">{movie.title || movie.name}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-400 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col md:flex-row">
                    <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full md:w-1/3 object-cover"
                    />

                    <div className="p-6 flex-1 space-y-4">
                        <p className="text-gray-300 text-sm">{movie.overview}</p>
                        <p className="text-yellow-400 font-semibold">
                            ⭐ {movie.vote_average?.toFixed(1)} | 🎬 {movie.release_date || "N/A"}
                        </p>

                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={() => setFavourite(!favourite)}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                    favourite ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"
                                }`}
                            >
                                <Heart size={18} /> Favourite
                            </button>

                            <button
                                onClick={() => setLiked(!liked)}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                    liked ? "bg-green-500" : "bg-gray-700 hover:bg-gray-600"
                                }`}
                            >
                                <ThumbsUp size={18} /> Like
                            </button>
                        </div>

                        {/* Comments Section */}
                        <div className="mt-6">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <MessageSquare size={18} /> Comments
                            </h3>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {comments.length > 0 ? (
                                    comments.map((c, i) => (
                                        <p key={i} className="bg-gray-800 p-2 rounded-lg text-sm">
                                            {c}
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-sm">No comments yet.</p>
                                )}
                            </div>

                            <div className="mt-3 flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="flex-1 bg-gray-800 text-white p-2 rounded-lg outline-none"
                                />
                                <button
                                    onClick={handleAddComment}
                                    className="bg-blue-600 px-3 rounded-lg hover:bg-blue-500 transition"
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default MovieModal;
