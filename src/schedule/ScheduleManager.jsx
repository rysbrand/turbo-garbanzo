import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client.js';
import { logAction } from '../lib/auditLog.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ScheduleManager = () => {
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [coverage, setCoverage] = useState({});
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCoverageSettings, setShowCoverageSettings] = useState(false);
  const [coverageReqs, setCoverageReqs] = useState([]);
  const [editingShift, setEditingShift] = useState(null);
  const [error, setError] = useState('');

  // Form state
  const [formUserId, setFormUserId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  function getWeekStart(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  function getWeekDates(start) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  function toISO(date) {
    return date.toISOString().split('T')[0];
  }

  function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(hours), parseInt(minutes));
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  function formatDisplayDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const weekDates = getWeekDates(weekStart);
  const weekStart_ISO = toISO(weekDates[0]);
  const weekEnd_ISO = toISO(weekDates[6]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: empData, error: empError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, user_role')
        .order('last_name');
      if (empError) throw empError;
      setEmployees(empData || []);

      const { data: shiftData, error: shiftError } = await supabase
        .from('schedules')
        .select('*')
        .gte('shift_date', weekStart_ISO)
        .lte('shift_date', weekEnd_ISO);
      if (shiftError) throw shiftError;
      setShifts(shiftData || []);

      const { data: covData, error: covError } = await supabase
        .from('coverage_requirements')
        .select('*')
        .order('day_of_week');
      if (covError) throw covError;
      setCoverageReqs(covData || []);

      const covMap = {};
      weekDates.forEach((date, idx) => {
        const iso = toISO(date);
        const shiftsOnDay = (shiftData || []).filter(s => s.shift_date === iso);
        const req = (covData || []).find(c => c.day_of_week === idx);
        const min = req?.min_employees || 1;
        const count = shiftsOnDay.length;
        covMap[iso] = {
          count,
          min,
          status: count >= min ? 'good' : count >= min / 2 ? 'low' : 'critical'
        };
      });
      setCoverage(covMap);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [weekStart_ISO]);

  const handlePrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const handleNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const openAddForm = (date = '', userId = '') => {
    setEditingShift(null);
    setFormUserId(userId);
    setFormDate(date);
    setFormStart('');
    setFormEnd('');
    setFormNotes('');
    setShowForm(true);
  };

  const openEditForm = (shift) => {
    setEditingShift(shift);
    setFormUserId(shift.user_id);
    setFormDate(shift.shift_date);
    setFormStart(shift.start_time?.slice(0, 5) || '');
    setFormEnd(shift.end_time?.slice(0, 5) || '');
    setFormNotes(shift.notes || '');
    setShowForm(true);
  };

  const handleFormSave = async () => {
    if (!formUserId || !formDate || !formStart || !formEnd) {
      alert('Please fill in all required fields.');
      return;
    }
    setFormSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (editingShift) {
        const { error } = await supabase
          .from('schedules')
          .update({
            user_id: formUserId,
            shift_date: formDate,
            start_time: formStart,
            end_time: formEnd,
            notes: formNotes,
          })
          .eq('id', editingShift.id);
        if (error) throw error;

        await logAction({
          actorId: user.id,
          targetUserId: formUserId,
          action: 'shift_updated',
          entityType: 'schedules',
          entityId: editingShift.id,
          oldValue: {
            shift_date: editingShift.shift_date,
            start_time: editingShift.start_time,
            end_time: editingShift.end_time,
            notes: editingShift.notes,
          },
          newValue: {
            shift_date: formDate,
            start_time: formStart,
            end_time: formEnd,
            notes: formNotes,
          },
        });

      } else {
        const { data: newShift, error } = await supabase
          .from('schedules')
          .insert({
            user_id: formUserId,
            shift_date: formDate,
            start_time: formStart,
            end_time: formEnd,
            notes: formNotes,
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;

        await logAction({
          actorId: user.id,
          targetUserId: formUserId,
          action: 'shift_created',
          entityType: 'schedules',
          entityId: newShift.id,
          newValue: {
            shift_date: formDate,
            start_time: formStart,
            end_time: formEnd,
            notes: formNotes,
          },
        });
      }

      setShowForm(false);
      fetchData();
    } catch (err) {
      alert('Error saving shift: ' + err.message);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!confirm('Delete this shift?')) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const shiftToDelete = shifts.find(s => s.id === shiftId);

      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', shiftId);
      if (error) throw error;

      await logAction({
        actorId: user.id,
        targetUserId: shiftToDelete?.user_id,
        action: 'shift_deleted',
        entityType: 'schedules',
        entityId: shiftId,
        oldValue: {
          shift_date: shiftToDelete?.shift_date,
          start_time: shiftToDelete?.start_time,
          end_time: shiftToDelete?.end_time,
          notes: shiftToDelete?.notes,
        },
      });

      setShowForm(false);
      fetchData();
    } catch (err) {
      alert('Error deleting shift: ' + err.message);
    }
  };

  const handleCoverageSave = async () => {
    try {
      for (const req of coverageReqs) {
        await supabase
          .from('coverage_requirements')
          .update({ min_employees: req.min_employees, updated_at: new Date().toISOString() })
          .eq('id', req.id);
      }
      setShowCoverageSettings(false);
      fetchData();
    } catch (err) {
      alert('Error saving coverage requirements: ' + err.message);
    }
  };

  const coverageColor = (status) => {
    if (status === 'good') return 'bg-green-600/20 text-green-400 border-green-600/30';
    if (status === 'low') return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
    return 'bg-red-600/20 text-red-400 border-red-600/30';
  };

  const coverageLabel = (status) => {
    if (status === 'good') return 'Good';
    if (status === 'low') return 'Low';
    return 'Critical';
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

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Schedule Manager</h2>
          <p className="text-slate-400 text-sm mt-1">
            {formatDisplayDate(weekDates[0])} — {formatDisplayDate(weekDates[6])}
          </p>
        </div>
        {/* CHANGED: stack buttons vertically on mobile */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCoverageSettings(true)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition w-full sm:w-auto"
          >
            Coverage Settings
          </button>
          <button
            onClick={() => openAddForm()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition w-full sm:w-auto"
          >
            + Add Shift
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Week Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePrevWeek}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
        >
          ← Prev
        </button>
        <button
          onClick={() => setWeekStart(getWeekStart(new Date()))}
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
      </div>

      {/* Coverage Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-slate-400">Good coverage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="text-slate-400">Low coverage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-slate-400">Critical — understaffed</span>
        </div>
      </div>

      {/* Weekly Grid — scrolls horizontally within its box, never the whole page */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="text-left text-slate-400 text-sm font-medium p-3 w-36">Employee</th>
              {weekDates.map((date, idx) => {
                const iso = toISO(date);
                const cov = coverage[iso];
                return (
                  <th key={idx} className="text-center p-2 min-w-[100px]">
                    <div className="text-slate-300 text-sm font-medium">{DAYS[idx]}</div>
                    <div className="text-slate-500 text-xs">{formatDisplayDate(date)}</div>
                    {cov && (
                      <div className={`mt-1 text-xs px-2 py-0.5 rounded-full border inline-block ${coverageColor(cov.status)}`}>
                        {cov.count}/{cov.min} · {coverageLabel(cov.status)}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-t border-slate-700">
                <td className="p-3 text-sm text-slate-300 font-medium">
                  {emp.first_name} {emp.last_name}
                </td>
                {weekDates.map((date, idx) => {
                  const iso = toISO(date);
                  const shift = shifts.find(s => s.shift_date === iso && s.user_id === emp.id);
                  return (
                    <td key={idx} className="p-1.5 text-center align-top">
                      {shift ? (
                        <button
                          onClick={() => openEditForm(shift)}
                          className="w-full bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-lg p-2 text-xs text-indigo-300 transition text-left"
                        >
                          <div className="font-medium">{formatTime(shift.start_time)}</div>
                          <div className="text-indigo-400">→ {formatTime(shift.end_time)}</div>
                          {shift.notes && (
                            <div className="text-slate-400 mt-1 truncate">{shift.notes}</div>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => openAddForm(iso, emp.id)}
                          className="w-full h-16 rounded-lg border border-dashed border-slate-600 hover:border-indigo-500 hover:bg-slate-700/50 transition text-slate-600 hover:text-indigo-400 text-lg"
                        >
                          +
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Shift Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          {/* CHANGED: added max-h and overflow-y-auto so modal doesn't get cut off on short screens */}
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white">
              {editingShift ? 'Edit Shift' : 'Add Shift'}
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Employee</label>
              <select
                value={formUserId}
                onChange={e => setFormUserId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formStart}
                  onChange={e => setFormStart(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">End Time</label>
                <input
                  type="time"
                  value={formEnd}
                  onChange={e => setFormEnd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="Any notes..."
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleFormSave}
                disabled={formSaving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                {formSaving ? 'Saving...' : 'Save Shift'}
              </button>
              {editingShift && (
                <button
                  onClick={() => handleDeleteShift(editingShift.id)}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coverage Settings Modal */}
      {showCoverageSettings && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white">Coverage Requirements</h3>
            <p className="text-slate-400 text-sm">Set the minimum number of employees needed per day.</p>

            {coverageReqs.map((req, idx) => (
              <div key={req.id} className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">{DAYS[req.day_of_week]}</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={req.min_employees}
                  onChange={e => {
                    const updated = [...coverageReqs];
                    updated[idx] = { ...updated[idx], min_employees: parseInt(e.target.value) || 1 };
                    setCoverageReqs(updated);
                  }}
                  className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCoverageSave}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                Save
              </button>
              <button
                onClick={() => setShowCoverageSettings(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ScheduleManager;