import React, {useEffect, useState} from 'react';
import { supabase } from '../lib/supabase/client';
import {User} from 'lucide-react';


const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const roleLabels = {
    1: 'Employee',
    2: 'Scheduling Manager',
    3: 'System Admin'
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user }} = await supabase.auth.getUser();
        if (!user) return;

        setEmail(user.email);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) throw error;

        setProfile(data);
        setFirstName(data?.first_name || '');
        setLastName(data?.last_name || '');
        setUsername(data?.username || '');

      } catch (err) {
        console.error('Failed to load profile:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const {data: {user}} = await supabase.auth.getUser();
      if(!user) return;

      const {error} = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({
        ...prev,
        first_name:firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
      }));

      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto space-y-6 py-6">

      {/* Avatar + Name */}
      <div className="bg-slate-800 rounded-2xl p-6 flex flex-col items-center gap-3">
        <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center">
          <User className="h-10 w-10 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            {profile?.first_name || ''} {profile?.last_name || ''}
          </h2>
          <p className="text-slate-400 text-sm">{email}</p>
          <span className="inline-block mt-2 text-xs bg-indigo-600/30 text-indigo-300 px-3 py-1 rounded-full">
            {roleLabels[profile?.user_role] || 'No role assigned'}
          </span>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white">Profile Details</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition"
            >
              Edit
            </button>
          )}
        </div>

        {/* First Name */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">First Name</label>
          {editing ? (
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-white text-sm">{profile?.first_name || '—'}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Last Name</label>
          {editing ? (
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-white text-sm">{profile?.last_name || '—'}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Username</label>
          {editing ? (
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-white text-sm">{profile?.username || '—'}</p>
          )}
        </div>

        {/* Email — read only */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Email</label>
          <p className="text-white text-sm">{email}</p>
        </div>

        {/* Role — read only */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Role</label>
          <p className="text-white text-sm">{roleLabels[profile?.user_role] || '—'}</p>
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Edit Actions */}
        {editing && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setFirstName(profile?.first_name || '');
                setLastName(profile?.last_name || '');
                setUsername(profile?.username || '');
                setError('');
              }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2.5 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        )}

        {saved && (
          <p className="text-green-400 text-sm text-center">✓ Profile updated!</p>
        )}
      </div>

    </div>
  );
};

export default Profile;
