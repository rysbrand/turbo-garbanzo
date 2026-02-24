import React from 'react';

const Profile = () => {
  // Placeholder for user profile info
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center">
      <div className="bg-slate-900/90 backdrop-blur rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center">
          <div className="h-20 w-20 rounded-full bg-indigo-500 mb-4"></div>
          <h2 className="text-2xl font-semibold mb-2">User Profile</h2>
          <p className="text-slate-400">Profile details will go here.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
