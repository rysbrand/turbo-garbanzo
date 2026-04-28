import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client.js';

const Timesheet = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(getWeekStart(new Date()));

  function getWeekStart(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  function getWeekEnd(start) {
    const d = new Date(start);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  function toISO(date) {
    return date.toISOString().split('T')[0];
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatTime(isoStr) {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  function calcHours(clockIn, clockOut) {
    if (!clockIn || !clockOut) return null;
    const diff = new Date(clockOut) - new Date(clockIn);
    return diff / (1000 * 60 * 60);
  }

  function formatHours(hours) {
    if (hours === null) return '—';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  const weekStart = selectedWeek;
  const weekEnd = getWeekEnd(selectedWeek);

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('clock_in', weekStart.toISOString())
          .lte('clock_in', weekEnd.toISOString())
          .order('clock_in', { ascending: false });

        if (error) throw error;
        setEntries(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [selectedWeek]);

  const handlePrevWeek = () => {
    const d = new Date(selectedWeek);
    d.setDate(d.getDate() - 7);
    setSelectedWeek(d);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedWeek);
    d.setDate(d.getDate() + 7);
    setSelectedWeek(d);
  };

  // Calculate total hours for the week
  const totalHours = entries.reduce((sum, entry) => {
    const h = calcHours(entry.clock_in, entry.clock_out);
    return h ? sum + h : sum;
  }, 0);

  // Flag overtime (over 40 hours)
  const isOvertime = totalHours > 40;

  const currentlyActive = entries.find(e => !e.clock_out);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Timesheet</h2>
        <p className="text-slate-400 text-sm mt-1">Your clock in/out history</p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handlePrevWeek}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
        >
          ← Prev
        </button>
        <button
          onClick={() => setSelectedWeek(getWeekStart(new Date()))}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
        >
          This Week
        </button>
        <button
          onClick={handleNextWeek}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
        >
          Next →
        </button>
        <span className="text-slate-400 text-sm">
          {toISO(weekStart)} — {toISO(weekEnd)}
        </span>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Weekly Summary */}
      <div className={`rounded-xl p-5 border ${isOvertime
        ? 'bg-yellow-600/10 border-yellow-500/30'
        : 'bg-slate-800 border-slate-700'}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Total Hours This Week</p>
            <p className={`text-3xl font-bold mt-1 ${isOvertime ? 'text-yellow-400' : 'text-white'}`}>
              {formatHours(totalHours)}
            </p>
          </div>
          {isOvertime && (
            <span className="text-xs bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 px-3 py-1 rounded-full">
              Overtime
            </span>
          )}
          {currentlyActive && (
            <span className="text-xs bg-green-600/20 text-green-400 border border-green-600/30 px-3 py-1 rounded-full">
              Currently Clocked In
            </span>
          )}
        </div>
      </div>

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400">No time entries for this week.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const hours = calcHours(entry.clock_in, entry.clock_out);
            const isActive = !entry.clock_out;

            return (
              <div
                key={entry.id}
                className={`bg-slate-800 rounded-xl p-5 border ${isActive
                  ? 'border-green-500/40'
                  : 'border-slate-700'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-white font-medium">
                      {formatDate(entry.clock_in)}
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-400">
                        In: <span className="text-white">{formatTime(entry.clock_in)}</span>
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">
                        Out: <span className="text-white">{formatTime(entry.clock_out)}</span>
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-slate-400 text-sm">{entry.notes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {isActive ? (
                      <span className="text-xs bg-green-600/20 text-green-400 border border-green-600/30 px-2 py-1 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {formatHours(hours)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Timesheet;
