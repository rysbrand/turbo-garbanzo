import React from "react";
import { Link } from "react-router-dom";

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
  <div className="bg-slate-800 rounded-xl p-6 shadow-lg ">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

const AdminDashboard = () => {
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
      
      <header className="bg-slate-900/90 backdrop-blur shadow-lg px-6 py-4 flex items-center justify-between relative">
        <Link to="/profile" className="flex items-center gap-4" aria-label="Profile">
          <img
            src="#"
            alt="Profile"
            className="h-13 w-13 rounded-full border-2 border-indigo-500 hover:scale-105 transition cursor-pointer"
          />
        </Link>

        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-4xl font-semibold flex items-center gap-3">
          Company Name
        </h1>

        <button
          className="ml-4 px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 transition"
          type="button"
        >
          Sign Out
        </button>
      </header>

   
      <main className="flex-1 p-6 space-y-8 max-w-7xl w-full mx-auto">
        
        <nav className="grid grid-cols-2 md:grid-cols-4 gap-6" aria-label="Admin quick navigation">
          <Link
            to="/admin/employees"
            className="bg-slate-800 rounded-xl p-6 text-center shadow hover:bg-slate-700 transition "
          >
            <h2 className="font-semibold text-lg">Employee Mgmt</h2>
          </Link>

          <Link
            to="/admin/schedule"
            className="bg-slate-800 rounded-xl p-6 text-center shadow hover:bg-slate-700 transition "
          >
            <h2 className="font-semibold text-lg">Schedule Mgmt</h2>
          </Link>

          <Link
            to="/admin/time-off"
            className="bg-slate-800 rounded-xl p-6 text-center shadow hover:bg-slate-700 transition "
          >
            <h2 className="font-semibold text-lg">Time‑Off Requests</h2>
          </Link>

          <Link
            to="/admin/timesheets"
            className="bg-slate-800 rounded-xl p-6 text-center shadow hover:bg-slate-700 transition "
          >
            <h2 className="font-semibold text-lg">Timesheets</h2>
          </Link>

        </nav>

        <div className="bg-slate-800 rounded-xl p-8 text-center shadow ">
          <h2 className="text-xl font-medium">
            Welcome, {stats.adminEmail}! Here’s your company overview for {stats.dateLabel}.
          </h2>
        </div>

        <section aria-label="Visuals Board" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

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

        </section>
      </main>

      <footer className="bg-slate-900/90 backdrop-blur text-center py-4 text-sm text-slate-500">
        © 2026 Company Name. All rights reserved.
      </footer>
    </div>
  );
};

export default AdminDashboard;
