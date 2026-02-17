import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [user, setUser] = useState < any > null;
    const [error, setError] = useState("");
    const handleSignup = async () => {
        const {data, error} = await supabase.auth.signUp ({email, password});
        if (error) setError(error.message);
        else setUser(data.user);
    };

    const handleLogin = async () => {
        const {data,error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) setError(error.message);
        else setUser(data.user);
    };
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-80">
        <h2 className="text-2xl font-bold text-center mb-4">Supabase Auth</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {!user ? (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSignup}
                className="w-1/2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Sign Up
              </button>
              <button
                onClick={handleLogin}
                className="w-1/2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Login
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="mb-4">Logged in as {user.email}</p>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
    );
}
// const form = document.getElementById("loginForm");
// const errorMessage = document.getElementById("errorMessage");

// form.addEventListener("submit", function (e) {
//     e.preventDefault();

//     const email = form.querySelector('input[type="email"]').value.trim();
//     const password = form.querySelector('input[type="password"]').value.trim();

//     // TEMP logic (replace with backend later)
//     if (email === "test@example.com" && password === "password123") {
//         errorMessage.classList.add("hidden");
//         alert("Login successful");
//         // window.location.href = "dashboard.html";
//     } else {
//         errorMessage.classList.remove("hidden");
//     }
// });
