function goBack() {
    window.location.href = "login.html";
}

async function sendEmail() {
    const email = document.getElementById("email").value.trim().toLowerCase();

    if (!email) {
        alert("Enter email");
        return;
    }

    localStorage.setItem("resetEmail", email);
    window.location.href = "reset-password.html";
}
