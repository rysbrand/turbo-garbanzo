const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if(username === "admin" && password === "password123") {
        alert("Login successful!");
        errorMessage.textContent = "";
    }
    else 
    {
        errorMessage.textContent = "Invalid username or password.";
    }
});