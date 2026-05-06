import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase/client.js';


const StatChip = ({ label, value}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-medium `}
    >
      {label}: {value}
    </span>
  );
};

const ProgressBar = ({ value = 0 }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-2 rounded bg-slate-700/60 overflow-hidden">
      <div
        className="h-full bg-indigo-500"
        style={{ width: `${clamped}%` }}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      />
    </div>
  );
};

const Card = ({ title, children, right }) => (
  <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);
const formatAction = (action) => {
  const labels = {
    clock_in: 'Clocked in',
    clock_out: 'Clocked out',
    shift_created: 'Shift created',
    shift_updated: 'Shift updated',
    shift_deleted: 'Shift deleted',
    time_off_requested: 'Time off requested',
    time_off_approved: 'Time off approved',
    time_off_denied: 'Time off denied',
    time_off_cancelled: 'Time off cancelled',
    role_changed: 'Role changed',
    profile_updated_by_admin: 'Profile updated',
    profile_deleted: 'Profile deleted',
  };
  return labels[action] || action;
};


const AdminDashboard = () => {
  const [adminName, setAdminName] = useState('');
  const [auditLog, setAuditLog] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .maybeSingle();
      setAdminName(profileData?.first_name || user.email);

      const { data: logData } = await supabase
        .from('audit_log')
        .select('*, actor:profiles!audit_log_actor_id_fkey(first_name, last_name), target:profiles!audit_log_target_user_id_fkey(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(10);
      setAuditLog(logData || []);
    };

    fetchData();
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
  const stats = {
    clockedIn: 12,
    late: 3,
    notScheduled: 5,
    coverage: { morning: 100, afternoon: 80, evening: 100 },
    timeOff: { pending: 4, approved: 12, denied: 1 },
    hoursWeek: { total: 486, overtime: 7, completionPct: 65 },
    dateLabel: "March 7, 2026",
    adminEmail: "admin@example.com",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col">
    
      <main className="flex-1 p-6 space-y-8 max-w-7xl w-full mx-auto">
        
        <nav className="grid grid-cols-2 md:grid-cols-4 gap-6" aria-label="Admin quick navigation">
            <Link
              to="/schedule/manage"
              className="bg-slate-800 rounded-xl p-6 text-center shadow hover:bg-slate-700 transition"
            >
              <h2 className="font-semibold text-lg">Schedule Mgmt</h2>
            </Link>

            <Link
              to="/managerapproval"
              className="bg-slate-800 rounded-xl p-6 text-center shadow hover:bg-slate-700 transition"
            >
              <h2 className="font-semibold text-lg">Time‑Off Requests</h2>
            </Link>

            <Link
              to="/timesheet"
              className="bg-slate-800 rounded-xl p-6 text-center shadow hover:bg-slate-700 transition"
            >
              <h2 className="font-semibold text-lg">Timesheets</h2>
            </Link>

            <Link
              to="/profile"
              className="bg-slate-800 rounded-xl p-6 text-center shadow hover:bg-slate-700 transition"
            >
              <h2 className="font-semibold text-lg">My Profile</h2>
            </Link>

            <Link
              to="/admin/users"
              className="bg-slate-800 rounded-xl p-6 text-center shadow hover:bg-slate-700 transition"
            >
              <h2 className="font-semibold text-lg">User Management</h2>
            </Link>
          </nav>

        <div className="bg-slate-800 rounded-xl p-8 text-center shadow">
            <h2 className="text-xl font-medium">
              Welcome, {adminName}! Here's your company overview for {today}.
            </h2>
          </div>

        <section aria-label="Visuals Board" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">

          <Card
            title="Clock‑In Status (Today)"
            right={<Link to="/admin/timesheets" className="text-indigo-300 hover:text-indigo-200 text-sm">View</Link>}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Clocked In</span>
                <span className="font-semibold">{stats.clockedIn}</span>
              </div>
              <ProgressBar value={Math.min(100, (stats.clockedIn / (stats.clockedIn + stats.late + stats.notScheduled || 1)) * 100)} />
              <div className="flex flex-wrap gap-2 pt-2">
                <StatChip label="Late" value={stats.late} />
                <StatChip label="Not Scheduled" value={stats.notScheduled}/>
              </div>
            </div>
          </Card>

          <Card
            title="Schedule Coverage (Today)"
            right={<Link to="/admin/schedule" className="text-indigo-300 hover:text-indigo-200 text-sm">Edit</Link>}
          >
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Morning</span>
                  <span>{stats.coverage.morning}%</span>
                </div>
                <ProgressBar value={stats.coverage.morning} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Afternoon</span>
                  <span>{stats.coverage.afternoon}%</span>
                </div>
                <ProgressBar value={stats.coverage.afternoon} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Evening</span>
                  <span>{stats.coverage.evening}%</span>
                </div>
                <ProgressBar value={stats.coverage.evening} />
              </div>
            </div>
          </Card>

          <Card
            title="Time‑Off Requests"
            right={<Link to="/admin/time-off" className="text-indigo-300 hover:text-indigo-200 text-sm">Review</Link>}
          >
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatChip label="Pending" value={stats.timeOff.pending}/>
                <StatChip label="Approved" value={stats.timeOff.approved}/>
                <StatChip label="Denied" value={stats.timeOff.denied}/>
              </div>
              <p className="text-sm text-slate-300">
                You have <span className="font-semibold">{stats.timeOff.pending}</span> pending request(s) to review.
              </p>
            </div>
          </Card>

          <Card
            title="Hours This Week"
            right={<Link to="/admin/reports" className="text-indigo-300 hover:text-indigo-200 text-sm">Report</Link>}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Total Hours</span>
                <span className="font-semibold">{stats.hoursWeek.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Overtime</span>
                <span className="font-semibold">{stats.hoursWeek.overtime}h</span>
              </div>
              <ProgressBar value={stats.hoursWeek.completionPct} />
              <p className="text-xs text-slate-400">Pay period completion</p>
            </div>
          </Card>
          {/* Recent Activity */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Card title="Recent Activity">
              {auditLog.length === 0 ? (
                <p className="text-slate-400 text-sm">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {auditLog.map(entry => (
                    <div key={entry.id} className="flex items-start justify-between gap-4 border-b border-slate-700/50 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-white text-sm font-medium">
                          {formatAction(entry.action)}
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {entry.actor?.first_name} {entry.actor?.last_name}
                          {entry.target && entry.target.first_name !== entry.actor?.first_name && (
                            <span> → {entry.target.first_name} {entry.target.last_name}</span>
                          )}
                        </p>
                      </div>
                      <span className="text-slate-500 text-xs shrink-0">
                        {new Date(entry.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
