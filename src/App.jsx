import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { supabase } from './lib/supabase/client.js';
import ProtectedRoute from './lib/ProtectedRoute.jsx';
import ForgotPassword from './forgotpassword/ForgotPassword.jsx';
import ResetPassword from './resetpassword/ResetPassword.jsx';

import Login from './login/Login';
import Register from './register/Register';
import Dashboard from './dashboard/Dashboard';
import Profile from './profile/Profile';
import Schedule from './schedule/Schedule';
import Availability from './availability/Availability';
import Pay from './pay/Pay';
import Timesheet from './timesheet/Timesheet';
import Timeoff from './timeoff/Timeoff';
import AdminDashboard from './admin/AdminDashboard';
import ManagerApproval from './managerapproval/ManagerApproval';
import Index from './index/Index';


// Layout Component 
const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Schedule', path: '/schedule' },
    { name: 'Availability', path: '/availability' },
    { name: 'Pay', path: '/pay' },
    { name: 'Timesheet', path: '/timesheet' },
    { name: 'Admin', path: '/admindashboard'}
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col">

      {/* Header */}
      <header className="w-full bg-slate-900 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

          <Link to="/profile" className="flex-shrink-0 flex items-center">
            <User className="h-9 w-9 rounded-full border-2 border-indigo-500 hover:scale-105 transition cursor-pointer" />
          </Link>

          <h1 className="flex-1 text-center text-base sm:text-xl md:text-2xl font-semibold truncate px-2">
            Company Name
          </h1>

          {/* Hamburger — visible on all screen sizes */}
          <button
            className="flex-shrink-0 p-1"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 hover:text-indigo-400 transition" />
          </button>

        </div>
      </header>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Side Drawer — visible on all screen sizes */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-slate-900 z-50 transform transition-transform duration-300 flex flex-col
          ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <span className="text-slate-300 font-medium">Menu</span>
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5 cursor-pointer hover:text-indigo-400 transition" />
          </button>
        </div>

        <nav className="flex flex-col px-4 py-4 space-y-2 flex-1">
          {navItems.map(item => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={`py-2.5 px-4 rounded-lg transition text-sm
                ${location.pathname === item.path
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-slate-800 text-slate-300'
                }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Company Name. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};


// App Routes
const App = () => {
  return (
    <Routes>

      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgotpassword" element={<ForgotPassword />} />
      <Route path="/resetpassword" element={<ResetPassword />} />

      {/* Routes with Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/pay" element={<Pay />} />
          <Route path="/timesheet" element={<Timesheet />} />
          <Route path="/timeoff" element={<Timeoff />} />
        </Route>
      </Route>
      {/* Manager-only routes */}
      <Route element={<ProtectedRoute allowedRoles={[2, 3]} />}>
        <Route element={<Layout />}>
          <Route path="/managerapproval" element={<ManagerApproval />} />
        </Route>
      </Route>

      {/* Admin-only routes */}
      <Route element={<ProtectedRoute allowedRoles={[3]} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* Global fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
};

export default App;