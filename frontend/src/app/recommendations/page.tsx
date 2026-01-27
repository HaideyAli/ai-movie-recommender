'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import MovieCard from '@/components/MovieCard';
import { Movie } from '@/types/movie';
import { useRouter } from 'next/navigation';

export default function RecommendationsPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});


  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/login');
      }
    });
  }, [router]);

  // Fetch user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Fetch recommendations
  useEffect(() => {
    if (!userId) return;

    const fetchRecommendations = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/recommendations/${userId}`
        );

        if (!res.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await res.json();

        // Defensive check (important)
        if (!Array.isArray(data)) {
          throw new Error('Recommendations response is not an array');
        }

        setMovies(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId]);
  
  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-xl font-medium text-zinc-400 tracking-tight">
          Please sign in to see recommendations
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 font-medium tracking-tight">Curating your list...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }


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

    setMovies((prev) => prev.filter((m) => m.id !== movieId));

  };

  return (
    <main className="p-8 max-w-7xl mx-auto min-h-screen">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-3">
          Recommended For You
        </h1>
        <p className="text-zinc-400 max-w-lg mx-auto">
          Based on your taste, we think you'll love these titles.
        </p>
      </header>

      {movies.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center backdrop-blur-sm">
          <span className="text-4xl mb-4 block">🎬</span>
          <p className="text-zinc-300 text-lg font-medium tracking-tight">
            More ratings = Better picks.
          </p>
          <p className="text-zinc-500 mt-2 text-sm">
            Rate a few more movies to help our engine find your style.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {movies.map((movie) => (
            <div key={movie.id} className="transition-transform duration-300 hover:scale-[1.02]">
              <MovieCard
                movie={movie}
                rating={ratings[movie.id]}
                isLoggedIn={true}
                onRate={(value) => {handleRate(movie.id, value)}}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}