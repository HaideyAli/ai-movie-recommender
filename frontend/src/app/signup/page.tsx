'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/recommendations');
      }
    });
  }, [router]);

  const handleSignup = async () => {
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://flickfinder.app/login',
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(
        'Account created! Please check your email to confirm your account.'
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Create account
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Join Flick Finder to start rating movies
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <input
            className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            placeholder="Email address"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          <button
            disabled={!!success}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] mt-4"
            onClick={handleSignup}
          >
            Create Account
          </button>

          <p className="text-center text-sm text-zinc-400 mt-6">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
