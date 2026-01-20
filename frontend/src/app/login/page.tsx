'use client';

import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert('Check your email for the login link!');
  };

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      <input
        type="email"
        placeholder="you@email.com"
        className="border p-2 w-full mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        onClick={handleLogin}
        className='cursor-pointer
        bg-black text-white px-6 py-3 rounded-lg font-medium
        transition-all duration-200 ease-out
        hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-lg
        active:scale-95
        focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2'
      >
        Send Magic Link
      </button>
    </main>
  );
}