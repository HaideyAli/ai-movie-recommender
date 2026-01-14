import { supabase } from '@/lib/supabase';
import { Movie } from '@/types/movie';
import Image from 'next/image';

// TMDB poster base URL
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

export default async function Home() {
  // Fetch movies from Supabase
  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .order('popularity', { ascending: false }) // Most popular first
    .limit(50); // Optional: limit number of movies fetched

  if (error) return <p className="p-8 text-red-600">Error fetching movies: {error.message}</p>;

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Popular Movies</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {movies?.map((movie: Movie) => (
          <div key={movie.id} className="border rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-200">
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
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}