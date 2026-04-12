function goBack() {
    window.history.back();
}

async function resetPassword() {
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (!password || !confirm) {
        alert("Please fill all fields");
        return;
    }

    if (password !== confirm) {
        alert("Passwords do not match");
        return;
    }

    const email = localStorage.getItem("resetEmail");
    if (!email) {
        alert("Email not found. Try forgot password again.");
        window.location.href = "forgot-password.html";
        return;
    }

    const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok && data.status === "success") {
        localStorage.removeItem("resetEmail");
        alert("Password updated");
        window.location.href = "login.html";
    } else {
        alert(data.message || "Error updating password");
    }
}
