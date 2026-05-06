import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Bell} from 'lucide-react';
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
import ScheduleManager from './schedule/ScheduleManager';
import Index from './index/Index';
import UserManagement from './admin/UserManagement';


// Layout Component 
const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchRoleAndNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .maybeSingle();
      setUserRole(profileData?.user_role ?? null);

      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(notifData || []);
    };

    fetchRoleAndNotifications();
  }, []);

  const markAsRead = async (id, entity_type) => {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  setNotifications(prev =>
    prev.map(n => n.id === id ? { ...n, read: true } : n)
  );
  setShowNotifications(false);

  if (entity_type === 'time_off_request') {
    navigate('/managerapproval');
  } else if (entity_type === 'time_off_decision') {
    navigate('/timeoff');
  } else if (entity_type === 'schedules') {
    navigate('/schedule');
  }
};

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Schedule', path: '/schedule' },
    { name: 'Availability', path: '/availability' },
    { name: 'Pay', path: '/pay' },
    { name: 'Timesheet', path: '/timesheet' },
    { name: 'Time Off', path: '/timeoff' },
  ];

  const managerNavItems = [
    { name: 'Schedule Manager', path: '/schedule/manage' },
    { name: 'Approvals', path: '/managerapproval' },
  ];

  const adminNavItems = [
    { name: 'Admin Dashboard', path: '/admin' },
    { name: 'User Management', path: '/admin/users' },
  ]

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

          {/* CHANGED: added min-w-0 to allow proper truncation on small screens */}
          {/* TODO: Pull company name dynamically from Supabase settings table.
    Will be organization-specific once multi-org support is implemented. */}
          <h1 className="flex-1 min-w-0 text-center text-base sm:text-xl md:text-2xl font-semibold truncate px-2">
            My Workplace
          </h1>

          {/* Notification Bell */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1"
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6 hover:text-indigo-400 transition" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                {/* CHANGED: w-72 + max-w-[calc(100vw-2rem)] prevents overflow on small screens */}
                <div className="absolute right-0 top-10 w-72 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                    <span className="font-medium text-white text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-6">No notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id, n.entity_type)}
                          className={`px-4 py-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition
                            ${!n.read ? 'bg-slate-800/60' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-sm font-medium ${!n.read ? 'text-white' : 'text-slate-400'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                              <p className="text-xs text-slate-600 mt-1">
                                {new Date(n.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            </div>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Hamburger */}
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

      {/* Side Drawer */}
      {/* CHANGED: added max-w-[85vw] so drawer never takes up full screen on very small devices */}
      <div
        className={`fixed top-0 right-0 h-full w-64 max-w-[85vw] bg-slate-900 z-50 transform transition-transform duration-300 flex flex-col
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
          {/* Manager/Admin only links */}
          {userRole >= 2 && (
            <>
              <div className="border-t border-slate-700 my-2" />
              {managerNavItems.map(item => (
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
            </>
          )}
          {/*Admin only links*/}
          {userRole === 3 && (
            <>
              <div className="border-t border-slate-700 my-2" />
              {adminNavItems.map(item => (
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
            </>
          )}
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
      {/* CHANGED: added overflow-x-hidden to prevent child components from blowing out page width */}
      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} My Workplace. All rights reserved.
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
          <Route path="/schedule/manage" element={<ScheduleManager />} />
        </Route>
      </Route>

      {/* Admin-only routes */}
      <Route element={<ProtectedRoute allowedRoles={[3]} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={[3]} />}>
      <Route element={<Layout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        </Route>
      </Route>

      {/* Global fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
};

export default App;