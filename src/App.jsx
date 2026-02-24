import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/availability" element={<Availability />} />
      <Route path="/pay" element={<Pay />} />
      <Route path="/timesheet" element={<Timesheet />} />
      <Route path="/timeoff" element={<Timeoff />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/managerapproval" element={<ManagerApproval />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
