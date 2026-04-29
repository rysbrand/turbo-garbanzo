import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client.js';
import { logAction } from '../lib/auditLog.js';
import { createNotification } from '../lib/notify.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TIME_OFF_TYPES = ['PTO', 'Sick Leave', 'Unpaid Leave'];

const statusColor = (status) => {
  if (status === 'Approved') return 'bg-green-600/20 text-green-400 border-green-600/30';
  if (status === 'Denied') return 'bg-red-600/20 text-red-400 border-red-600/30';
  return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
};

const Timeoff = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formType, setFormType] = useState('PTO');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReason, setFormReason] = useState('');

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('time_off_request')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async () => {
    if (!formStartDate || !formEndDate || !formType) {
      alert('Please fill in all required fields.');
      return;
    }

    if (formEndDate < formStartDate) {
      alert('End date cannot be before start date.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: newRequest, error } = await supabase
        .from('time_off_request')
        .insert({
          user_id: user.id,
          start_date: formStartDate,
          end_date: formEndDate,
          type: formType,
          reason: formReason,
          status: 'Pending',
        })
        .select()
        .single();

      if (error) throw error;

      await logAction({
        actorId: user.id,
        targetUserId: user.id,
        action: 'time_off_requested',
        entityType: 'time_off_request',
        entityId: newRequest.id,
        newValue: {
          type: formType,
          start_date: formStartDate,
          end_date: formEndDate,
          reason: formReason,
        },
      });

      // Notify all managers about the new request
      const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .in('user_role', [2, 3]);

      if (managers) {
        for (const manager of managers) {
          await createNotification({
            userId: manager.id,
            title: 'New Time Off Request',
            message: `A new ${formType} request needs your review.`,
            type: 'time_off_request',
            entityType: 'time_off_request',
            entityId: newRequest.id,
          });
        }
      }

      setShowForm(false);
      setFormType('PTO');
      setFormStartDate('');
      setFormEndDate('');
      setFormReason('');
      fetchRequests();
    } catch (err) {
      alert('Error submitting request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (requestId) => {
    if (!confirm('Cancel this time off request?')) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('time_off_request')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      await logAction({
        actorId: user.id,
        targetUserId: user.id,
        action: 'time_off_cancelled',
        entityType: 'time_off_request',
        entityId: requestId,
      });

      fetchRequests();
    } catch (err) {
      alert('Error cancelling request: ' + err.message);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
          <h2 className="text-2xl font-bold text-white">Time Off</h2>
          <p className="text-slate-400 text-sm mt-1">Request and track your time off</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition"
        >
          + New Request
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400">No time off requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(request => (
            <div
              key={request.id}
              className="bg-slate-800 rounded-xl p-5 border border-slate-700"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold">{request.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    {formatDate(request.start_date)} — {formatDate(request.end_date)}
                  </p>
                  {request.reason && (
                    <p className="text-slate-400 text-sm">"{request.reason}"</p>
                  )}
                  {request.manager_comment && (
                    <p className="text-sm text-indigo-300 mt-2">
                      Manager note: "{request.manager_comment}"
                    </p>
                  )}
                </div>

                {request.status === 'Pending' && (
                  <button
                    onClick={() => handleCancel(request.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold text-white">New Time Off Request</h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Type</label>
              <select
                value={formType}
                onChange={e => setFormType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TIME_OFF_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                <DatePicker
                  selected={formStartDate ? new Date(formStartDate + 'T00:00:00') : null}
                  onChange={(date) => setFormStartDate(date ? date.toISOString().split('T')[0] : '')}
                  minDate={new Date()}
                  placeholderText="Select start date"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  calendarClassName="!bg-slate-800 !border-slate-700 !text-white"
                  dayClassName={() => "!text-slate-300 hover:!bg-indigo-600"}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">End Date</label>
                <DatePicker
                  selected={formEndDate ? new Date(formEndDate + 'T00:00:00') : null}
                  onChange={(date) => setFormEndDate(date ? date.toISOString().split('T')[0] : '')}
                  minDate={formStartDate ? new Date(formStartDate + 'T00:00:00') : new Date()}
                  placeholderText="Select end date"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  calendarClassName="!bg-slate-800 !border-slate-700 !text-white"
                  dayClassName={() => "!text-slate-300 hover:!bg-indigo-600"}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Reason (optional)</label>
              <textarea
                value={formReason}
                onChange={e => setFormReason(e.target.value)}
                placeholder="Briefly describe the reason..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                onClick={() => setShowForm(false)}
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

export default Timeoff;
