import React, { useState } from "react";
import axios from "axios";

function AddMovieForm({ onMovieAdded }) {
    const [form, setForm] = useState({
        title: "",
        genre: "",
        director: "",
        releaseYear: "",
        rating: ""
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post("http://localhost:8080/api/movies", form)
            .then(() => {
                onMovieAdded(); // refresh movie list
                setForm({ title: "", genre: "", director: "", releaseYear: "", rating: "" });
            })
            .catch((err) => console.error("Error adding movie:", err));
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 border rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-bold mb-3">➕ Add a New Movie</h2>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="border p-2 mb-2 w-full" required />
            <input name="genre" value={form.genre} onChange={handleChange} placeholder="Genre" className="border p-2 mb-2 w-full" required />
            <input name="director" value={form.director} onChange={handleChange} placeholder="Director" className="border p-2 mb-2 w-full" required />
            <input name="releaseYear" value={form.releaseYear} onChange={handleChange} placeholder="Year" className="border p-2 mb-2 w-full" required />
            <input name="rating" value={form.rating} onChange={handleChange} placeholder="Rating" className="border p-2 mb-2 w-full" required />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Movie</button>
        </form>
    );
}

export default AddMovieForm;
