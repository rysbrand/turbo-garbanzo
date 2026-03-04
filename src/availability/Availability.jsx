import React, {useEffect, useState} from 'react';
import { supabase } from '../lib/supabase/client.js';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const defaultDayState = {
  enabled: false,
  start_time: '',
  end_time: '',
  preference_level: 'High',
  allDay: false
};

const Availability = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [availability, setAvailability] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(data.user);
      } catch (err) {
        console.error('Failed to fetch user:', err.message);
      }
    };
    fetchUser();

    setAvailability(
      Object.fromEntries(daysOfWeek.map(day => [day, { ...defaultDayState }]))
    );
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Schedule', path: '/schedule' },
    { name: 'Availability', path: '/availability' },
    { name: 'Pay', path: '/pay' },
    { name: 'Timesheet', path: '/timesheet' }
  ];

  const handleToggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled
      }
    }));
  };

  const handleChange = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleAllDayToggle = (day) => {
    setAvailability(prev => {
      const isAllDay = !prev[day].allDay;
      return {
        ...prev,
        [day]: {
          ...prev[day],
          allDay: isAllDay,
          start_time: isAllDay ? '00:00' : '',
          end_time: isAllDay ? '23:59' : ''
        }
      };
    });
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      await supabase
        .from('availability')
        .delete()
        .eq('user_id', user.id);

      const rows = Object.entries(availability)
        .filter(([_, value]) => value.enabled)
        .map(([day, value]) => ({
          user_id: user.id,
          day_of_week: day,
          start_time: value.start_time,
          end_time: value.end_time,
          preference_level: value.preference_level
        }));

      if (rows.length > 0) {
        await supabase.from('availability').insert(rows);
      }

      alert('Availability saved!');
    } catch (err) {
      alert('Error saving availability: ' + err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      alert('Sign out failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col">
      
      {/* Header */}
      <header className="w-full bg-slate-900">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
          
          <Link to="/profile" className="flex items-center gap-4">
            <User className="h-10 w-10 rounded-full border-2 border-indigo-500 hover:scale-105 transition cursor-pointer" />
          </Link>
          
          <h1 className="text-xl sm:text-3xl font-semibold text-center">
            Company Name / Availability
          </h1>

          <Menu
            className="cursor-pointer hover:text-indigo-400 transition"
            onClick={() => setMenuOpen(true)}
          />
        </div>
      </header>

      {/* Overlay Menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Side Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-slate-900 z-50 transform transition-transform duration-300 flex flex-col 
          ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >

        <div className="flex justify-end p-4">
          <X
            className="cursor-pointer hover:text-indigo-400"
            onClick={() => setMenuOpen(false)}
          />
        </div>

        <nav className="flex flex-col px-6 space-y-3 flex-1">
          {navItems.map(item => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={`py-2 px-3 rounded-lg transition
                ${location.pathname === item.path
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-slate-800 text-slate-300'
                }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-6">
          <button
            onClick={handleSignOut}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Sign Out
          </button>
        </div>

      </div>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto p-6 space-y-6">

          {daysOfWeek.map(day => (
          <div
            key={day}
            className="bg-slate-700 p-4 rounded-lg flex flex-wrap items-center justify-center gap-4"
          >

            {/* Day Checkbox */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={availability[day]?.enabled || false}
                onChange={() => handleToggleDay(day)}
              />
              <span className="text-lg font-medium">{day}</span>
            </label>

            {/* Start Time */}
            <input
              type="time"
              value={availability[day]?.start_time || ''}
              onChange={(e) =>
                handleChange(day, 'start_time', e.target.value)
              }
              disabled={!availability[day]?.enabled}
              className={`bg-slate-800 border border-slate-600 p-2 rounded text-white w-36
                ${!availability[day]?.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />

            <span>to</span>

            {/* End Time */}
            <input
              type="time"
              value={availability[day]?.end_time || ''}
              onChange={(e) =>
                handleChange(day, 'end_time', e.target.value)
              }
              disabled={!availability[day]?.enabled}
              className={`bg-slate-800 border border-slate-600 p-2 rounded text-white w-36
                ${!availability[day]?.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />

            {/* All Day */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={availability[day]?.allDay || false}
                onChange={() => handleAllDayToggle(day)}
                disabled={!availability[day]?.enabled}
              />
              <span>All Day</span>
            </label>

            {/* Preference */}
            <select
              value={availability[day]?.preference_level || 'High'}
              onChange={(e) =>
                handleChange(day, 'preference_level', e.target.value)
              }
              className="bg-slate-800 border border-slate-600 p-2 rounded text-white"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

          </div>
        ))}

          <button
            onClick={handleSave}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            Save Availability
          </button>

        </div>
      </main>
        
      {/* Footer */}
      <footer className="w-full bg-slate-900 p-4 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Company Name. All rights reserved.
      </footer>

    </div>
  );
};

export default Availability;
