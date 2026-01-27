'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Movie } from '@/types/movie';
import Image from 'next/image';
import StarRating from '@/components/StarRating';
import MovieCard from '@/components/MovieCard';
import { useRouter } from 'next/navigation';


const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const router = useRouter();


  // Ratings: key = movie.id (string), value = rating number
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const unratedMovies = movies.filter(
      (movie, index, self) =>
        ratings[movie.id] === undefined &&
        index === self.findIndex((m) => m.id === movie.id)
  );

  const PAGE_SIZE = 40;


  const isLoggedIn = !!userId;

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace('/signup'); // 👈 first page they see
      } else {
        setUserId(data.session.user.id);
      }
    };

    checkAuth();
  }, [router]);


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
    <main className="p-8 max-w-7xl mx-auto min-h-screen">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-3">
          Rate Movies
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-balance">
          The more you rate, the better your personalized recommendations become. 
          Tell us what you love (and what you don't).
        </p>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {unratedMovies.map((movie) => (
          <div key={movie.id} className="transition-all duration-300 hover:scale-[1.02]">
            <MovieCard
                movie={movie}
                rating={ratings[movie.id]}
                isLoggedIn={isLoggedIn}
                onRate={(value) => handleRate(movie.id, value)}
              />
          </div>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-8 py-3 bg-zinc-100 hover:bg-white text-black font-semibold rounded-xl transition-all active:scale-95 shadow-xl shadow-white/5"
        >
          Load more movies
        </button>
      </div>
    </main>
  );
}