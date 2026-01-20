'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Movie } from '@/types/movie';
import Image from 'next/image';
import StarRating from '@/components/StarRating';

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Ratings: key = movie.id (string), value = rating number
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const unratedMovies = movies.filter(
    (movie) => ratings[movie.id] === undefined
  );

  const isLoggedIn = !!userId;

  // Fetch user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

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

  // Load all existing ratings on pageload
  useEffect(() => {
  if (!userId) return;

  const fetchRatings = async () => {
    const { data, error } = await supabase
      .from('ratings')
      .select('movie_id, rating')
      .eq('user_id', userId);

    if (!error && data) {
      const mappedRatings: Record<string, number> = {};
      data.forEach((r) => {
        mappedRatings[r.movie_id] = r.rating;
      });
      setRatings(mappedRatings);
    }
  };
  fetchRatings();
  }, [userId]);

  // Handle user rating click
  const handleRate = async (movieId: string, value: number) => {
    console.log('Rating click', { movieId, value });
  
    setRatings((prev) => ({ ...prev, [movieId]: value }));

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('You must be logged in to rate movies');
      return;
    }

    const { error } = await supabase
      .from('ratings')
      .upsert(
        {
          user_id: user.id,
          movie_id: movieId,
          rating: value,
        },
        {
          onConflict: 'user_id,movie_id',
        }
      );

    if (error) {
      console.error('Rating error:', error.message);
    }
  };

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold text-center mb-2">
        Rate Movies
      </h1>
      <p className="text-center text-gray-500 mb-8">
        Rate movies to improve your personalized recommendations
      </p>

      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {unratedMovies.map((movie) => (
          <div
            key={movie.id}
            className="border rounded-lg overflow-hidden bg-gray-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className='relative group'>
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

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            </div>

            <div className="p-4">
              <h2 className="font-semibold text-lg">{movie.title}</h2>
              <p className="text-sm text-gray-500">
                {movie.release_date ? movie.release_date.slice(0, 4) : "N/A"}
              </p>

              <StarRating
                value={ratings[movie.id] ?? null}
                onChange={(val) => handleRate(movie.id, val)}
                disabled = {!isLoggedIn}
              />
                    
              <p className="text-sm text-gray-600 mt-1">
                {ratings[movie.id]
                  ? `${ratings[movie.id].toFixed(1)} / 5.0`
                  : 'Not rated'}
              </p>

              {/* When not logged in */}
              {!userId && (
                <p className="text-xs text-gray-400 mt-1">
                  Sign in to rate and get recommendations
                </p>
              )}

            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
