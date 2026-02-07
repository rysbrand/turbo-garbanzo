const form = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

form.addEventListener("submit", function (e) {
    e.preventDefault();

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
