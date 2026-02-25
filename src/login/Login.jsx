import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase/client.js';
import { useNavigate } from 'react-router-dom';
import { ensureProfile } from '../lib/ensureProfile';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
      return;
    }

    console.log('Logged in user:', data.user);
    // calls function from ensureProfile.js
    await ensureProfile();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-indigo-900 to-slate-900">

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center">

        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur rounded-2xl shadow-xl p-8 mx-auto mt-16">
          
          {/*Logo*/}
          <div className="flex justify-center mb-6">
            <div className="h-10 w-10 rounded-full bg-indigo-500"></div>
          </div>

          {/*Header*/}
          <div className="text-center text-xl sm:text-2xl font-semibold mb-8 text-white">
            Sign in to your account
          </div>

          {/*Form*/}
          <form className="space-y-5" onSubmit={handleSubmit}>

            {/*Email and Password Fields*/}
            <div>
              <label className="block text-sm mb-1 text-slate-300">Email address</label>
              <input
                type="email"
                required
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-300">Password</label>
              <input
                type="password"
                required
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {/*Actions*/}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400">
                <input type="checkbox" className="rounded border-slate-600 text-indigo-500"/>
                Remember me
              </label>
              <a href="#" className="text-indigo-600 hover:text-indigo-300">
                Forgot password?
              </a>
            </div>

            {/*Submit Button and Error Message*/}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Sign in
            </button>

            {error && (
              <p className="text-red-600 text-sm mt-2 text-center">
                {error}
              </p>
            )}

            {/*Footer Text*/}
            <p className="text-center text-sm text-slate-500 mt-8">
              Don’t have an account?{' '}
              <Link
                to="/register"
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign up
              </Link>
            </p>

          </form>
        </div>
      </div>

      {/*Footer Page*/}
      <footer className="text-center text-sm text-slate-500 py-4">
        &copy; {new Date().getFullYear()} Your Company. All rights reserved.
      </footer>

    </div>
  );
};

export default Login;
