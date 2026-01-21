"use client";

import { useEffect, useState } from "react";

type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path?: string;
};

export default function RecommendationsPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // TEMP: hardcode user id for now
  const userId = "b154115c-30f5-4933-8611-9de0c84becf7";

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/recommendations/${userId}`)
      .then(res => res.json())
      .then(data => {
        setMovies(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading recommendations...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Recommended for you</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {movies.map(movie => (
          <div key={movie.id} className="border rounded p-3">
            {movie.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="rounded mb-2"
              />
            )}
            <h2 className="font-semibold">{movie.title}</h2>
            <p className="text-sm text-gray-600 line-clamp-4">
              {movie.overview}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
