import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase/client.js';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resetpassword`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
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

          <div className="text-center text-xl sm:text-2xl font-semibold mb-2 text-white">
            Forgot Password
          </div>

          {!sent ? (
            <>
              <p className="text-slate-400 text-sm text-center mb-8">
                Enter your email and we'll send you a reset link.
              </p>

              <form className="space-y-5" onSubmit={handleSubmit}>
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

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
                >
                  {submitting ? 'Sending...' : 'Send Reset Link'}
                </button>

                <p className="text-center text-sm text-slate-500">
                  <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
                    Back to Sign In
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-white">✓ Reset link sent!</p>
              <p className="text-slate-400 text-sm">
                Check your email and click the link to reset your password.
              </p>
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 text-sm">
                Back to Sign In
              </Link>
            </div>
          )}

        </div>
      </div>

      <footer className="text-center text-sm text-slate-500 py-4">
        &copy; {new Date().getFullYear()} Your Company. All rights reserved.
      </footer>
    </div>
  );
};

export default ForgotPassword;
