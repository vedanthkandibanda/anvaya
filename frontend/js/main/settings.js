const { buildApiUrl } = window.APP_CONFIG;

// 🔐 AUTH GUARD
const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "../auth/login.html";
}

function goBack() {
    window.location.href = "dashboard.html";
}

/* ❤️ BG HEARTS */
const hearts = document.getElementById("hearts");
for (let i = 0; i < 20; i++) {
    const span = document.createElement("span");
    span.innerHTML = "❤️";
    span.style.left = Math.random() * 100 + "vw";
    span.style.animationDuration = (Math.random() * 6 + 5) + "s";
    hearts.appendChild(span);
}

/* 🚪 LOGOUT */
function logout() {
    if (!confirm("Are you sure you want to logout?")) return;
    localStorage.clear();
    window.location.href = "../auth/login.html";
}

/* 💔 DISCONNECT */
async function disconnect() {
    const pairId = localStorage.getItem("pairId");
    const userId = localStorage.getItem("userId");

    if (!pairId) {
        alert("You are not connected to anyone.");
        return;
    }

    if (!confirm("This will permanently delete all your messages and memories with your partner. Are you sure?")) return;

    try {
        const res = await fetch("https://anvaya-production.up.railway.app/api/pairs/disconnect", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ pairId, userId })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Failed to disconnect. Try again.");
            return;
        }

        /* Clear all local data and redirect to dashboard (will show pairing screen) */
        localStorage.removeItem("pairId");
        localStorage.removeItem("partnerId");
        window.location.href = "dashboard.html";

    } catch (err) {
        console.error("Disconnect error:", err);
        alert("Network error. Please try again.");
    }
}

/* ℹ️ ABOUT */
function openAbout() {
    window.location.href = "about.html";
}

function openChangePassword() {
    window.location.href = "../auth/reset-password.html";
}

