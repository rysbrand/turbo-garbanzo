console.log("mode:", import.meta.env.MODE);
console.log("supabase url:", import.meta.env.VITE_SUPABASE_URL);
console.log("supabase anon:", import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 12));


import { supabase } from "../lib/supabase/client.js";

console.log(import.meta.env.VITE_SUPABASE_URL);

const form = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove("hidden");
}

function hideError() {
    errorMessage.classList.add("hidden");
    errorMessage.textContent = "";
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value.trim();

    // TEMP logic (replace with backend later)
    if (email === "test@example.com" && password === "password123") {
        errorMessage.classList.add("hidden");
        alert("Login successful");
        // window.location.href = "dashboard.html";
    } else {
        errorMessage.classList.remove("hidden");
    }
});
