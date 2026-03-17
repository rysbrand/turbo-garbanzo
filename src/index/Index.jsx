import React from 'react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-indigo-900 to-slate-900">
      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur rounded-2xl shadow-xl p-8 mx-auto mt-16">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="h-10 w-10 rounded-full bg-indigo-500"></div>
          </div>
          {/* Header */}
          <div className="text-center text-2xl font-semibold mb-4 text-white">
            Welcome to Turbo Garbanzo
          </div>
          {/* About Section */}
          <div className="text-center text-slate-300 mb-8">
            <p>This project is a modern web application for managing schedules, payroll, and more. Built for efficiency and ease of use.</p>
          </div>
          {/* Login Button */}
          <Link
            to="/login"
            className="w-full block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mb-4"
          >
            Login
          </Link>
        </div>
      </div>
      {/* Footer */}
      <footer className="text-center text-sm text-slate-500 py-4">
        &copy; {new Date().getFullYear()} Turbo Garbanzo. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
