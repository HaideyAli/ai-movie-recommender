'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import StarRating from '@/components/StarRating';
import { Movie } from '@/types/movie';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

// Define exactly what the join looks like
type RatedMovie = {
  rating: number;
  movies: Movie | Movie[]; // This handles the Supabase "nesting" variance
};

export default function RatingsPage() {
  const [ratedMovies, setRatedMovies] = useState<RatedMovie[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Fetch rated movies
  useEffect(() => {
    if (!userId) return;

    const fetchRatedMovies = async () => {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          rating,
          movies (*)
        `)
        .eq('user_id', userId);

      if (error) {
        setError(error.message);
      } else {
        setRatedMovies(data || []);
      }
    };

    fetchRatedMovies();
  }, [userId]);

  const handleRate = async (movieId: string, value: number) => {
    if (!userId) return;

    setRatedMovies((prev) =>
      prev.map((row) =>
        row.movies[0]?.id === movieId
          ? { ...row, rating: value }
          : row
      )
    );

    await supabase
      .from('ratings')
      .upsert(
        {
          user_id: userId,
          movie_id: movieId,
          rating: value,
        },
        { onConflict: 'user_id,movie_id' }
      );
  };

  if (!userId) {
    return (
      <main className="p-8 text-center">
        <p className="text-gray-500">
          Please sign in to view your rated movies.
        </p>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-2">
        Your Ratings
      </h1>
      <p className="text-center text-gray-500 mb-8">
        Movies you’ve already rated
      </p>

      {error && <p className="text-red-600">{error}</p>}

      {ratedMovies.length === 0 ? (
        <p className="text-center text-gray-500">
          You haven’t rated any movies yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {ratedMovies.map((item, index) => {
            // Use a type guard to safely extract the movie
            const movie = Array.isArray(item.movies) ? item.movies[0] : item.movies;
            
            // If no movie is found in the join, skip rendering
            if (!movie) return null;

            return (
              <div
                key={`${movie.id}-${index}`}
                className="border rounded-lg overflow-hidden bg-gray-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="relative">
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
                </div>

                <div className="p-4">
                  <h2 className="font-semibold text-lg">
                    {movie.title}
                  </h2>

                  <p className="text-sm text-gray-500">
                    {movie.release_date?.slice(0, 4) ?? 'N/A'}
                  </p>

                  <StarRating
                    value={item.rating}
                    onChange={(val) => handleRate(movie.id, val)}
                  />

                  <p className="text-sm text-yellow-500 mt-1 font-medium">
                    {item.rating.toFixed(1)} / 5.0
                  </p>
                </div>
              </div>
            );
          })}

        </div>
      )}
    </main>
  );
}
