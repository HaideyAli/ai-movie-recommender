'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Movie } from '@/types/movie';
import Image from 'next/image';
import StarRating from '@/components/StarRating';
import MovieCard from '@/components/MovieCard';

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [page, setPage] = useState(0);


  // Ratings: key = movie.id (string), value = rating number
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const unratedMovies = movies.filter(
      (movie, index, self) =>
        ratings[movie.id] === undefined &&
        index === self.findIndex((m) => m.id === movie.id)
  );

  const PAGE_SIZE = 40;


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
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('popularity', { ascending: false })
        .range(from, to);
        
        console.log('Fetched movies:', data);

      if (error) {
        setError(error.message);
      } else {
        setMovies((prev) => [...prev, ...(data || [])]);
      }
    };

    fetchMovies();
  }, [page]);

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
          <MovieCard
              key={movie.id}
              movie={movie}
              rating={ratings[movie.id]}
              isLoggedIn={isLoggedIn}
              onRate={(value) => handleRate(movie.id, value)}
            />
        ))}
      </div>

      <button
        onClick={() => setPage((p) => p + 1)}
        className="mt-10 mx-auto block px-6 py-3 bg-white text-black rounded font-semibold hover:bg-gray-200"
      >
        Load more movies
      </button>
    </main>
  );
}
