export type Movie = {
  id: string;               // Supabase UUID
  tmdb_id: number;          // TMDB unique ID
  title: string;
  overview: string | null;
  poster_path: string | null;
  release_date: string | null;
  genres: string[];
  popularity: number | null;
};