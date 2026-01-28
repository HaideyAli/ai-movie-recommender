'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';


export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/signup'); // redirect after logout
  };

  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          🎬 Flick Finder
        </Link>

        {/* Right */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-gray-300 hover:text-white transition"
          >
            Rate
          </Link>

          {user && (
            <Link
              href="/recommendations"
              className="text-gray-300 hover:text-white transition"
            >
              Recommendations
            </Link>
          )}

          {user && (
            <Link
              href="/ratings"
              className="text-gray-300 hover:text-white transition"
            >
              Your Ratings
            </Link>
          )}

          {!user ? (
            <Link
              href="/login"
              className="px-4 py-2 rounded bg-white text-black font-semibold hover:bg-gray-200 transition"
            >
              Sign In
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-500 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
