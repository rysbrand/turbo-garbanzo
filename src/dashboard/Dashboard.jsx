import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client.js';
import { Link, useNavigate } from 'react-router-dom';
import { logAction } from '../lib/auditLog.js';

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

    const handleClockToggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const currentTime = now.toISOString();

    if (!isClockedIn) {
      const { data: entry, error } = await supabase
        .from('time_entries')
        .insert([{ user_id: user.id, clock_in: currentTime }])
        .select()
        .maybeSingle();

      if (error) {
        console.error(error);
        return;
      }

      await logAction({
        actorId: user.id,
        targetUserId: user.id,
        action: 'clock_in',
        entityType: 'time_entries',
        entityId: entry.id,
        newValue: { clock_in: currentTime },
      });

    } else {
      const { data: entry, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !entry) {
        console.error('No active clock-in found', error);
        return;
      }

      await supabase
        .from('time_entries')
        .update({ clock_out: currentTime })
        .eq('id', entry.id);

      await logAction({
        actorId: user.id,
        targetUserId: user.id,
        action: 'clock_out',
        entityType: 'time_entries',
        entityId: entry.id,
        oldValue: { clock_in: entry.clock_in, clock_out: null },
        newValue: { clock_in: entry.clock_in, clock_out: currentTime },
      });
    }

    const timeString = now.toLocaleTimeString();
    setClockMessage(`You ${isClockedIn ? 'clocked out' : 'clocked in'} at ${timeString}`);
    setIsClockedIn(!isClockedIn);
    setShowClockMessage(true);
    setTimeout(() => setShowClockMessage(false), 3000);
  };

  useEffect(() => {
    async function loadDashboard() {
      const session = await requireAuth();
      if (!session) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      const userName = profile?.first_name || user.email || 'User';
      setName(userName);

      const { data: activeEntry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeEntry) setIsClockedIn(true);

      const today = new Date();
      const day = today.getDate();
      const year = today.getFullYear();
      const month = today.getMonth();
      const formattedTodayISO = today.toISOString().split('T')[0];
      const formattedDate = today.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });

      const { data: scheduleData, error: scheduleError } = await supabase
        .from ('schedules')
        .select('*')
        .eq('user_id', user.id)
        .gte('shift_date', formattedTodayISO)
        .order('shift_date', {ascending: true });

      if (scheduleError) {
        console.error('error fetching schedule:', scheduleError);
      }

      const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const d = new Date();
        d.setHours(parseInt(hours), parseInt(minutes));
        return d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        hour12: true });
      };

      const shifts = (scheduleData || []).map(shift => ({
        date: shift.shift_date,
        start: formatTime(shift.start_time),
        end: formatTime(shift.end_time),
      }));

      setSchedule(shifts);

      const todayShift = shifts.find(shift => shift.date === formattedTodayISO);

      const welcome = todayShift
        ? `Welcome ${userName}, you work today ${formattedDate} from ${todayShift.start} to ${todayShift.end}`
        : `Welcome ${userName}, you do not work today (${formattedDate})`;

      setWelcomeMessage(welcome);

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
    <div className="space-y-8">

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
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-slate-400">{d}</div>
          ))}
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
          <div className="mt-2 p-2 bg-indigo-600 text-white rounded shadow-md">
            {clockMessage}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;