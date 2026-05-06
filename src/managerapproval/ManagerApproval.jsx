import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client.js';
import { logAction } from '../lib/auditLog.js';
import { createNotification } from '../lib/notify.js';

const statusColor = (status) => {
  if (status === 'Approved') return 'bg-green-600/20 text-green-400 border-green-600/30';
  if (status === 'Denied') return 'bg-red-600/20 text-red-400 border-red-600/30';
  return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
};

const ManagerApproval = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('time_off_request')
        .select('*, profiles(first_name, last_name)')
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

  const handleDecision = async (status) => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('time_off_request')
        .update({
          status,
          manager_comment: comment,
          reviewed_by: user.id,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      await logAction({
        actorId: user.id,
        targetUserId: selectedRequest.user_id,
        action: status === 'Approved' ? 'time_off_approved' : 'time_off_denied',
        entityType: 'time_off_request',
        entityId: selectedRequest.id,
        oldValue: { status: selectedRequest.status },
        newValue: { status, manager_comment: comment },
      });

      await createNotification({
        userId: selectedRequest.user_id,
        title: `Time Off Request ${status}`,
        message: status === 'Approved'
          ? `Your ${selectedRequest.type} request from ${formatDate(selectedRequest.start_date)} to ${formatDate(selectedRequest.end_date)} has been approved.${comment ? ` Note: ${comment}` : ''}`
          : `Your ${selectedRequest.type} request from ${formatDate(selectedRequest.start_date)} to ${formatDate(selectedRequest.end_date)} was denied.${comment ? ` Reason: ${comment}` : ''}`,
        type: 'time_off_decision',
        entityType: 'time_off_request',
        entityId: selectedRequest.id,
      });

      setSelectedRequest(null);
      setComment('');
      fetchRequests();
    } catch (err) {
      alert('Error processing request: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filtered = requests.filter(r => filter === 'All' ? true : r.status === filter);

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
        <h2 className="text-2xl font-bold text-white">Time Off Approvals</h2>
        <p className="text-slate-400 text-sm mt-1">Review and respond to employee time off requests</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['Pending', 'Approved', 'Denied', 'All'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm transition border ${filter === f
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
          >
            {f}
            {f === 'Pending' && (
              <span className="ml-2 bg-yellow-500 text-slate-900 text-xs px-1.5 py-0.5 rounded-full font-medium">
                {requests.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400">No {filter.toLowerCase()} requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(request => (
            <div
              key={request.id}
              className="bg-slate-800 rounded-xl p-5 border border-slate-700"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold">
                      {request.profiles?.first_name} {request.profiles?.last_name}
                    </span>
                    <span className="text-slate-400 text-sm">—</span>
                    <span className="text-slate-300 text-sm">{request.type}</span>
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
                    <p className="text-sm text-indigo-300">
                      Your note: "{request.manager_comment}"
                    </p>
                  )}
                </div>

                {request.status === 'Pending' && (
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setComment('');
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition"
                  >
                    Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold text-white">Review Request</h3>

            <div className="bg-slate-900 rounded-xl p-4 space-y-2">
              <p className="text-white font-medium">
                {selectedRequest.profiles?.first_name} {selectedRequest.profiles?.last_name}
              </p>
              <p className="text-slate-400 text-sm">{selectedRequest.type}</p>
              <p className="text-slate-400 text-sm">
                {formatDate(selectedRequest.start_date)} — {formatDate(selectedRequest.end_date)}
              </p>
              {selectedRequest.reason && (
                <p className="text-slate-400 text-sm">"{selectedRequest.reason}"</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Comment (optional)</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Leave a note for the employee..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleDecision('Approved')}
                disabled={processing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                {processing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleDecision('Denied')}
                disabled={processing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                {processing ? 'Processing...' : 'Deny'}
              </button>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setComment('');
                }}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
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

export default ManagerApproval;