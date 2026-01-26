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
      <p className="text-center mt-10 text-gray-400">
        Please sign in to see recommendations
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-400">
        Loading recommendations...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center mt-10 text-red-500">
        {error}
      </p>
    );
  }

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold text-center mb-8">
        Recommended For You
      </h1>

      {movies.length === 0 ? (
        <p className="text-center text-gray-400">
          Rate more movies to improve recommendations 🎬
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              rating={undefined}     // no preloaded rating yet
              isLoggedIn={true}
              onRate={() => {}}      // optional for now
            />
            
          ))}
          
        </div>
      )}
    </main>
  );
}
