import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';

const Schedule = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setERror] = useState('');

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) return;
        
        const today = new Date().toISOString().split('T')[0];

        const {data,error} = await supabase
          .from('schedules')
          .select('*')
          .eq('user_id', user.id)
          .gte('shift_date', today)
          .order('shift_date', {ascending: true});

        if (error) throw error;
        setShifts(data || []);
      } catch (err) {
        setERror(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours),parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isToday = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-bold text-white">My Schedule</h2>
        <p className="text-slate-400 text-sm mt-1">Your upcoming shifts</p>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {shifts.length === 0 && !error ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400">No upcoming shifts scheduled.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map(shift => (
            <div
              key={shift.id}
              className={`bg-slate-800 rounded-xl p-5 border transition
                ${isToday(shift.shift_date)
                  ? 'border-indigo-500 shadow-lg shadow-indigo-900/20'
                  : 'border-slate-700'
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isToday(shift.shift_date) && (
                      <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">
                        Today
                      </span>
                    )}
                    <p className="text-white font-semibold">
                      {formatDate(shift.shift_date)}
                    </p>
                  </div>
                  <p className="text-indigo-300 text-sm">
                    {formatTime(shift.start_time)} — {formatTime(shift.end_time)}
                  </p>
                  {shift.notes && (
                    <p className="text-slate-400 text-sm mt-2">{shift.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Schedule;
