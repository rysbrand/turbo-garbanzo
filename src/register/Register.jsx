import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client.js';
import { ensureProfile } from '../lib/ensureProfile';

const Register = () => {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const normalizePhone = (value) => value.replace(/\D/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const firstNameTrimmed = firstName.trim();
    const lastNameTrimmed = lastName.trim();
    const emailTrimmed = email.trim().toLowerCase();
    const mobileDigits = normalizePhone(mobile);

    if (!firstNameTrimmed || !lastNameTrimmed || !emailTrimmed || !mobileDigits || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (!validateEmail(emailTrimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!/^\d{10}$/.test(mobileDigits)) {
      setError('Mobile number must be 10 digits.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailTrimmed,
        password,
        options: {
          data: {
            first_name: firstNameTrimmed,
            last_name: lastNameTrimmed,
            mobile: mobileDigits,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data?.user) {
        setError('Account was not created. Please try again.');
        return;
      }

      // If email confirmation is disabled, we can immediately upsert profile data.
      // If confirmation is required, the DB trigger still creates the profile row from metadata.
      if (data.session) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            first_name: firstNameTrimmed,
            last_name: lastNameTrimmed,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

          console.log(data.user.id, firstNameTrimmed, lastNameTrimmed, emailTrimmed, password);
        if (profileError) {
          setError(profileError.message);
          return;
        }
      }

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // calls function from ensureProfile.js
    await ensureProfile();

    setMsg('Account created. Redirecting to sign in…');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4 text-white">
      <div className="w-full max-w-4xl bg-slate-900/90 backdrop-blur rounded-2xl shadow-xl p-6 md:p-10">
        <div className="text-center mb-10">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">
            Sign up for an Account
          </h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                required
                placeholder="Enter first name"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                required
                placeholder="Enter last name"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                placeholder="Enter email"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Mobile No.</label>
              <input
                type="text"
                required
                placeholder="Enter mobile number"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="Enter password"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                placeholder="Confirm password"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="mt-10 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold px-14 py-3 rounded-lg transition"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
