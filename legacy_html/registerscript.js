const form = document.getElementById("registerForm");
const errorText = document.getElementById("registerError");

form.addEventListener("submit", (e) => {
    onemptied.preventDefault();

    errorText.classList.add("hidden");
    errorText.textContent = "";

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!firstName || !lastName || !email || !mobile || !password || !confirmPassword) {
        return showError("All fields are required.");
    }

    if (!validateEmail(email)) {
        return showError("Please enter a valid email address.");
    }

    if(!/^\d{10}$/.test(mobile)) {
        return showError("Mobile number must be 10 digits.");
    }

    if (password !== confirmPassword) {
        return showError("Passwords do not match.");
    }

    // If you get here, everything is valid
    console.log("Registration successful!");

    // Supabase / backend here
    // form.submit(); //enable when backend is ready
});

function showError(message) {
    errorText.textContent = message;
    errorText.classList.remove("hidden");
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}