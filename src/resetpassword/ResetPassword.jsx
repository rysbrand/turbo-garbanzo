import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
      // User has arrived via the reset link, we're ready
        console.log('Password recovery session ready');
        }
        });
          return () => subscription.unsubscribe();
    }, []);



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setSubmitting(true);

        const {error} = await supabase.auth.updateUser({password});

        if (error) {
            setError(error.message);
        } else {
            navigate('/login');
        }
        setSubmitting(false);
    };
return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-indigo-900 to-slate-900">
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur rounded-2xl shadow-xl p-8 mx-auto mt-16">

          <div className="flex justify-center mb-6">
            <div className="h-10 w-10 rounded-full bg-indigo-500"></div>
          </div>

          <div className="text-center text-xl sm:text-2xl font-semibold mb-8 text-white">
            Reset Password
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm mb-1 text-slate-300">New Password</label>
              <input
                type="password"
                required
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-300">Confirm New Password</label>
              <input
                type="password"
                required
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
            >
              {submitting ? 'Updating...' : 'Reset Password'}
            </button>
          </form>

        </div>
      </div>

      <footer className="text-center text-sm text-slate-500 py-4">
        &copy; {new Date().getFullYear()} Your Company. All rights reserved.
      </footer>
    </div>
  );
};

export default ResetPassword;