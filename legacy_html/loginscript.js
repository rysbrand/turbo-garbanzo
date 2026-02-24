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

    const email = form.querySelector("#email").value.trim();
    const password = form.querySelector("#password").value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    //for debugging, uncomment: 
        // console.log("login error:", error)
        // console.log("login data:", data)
    if (error) {
        console.error(error);
        return showError(error.message);
    }
    //troubleshoot, does not return user
    alert("Logged in user:", data.user);

    window.location.href = "../dashboard/dashboard.html";
});
