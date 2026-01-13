import { supabase } from '@/lib/supabase';


export default async function Home() {
  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .order('release_year', { ascending: false });

  if (error) {
    return <p>Error fetching movies: {error.message}</p>;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Movies</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {movies?.map((movie: any) => (
          <div key={movie.id} className="border p-4 rounded">
            <h2 className="font-semibold">{movie.title}</h2>
            <p className="text-sm">{movie.description}</p>
            <p className="text-xs text-gray-500">
              {movie.genres.join(', ')} - {movie.release_year}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}