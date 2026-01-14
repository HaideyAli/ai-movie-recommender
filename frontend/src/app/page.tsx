'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Movie } from '@/types/movie';
import Image from 'next/image';

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Ratings: key = movie.id (string), value = rating number
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hoverValues, setHoverValues] = useState<Record<string, number>>({});

  // Fetch movies from Supabase
  useEffect(() => {
    const fetchMovies = async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('popularity', { ascending: false })
        .limit(50);
        
        console.log('Fetched movies:', data);

    if (error) setError(error.message);
    else setMovies(data || []);
  };
  fetchMovies();
  }, []);

  // Handle user rating click
  const handleRate = (movieId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [movieId]: value }));

    // TODO: Upsert rating to Supabase
    // Example:
    // await supabase.from('ratings').upsert({ user_id, movie_id: movieId, rating: value });
  };

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-center mb-6">Popular Movies</h1>

      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="border rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-200"
          >
            {movie.poster_path ? (
              <Image
                src={`${POSTER_BASE}${movie.poster_path}`}
                alt={movie.title}
                width={500}
                height={750}
                className="w-full h-auto"
              />
            ) : (
              <div className="bg-gray-200 w-full h-80 flex items-center justify-center">
                No Poster
              </div>
            )}

            <div className="p-4">
              <h2 className="font-semibold text-lg">{movie.title}</h2>
              <p className="text-sm text-gray-500">
                {movie.release_date ? movie.release_date.slice(0, 4) : "N/A"}
              </p>

              {/* Star Rating */}
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const rating = ratings[movie.id] || 0;
                  const hoverValue = hoverValues[movie.id] || 0;
                  const displayValue = hoverValue || rating;

                  return (
                    <div
                      key={star}
                      className="cursor-pointer text-2xl select-none"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = (e.clientX - rect.left) / rect.width;
                        const value = star - 1 + (percent >= 0.5 ? 1 : 0.5);
                        setHoverValues((prev) => ({ ...prev, [movie.id]: value }));
                      }}
                      onMouseLeave={() =>
                        setHoverValues((prev) => ({ ...prev, [movie.id]: 0 }))
                      }
                      onClick={() => handleRate(movie.id, hoverValue || 0)}
                    >
                      {star <= displayValue
                        ? '★'
                        : star - 0.5 <= displayValue
                        ? '☆'
                        : '☆'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
