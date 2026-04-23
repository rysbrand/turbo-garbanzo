import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client.js';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const defaultDayState = {
  enabled: false,
  start_time: '',
  end_time: '',
  preference_level: 'Available',
  allDay: false
};

const preferenceOptions = [
  { value: 'Available',   label: 'Can Work',           color: 'bg-green-600 border-transparent text-white',      dot: 'bg-green-400' },
  { value: 'Preferred',   label: 'Prefer Not to Work', color: 'bg-yellow-500 border-transparent text-slate-900', dot: 'bg-yellow-400' },
  { value: 'Unavailable', label: "Can't Work",         color: 'bg-red-600 border-transparent text-white',        dot: 'bg-red-400' },
];

const MIN_TIME = '07:00';
const MAX_TIME = '20:00';

const validateTime = (time) => {
  if (!time) return false;
  return time >= MIN_TIME && time <= MAX_TIME;
};

const Availability = () => {
  const [user, setUser] = useState(null);
  const [availability, setAvailability] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [timeErrors, setTimeErrors] = useState({});

  //changing this to fetch user and their availability from supabase
  useEffect(() => {
    const fetchUserAndAvailability = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        const currentUser = data.user;
        setUser(currentUser);

        const initial = Object.fromEntries(
          daysOfWeek.map(day => [day, { ...defaultDayState}])
        );

        const {data: rows, error: fetchError } = await supabase
          .from('availability')
          .select('*')
          .eq('user_id', currentUser.id);

        if (fetchError) throw fetchError;

        //set days with saved data where exists
        if (rows && rows.length >0 ) {
          rows.forEach(row => {
            initial[row.day_of_week] = {
              enabled: true,
              start_time: row.start_time || '',
              end_time: row.end_time || '',
              preference_level: row.preference_level || 'Available',
              allDay: row.start_time === MIN_TIME && row.end_time === MAX_TIME
            };
          });
        }

        setAvailability(initial);

      } catch (err) {
        console.error('Failed to load availability:', err.message);
      }
    };
    fetchUserAndAvailability();

  }, []);

  const handleToggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
    // Clear errors when disabling
    setTimeErrors(prev => ({ ...prev, [day]: null }));
  };

  const handleChange = (day, field, value) => {
  setAvailability(prev => {
    const updatedDay = { ...prev[day], [field]: value };

  //prevents user from setting hours if worker unavailable or prefers not to work
  if (field === 'preference_level') {
    if (value === 'Available') {
      updatedDay.allDay = true;
      updatedDay.start_time = MIN_TIME;
      updatedDay.end_time = MAX_TIME;
    } else if (value === 'Unavailable') {
      updatedDay.allDay = false;
      updatedDay.start_time = '';
      updatedDay.end_time = '';
    } else if (value === 'Preferred') {
      updatedDay.allDay = false;
      updatedDay.start_time = '';
      updatedDay.end_time = '';
    }
  }
    

    return { ...prev, [day]: updatedDay };
  });

  // Validate on time change
  if (field === 'start_time' || field === 'end_time') {
    const updated = {
      ...availability[day],
      [field]: value
    };
    const errors = {};
    if (updated.start_time && !validateTime(updated.start_time)) {
      errors.start = 'Please enter a time between 7am and 8pm Central Time';
    }
    if (updated.end_time && !validateTime(updated.end_time)) {
      errors.end = 'Please enter a time between 7am and 8pm Central Time';
    }
    if (updated.start_time && updated.end_time && updated.start_time >= updated.end_time) {
      errors.range = 'End time must be after start time';
    }
    setTimeErrors(prev => ({ ...prev, [day]: errors }));
  }
};

  const handleAllDayToggle = (day) => {
    setAvailability(prev => {
      const isAllDay = !prev[day].allDay;
      return {
        ...prev,
        [day]: {
          ...prev[day],
          allDay: isAllDay,
          start_time: isAllDay ? '07:00' : '',
          end_time: isAllDay ? '20:00' : ''
        }
      };
    });
    setTimeErrors(prev => ({ ...prev, [day]: null }));
  };

  const handleSave = async () => {
    if (!user) return;

    // Check for any active errors before saving
    const hasErrors = Object.entries(availability).some(([day, val]) => {
      if (!val.enabled || val.allDay) return false;
      const errs = timeErrors[day];
      return errs && (errs.start || errs.end || errs.range);
    });

    if (hasErrors) {
      alert('Please fix the time errors before saving.');
      return;
    }

    setSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from('availability')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

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
        const { error } = await supabase.from('availability').insert(rows);
        if (error) throw error;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert('Error saving availability: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Object.values(availability).filter(d => d.enabled).length;

  return (
    <div className="space-y-3 pb-6">

      {/* Page Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white">Availability</h2>
        <p className="text-slate-400 text-sm mt-1">
          {enabledCount === 0
            ? 'No days selected — toggle a day to set your hours.'
            : `${enabledCount} day${enabledCount > 1 ? 's' : ''} selected`}
        </p>
      </div>

      {/* Legend */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-2">
        <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">Availability Key</p>
        <div className="flex flex-wrap gap-3">
          {preferenceOptions.map(opt => (
            <div key={opt.value} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`} />
              <span className="text-sm text-slate-300">
                <span className="font-medium">{opt.label}</span>
                {opt.value === 'Available' && <span className="text-slate-500"> — free all day</span>}
                {opt.value === 'Limited' && <span className="text-slate-500"> — specific hours only</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Cards */}
      {daysOfWeek.map(day => {
        const dayData = availability[day] || defaultDayState;
        const isEnabled = dayData.enabled;
        const errors = timeErrors[day] || {};
        const hasError = errors.start || errors.end || errors.range;

        return (
          <div
            key={day}
            className={`rounded-xl border transition-all duration-200
              ${isEnabled
                ? hasError
                  ? 'bg-slate-700 border-red-500/50 shadow-lg shadow-red-900/10'
                  : 'bg-slate-700 border-indigo-500/50 shadow-lg shadow-indigo-900/20'
                : 'bg-slate-800 border-slate-700'
              }`}
          >
            {/* Day Toggle Row */}
            <button
              onClick={() => handleToggleDay(day)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5
                  ${isEnabled ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                    ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className={`text-base font-semibold ${isEnabled ? 'text-white' : 'text-slate-400'}`}>
                  {day}
                </span>
              </div>

              {isEnabled && dayData.allDay && (
                <span className="text-xs text-indigo-300 font-medium">All Day</span>
              )}
              {isEnabled && !dayData.allDay && dayData.start_time && dayData.end_time && !hasError && (
                <span className="text-xs text-slate-400">
                  {dayData.start_time} – {dayData.end_time}
                </span>
              )}
              {isEnabled && hasError && (
                <span className="text-xs text-red-400">Fix time errors</span>
              )}
            </button>

            {/* Expanded Controls */}
            {isEnabled && (
              <div className="px-4 pb-4 space-y-4 border-t border-slate-600/50 pt-3">

                {/* Time Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-start gap-3">
                  {/* From */}
                  <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 w-10 shrink-0">From</label>
                      <input
                        type="time"
                        value={dayData.start_time || ''}
                        min={MIN_TIME}
                        max={MAX_TIME}
                        onChange={(e) => handleChange(day, 'start_time', e.target.value)}
                        disabled={dayData.allDay || dayData.preferency_level === 'Unavailble'}
                        className={`flex-1 sm:flex-none bg-slate-900 border px-3 py-2 rounded-lg text-white text-sm w-full sm:w-36 focus:outline-none transition
                          ${dayData.allDay || dayData.preference_level === 'Unavailable'
                            ? 'opacity-40 cursor-not-allowed border-slate-600' 
                            : errors.start ? 'border-red-500 focus:border-red-400' :
                             'border-slate-600 focus:border-indigo-500'}`}
                      />
                    </div>
                    {errors.start && (
                      <p className="text-xs text-red-400 ml-12">{errors.start}</p>
                    )}
                  </div>

                  {/* To */}
                  <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 w-10 shrink-0">To</label>
                      <input
                        type="time"
                        value={dayData.end_time || ''}
                        min={MIN_TIME}
                        max={MAX_TIME}
                        onChange={(e) => handleChange(day, 'end_time', e.target.value)}
                        disabled={dayData.allDay}
                        className={`flex-1 sm:flex-none bg-slate-900 border px-3 py-2 rounded-lg text-white text-sm w-full sm:w-36 focus:outline-none transition
                          ${dayData.allDay ? 'opacity-40 cursor-not-allowed border-slate-600' : errors.end ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-indigo-500'}`}
                      />
                    </div>
                    {errors.end && (
                      <p className="text-xs text-red-400 ml-12">{errors.end}</p>
                    )}
                  </div>

                  {/* All Day */}
                  <button
                    onClick={() => handleAllDayToggle(day)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition border
                      ${dayData.allDay
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                  >
                    {dayData.allDay ? '✓ All Day' : 'All Day'}
                  </button>
                </div>

                {/* Range error */}
                {errors.range && (
                  <p className="text-xs text-red-400">{errors.range}</p>
                )}

                {/* Preference Level */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-slate-400">Status</span>
                  <div className="flex flex-wrap gap-2">
                    {preferenceOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleChange(day, 'preference_level', opt.value)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition border
                          ${dayData.preference_level === opt.value
                            ? opt.color
                            : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-500'
                          }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        );
      })}

      {/* Save Button */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition
            ${saved
              ? 'bg-green-600'
              : saving
                ? 'bg-indigo-800 opacity-60 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
            }`}
        >
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Availability'}
        </button>
      </div>

    </div>
  );
};

export default Availability;