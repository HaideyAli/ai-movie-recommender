'use client';

import Image from 'next/image';
import { Movie } from '@/types/movie';
import StarRating from '@/components/StarRating';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

type MovieCardProps = {
  movie: Movie;
  rating?: number;
  isLoggedIn: boolean;
  onRate: (value: number) => void;
};

export default function MovieCard({
  movie,
  rating,
  isLoggedIn,
  onRate,
}: MovieCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-gray-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative group">
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
          {movie.release_date ? movie.release_date.slice(0, 4) : 'N/A'}
        </p>

        <StarRating
          value={rating ?? null}
          onChange={onRate}
          disabled={!isLoggedIn}
        />

        <p className="text-sm text-gray-600 mt-1">
          {rating ? `${rating.toFixed(1)} / 5.0` : 'Not rated'}
        </p>

        {!isLoggedIn && (
          <p className="text-xs text-gray-400 mt-1">
            Sign in to rate and get recommendations
          </p>
        )}
      </div>
    </div>
  );
}
