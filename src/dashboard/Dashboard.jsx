import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client.js';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [name, setName] = useState('User');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [calendarHeader, setCalendarHeader] = useState('');
  const [calendarDays, setCalendarDays] = useState([]);
  const [todayDate, setTodayDate] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockMessage, setClockMessage] = useState('');
  const [showClockMessage, setShowClockMessage] = useState(false);
  const navigate = useNavigate();

  async function requireAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) console.error('getSession error:', error);
    if (!session) {
      navigate('/login');
      return null;
    }
    return session;
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { console.error('Sign out error:', error);
    } else {
    localStorage.removeItem('user'); // Clear user info from localStorage
      navigate('/login');
    }
  };

  const handleClockToggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const todayISO = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split (' ')[0]; // HH:MM:SS format

    if (!isClockedIn) {
      const {error} = await supabase 
      .from('time_records') 
      .insert([
        { user_id: user.id, date: todayISO, clock_in: currentTime }
      ]);

      if (error) {
        console.error(error);
        return;
      }
    } else {
      const {data: existing} = await supabase 
      .from('time_records') 
      .select('*') 
      .eq('user_id', user.id) 
      .eq('date', todayISO) 
      .single();
      
      if (existing && existing.clock_in && !existing.clock_out) {
        console.log('Already clocked in.');
        return;
      }

      const clockInTime = new Date(`${todayISO}T${data.clock_in}`);
      const clockOutTime = now;

      const hoursWorked = (clockOutTime - clockInTime) / (1000 * 60 * 60);

      await supabase 
      .from('time_records') 
      .update({ 
        clock_out: currentTime, 
        hours_worked: hoursWorked 
      }) 
      .eq('id', data.id);
    }

    const timeString = now.toLocaleTimeString();
    setClockMessage (`You ${isClockedIn ? 'clocked out' : 'clocked in'} at ${timeString}`);
    setIsClockedIn(!isClockedIn);
    setShowClockMessage(true);
    setTimeout(() => setShowClockMessage(false), 3000);
  };

  useEffect(() => {
    async function requireAuth() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error('getSession error:', error);
      if (!session) {
        navigate('/login');
        return null;
      }
      return session;
    }

    async function loadDashboard() {
      const session = await requireAuth();
      if (!session) return;
      // Get user name from localStorage (set this during login)
      let storedUser;
      try {
        storedUser = JSON.parse(localStorage.getItem('user'));
      } catch {
        storedUser = null;
      }
      const userName = storedUser?.firstName || session.user.email || 'User';
      setName(userName);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const todayISO = new Date().toISOString().split('T')[0];
      
      const { data: timeRecord, error } = await supabase
        .from('time_records')
        .select ('*')
        .eq('user_id', user.id)
        .eq('date', todayISO)
        .single();

      if (timeRecord && timeRecord.clock_in && !timeRecord.clock_out) {
        setIsClockedIn(true);
      }

      // Sample schedule data (replace with Supabase data later)
      const scheduleDate = [
        { date: '2026-02-17', start: '9:00 AM', end: '5:00 PM' },
        { date: '2026-02-19', start: '10:00 AM', end: '6:00 PM' },
        { date: '2026-02-25', start: '8:00 AM', end: '4:00 PM' },
        { date: '2026-03-03', start: '11:00 AM', end: '7:00 PM' }
      ];

      setSchedule(scheduleDate);

      const today = new Date();
      const day = today.getDate();
      const year = today.getFullYear();
      const month = today.getMonth();
      const formattedTodayISO = today.toISOString().split('T')[0];

      const todayShift = scheduleDate.find(shift => shift.date === formattedTodayISO);
      const formattedDate = today.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });

      let welcome;
      if (todayShift) {
        welcome = `Welcome ${userName}, you work today ${formattedDate} from ${todayShift.start} to ${todayShift.end}`;
      } else {
        welcome = `Welcome ${userName}, you do not work today (${formattedDate})`;
      }

      setWelcomeMessage(welcome);

      // Calendar logic
      const monthName = today.toLocaleString('default', { month: 'long' });
      setCalendarHeader(`${monthName} ${year}`);
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysArray = [];

      for (let i = 0; i < firstDay; i++) daysArray.push(null);
      for (let d = 1; d <= daysInMonth; d++) daysArray.push(d);
      setCalendarDays(daysArray);
      setTodayDate(day);
    }
    loadDashboard();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col">
      <header className="bg-slate-900/90 backdrop-blur shadow-lg px-6 py-4 flex items-center justify-between">
        <Link to="/profile" className="flex items-center gap-4">
          <img src="#" alt="Profile" className="h-13 w-13 rounded-full border-2 border-indigo-500 hover:scale-105 transition cursor-pointer" />
        </Link>

        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-4xl font-semibold flex items-center gap-3">
          Company Name
        </h1>

        <button
          onClick={handleSignOut}
          className="ml-4 px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 transition"
        >
          Sign Out</button>
      </header>

      <main className="flex-1 p-6 space-y-8 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Link to="/schedule" className="bg-slate-800 rounded-xl p-6 text-center shadow hover:bg-slate-700 transition">
            <h2 className="font-semibold text-lg">Schedule</h2>
          </Link>

          <Link to="/availability" className="bg-slate-800 rounded-xl p-6 text-center shadow hover:bg-slate-700 transition">
            <h2 className="font-semibold text-lg">Availability</h2>
          </Link>

          <Link to="/pay" className="bg-slate-800 rounded-xl p-6 text-center shadow hover:bg-slate-700 transition">
            <h2 className="font-semibold text-lg">Pay</h2>
          </Link>

          <Link to="/timesheet" className="bg-slate-800 rounded-xl p-6 text-center shadow hover:bg-slate-700 transition">
            <h2 className="font-semibold text-lg">Timesheet</h2>
          </Link>
        </div>

        <div className="bg-slate-800 rounded-xl p-8 text-center shadow">
          <h2 className="text-xl font-medium">{welcomeMessage}</h2>
        </div>

        <div className="bg-slate-800 rounded-xl p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">{calendarHeader}</h2>
          </div>

          <div className="grid grid-cols-7 text-center text-sm mb-2">
            <div className="text-slate-400">Sun</div>
            <div className="text-slate-400">Mon</div>
            <div className="text-slate-400">Tue</div>
            <div className="text-slate-400">Wed</div>
            <div className="text-slate-400">Thu</div>
            <div className="text-slate-400">Fri</div>
            <div className="text-slate-400">Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={idx}></div>;

              const dateObj = new Date(new Date().getFullYear(), new Date().getMonth(), day);
              const isoDate = dateObj.toISOString().split('T')[0];

              const isToday = day === todayDate;
              const isWorkDay = schedule.some(shift => shift.date === isoDate);

              return (
              <div
                key={idx}
                className={`h-8 flex items-center justify-center 
                  ${isToday ? 'p-2 rounded text-sm bg-indigo-600 font-semibold' : ''}
                  ${isWorkDay ? 'border border-indigo-500' : ''}
                `}
              >
                {day}
              </div>
              );
            })}
          </div>
        </div>

      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={handleClockToggle}
          className={`px-20 py-5 rounded text-white font-bold ${isClockedIn ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} transition`}
        >
          {isClockedIn ? 'Clock Out' : 'Clock In'}
        </button>
        {showClockMessage && (
          <div className="mt-2 p-2 bg-indigo-600 text-white rounded shadow-md animate-fade">{clockMessage}</div>)}
      </div>
      </main>

      <footer className="bg-slate-900/90 backdrop-blur text-center py-4 text-sm text-slate-500">
      &copy; 2026 Company Name. All rights reserved.
    </footer>
    </div>
  );
};

export default Dashboard;
