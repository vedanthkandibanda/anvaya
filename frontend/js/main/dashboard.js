const { buildApiUrl } = window.APP_CONFIG;

const connectionActions = document.getElementById("connectionActions");
const connectionName = document.getElementById("connectionName");
const dashboardGrid = document.querySelector(".dashboard-grid");
const connectionBox = document.querySelector(".connection-box");
const userDpEl = document.getElementById("userDp");
const partnerDpEl = document.getElementById("partnerDp");
const userNameEl = document.getElementById("userName");
const toastContainer = document.getElementById("toastContainer");
const connectionMenuBtn = document.getElementById("connectionMenuBtn");
const connectionBgModal = document.getElementById("connectionBgModal");
const closeConnectionBgModalBtn = document.getElementById("closeConnectionBgModal");
const bgOptions = document.getElementById("bgOptions");
const bgUploadBlock = document.getElementById("bgUploadBlock");
const bgImageInput = document.getElementById("bgImageInput");
const saveBgBtn = document.getElementById("saveBgBtn");
const changeBgBtn = document.getElementById("changeBgBtn");
const resetBgBtn = document.getElementById("resetBgBtn");

let hasConnectionBackground = false;

function showToast(message, type = "info") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("visible"));
    setTimeout(() => {
        toast.classList.remove("visible");
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, 2400);
}

/* CURRENT USER */
const rawUserId = localStorage.getItem("userId");
const userId = rawUserId && rawUserId !== "null" && rawUserId !== "undefined" ? rawUserId : null;

/* CHECK AUTH */
if (!userId) {
    console.log("No userId found, redirecting to login");
    window.location.href = "/login";
} else {
    console.log("User ID found:", userId);
}

/* LOAD DASHBOARD */
async function loadDashboard() {
    console.log("Loading dashboard for user:", userId);

    try {
        const res = await fetch(
            `https://anvaya-production.up.railway.app/api/user/profile/${userId}`
        );

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const userData = await res.json();
        console.log("Dashboard data received:", userData);

        if (userData.user) {
            localStorage.setItem("userId", userData.user.id);
        }
        if (userData.pairId) {
            localStorage.setItem("pairId", userData.pairId);
        }
        if (userData.partner?.name) {
            localStorage.setItem("partnerName", userData.partner.name);
        }

        renderDashboard(userData);

    } catch (err) {
        console.error("Dashboard load failed:", err);
        showToast("Dashboard load failed: " + err.message, "error");
    }
}

/* RENDER */
function renderDashboard(userData) {
    console.log("Rendering dashboard with data:", userData);

    if (userData.user) {
        userNameEl.innerText = userData.user.name || "You";
        userDpEl.src = userData.user.profile_pic || getAvatar(userData.user.name);
    }

    if (!userData.isConnected) {
        console.log("User not connected, showing search options");

        connectionName.innerText = "Not Connected";

        connectionActions.innerHTML = `
            <button onclick="searchUser()">🔍 Search</button>
            <button onclick="viewRequests()">📩 Requests</button>
        `;

        dashboardGrid.innerHTML = `
            <div class="grid-item">📸 Vault</div>
            <div class="grid-item">⚙️ Settings</div>
            <div class="grid-item">👤 Profile</div>
        `;

        clearConnectionBackground();
        connectionMenuBtn.classList.add("hidden");

    } else {
        console.log("User connected, showing full features");

        const partnerName = userData.partner?.name || "Your Person";
        connectionName.innerText = partnerName;

        if (userData.user) {
            userNameEl.innerText = userData.user.name || "You";
            userDpEl.src = userData.user.profile_pic || getAvatar(userData.user.name);
        }

        if (userData.partner) {
            partnerDpEl.src = userData.partner.profile_pic || getAvatar(userData.partner.name);
            localStorage.setItem("partnerName", userData.partner.name);
        }

        connectionActions.innerHTML = `
            <button onclick="disconnect()">💔 Disconnect</button>
        `;

        dashboardGrid.innerHTML = `
            <div class="grid-item">🎧 Listen</div>
            <div class="grid-item">🎬 Watch</div>
            <div class="grid-item">📸 Vault</div>
            <div class="grid-item">💬 Chat</div>
            <div class="grid-item">📞 Call</div>
            <div class="grid-item">🎥 Video</div>
            <div class="grid-item">⚙️ Settings</div>
            <div class="grid-item">👤 Profile</div>
        `;

        connectionMenuBtn.classList.remove("hidden");
        loadConnectionBackground();
    }
}

function applyConnectionBackground(url) {
    connectionBox.style.setProperty("--connection-bg-image", `url('${url}')`);
    connectionBox.classList.add("has-custom-bg");
    hasConnectionBackground = true;
}

function clearConnectionBackground() {
    connectionBox.style.removeProperty("--connection-bg-image");
    connectionBox.classList.remove("has-custom-bg");
    hasConnectionBackground = false;
}

async function loadConnectionBackground() {
    const pairId = localStorage.getItem("pairId");
    if (!pairId) {
        clearConnectionBackground();
        return;
    }

    try {
        const res = await fetch(`https://anvaya-production.up.railway.app/api/pair/connection-bg/${pairId}`);
        if (!res.ok) {
            clearConnectionBackground();
            return;
        }

        const data = await res.json();
        if (data.imageUrl) {
            applyConnectionBackground(data.imageUrl);
            return;
        }

        clearConnectionBackground();
    } catch (err) {
        console.error("Connection background load failed:", err);
        clearConnectionBackground();
    }
}

function openConnectionBgModal() {
    if (!localStorage.getItem("pairId")) {
        showToast("Connect with a partner first", "error");
        return;
    }

    bgImageInput.value = "";
    if (hasConnectionBackground) {
        bgOptions.classList.remove("hidden");
        bgUploadBlock.classList.add("hidden");
    } else {
        bgOptions.classList.add("hidden");
        bgUploadBlock.classList.remove("hidden");
    }

    connectionBgModal.classList.remove("hidden");
}

function closeConnectionBgModal() {
    connectionBgModal.classList.add("hidden");
}

connectionMenuBtn.addEventListener("click", openConnectionBgModal);
closeConnectionBgModalBtn.addEventListener("click", closeConnectionBgModal);
connectionBgModal.addEventListener("click", (event) => {
    if (event.target === connectionBgModal) {
        closeConnectionBgModal();
    }
});

changeBgBtn.addEventListener("click", () => {
    bgOptions.classList.add("hidden");
    bgUploadBlock.classList.remove("hidden");
});

saveBgBtn.addEventListener("click", async () => {
    const pairId = localStorage.getItem("pairId");
    const image = bgImageInput.files[0];

    if (!pairId) {
        showToast("Connection not found", "error");
        return;
    }

    if (!image) {
        showToast("Choose an image first", "error");
        return;
    }

    if (!image.type.startsWith("image/")) {
        showToast("Only image files are allowed", "error");
        return;
    }

    const formData = new FormData();
    formData.append("pairId", pairId);
    formData.append("userId", userId);
    formData.append("image", image);

    const res = await fetch("https://anvaya-production.up.railway.app/api/pair/connection-bg", {
        method: "POST",
        body: formData
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        showToast(data.message || "Unable to save image", "error");
        return;
    }

    applyConnectionBackground(data.imageUrl);
    closeConnectionBgModal();
    showToast("Background saved", "success");
});

resetBgBtn.addEventListener("click", async () => {
    const pairId = localStorage.getItem("pairId");
    if (!pairId) return;

    const res = await fetch(`https://anvaya-production.up.railway.app/api/pair/connection-bg/${pairId}?userId=${userId}`, {
        method: "DELETE"
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        showToast(data.message || "Unable to reset background", "error");
        return;
    }

    clearConnectionBackground();
    closeConnectionBgModal();
    showToast("Background reset", "success");
});

function getAvatar(name) {
    const initial = name?.trim()?.charAt(0).toUpperCase() || "A";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="40" fill="#ff4d6d"/><text x="50%" y="55%" font-size="36" text-anchor="middle" fill="#fff" font-family="Segoe UI, sans-serif" dy=".1em">${initial}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/* HEARTS */
const heartsContainer = document.getElementById("hearts");

for (let i = 0; i < 25; i++) {
    const span = document.createElement("span");
    span.innerHTML = "❤️";

    span.style.left = Math.random() * 100 + "vw";
    span.style.animationDuration = (Math.random() * 6 + 5) + "s";
    span.style.fontSize = (Math.random() * 10 + 10) + "px";

    heartsContainer.appendChild(span);
}

/* ACTIONS */
/* SEARCH OPEN */
function searchUser() {
    document
        .getElementById("searchModal")
        .classList.remove("hidden");
}

/* CLOSE */
function closeSearchModal() {
    document
        .getElementById("searchModal")
        .classList.add("hidden");
}

/* DISCONNECT */
function disconnect() {
    showToast("Disconnect feature coming soon!", "info");
}

/* LIVE SEARCH */
document
.getElementById("searchInput")
.addEventListener("input", async function () {

    const query = this.value.trim();
    const userId = localStorage.getItem("userId");

    if (!query) {
        document.getElementById("searchResults").innerHTML = "";
        return;
    }

    try {
        const res = await fetch(
            `https://anvaya-production.up.railway.app/api/pair/search?query=${encodeURIComponent(query)}&userId=${userId}`
        );

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const users = await res.json();

        let html = "";

        if (users.length === 0) {
            html = "<p>No users found</p>";
        } else {
            users.forEach(user => {
                html += `
                    <div class="search-user-card">
                        <span>${user.username}</span>
                        <button onclick="sendRequest(${user.id})">
                            ❤️ Connect
                        </button>
                    </div>
                `;
            });
        }

        document.getElementById("searchResults").innerHTML = html;

    } catch (err) {
        console.error("Search failed:", err);
        document.getElementById("searchResults").innerHTML = "<p>Search failed</p>";
    }
});

/* SEND REQUEST */
async function sendRequest(receiverId) {

    const senderId = localStorage.getItem("userId");

    try {
        const res = await fetch(
            "https://anvaya-production.up.railway.app/api/pair/request",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    senderId,
                    receiverId
                })
            }
        );

        const data = await res.json();

        if (res.ok) {
            showToast(data.message, "success");
            closeSearchModal();
            loadDashboard(); // Refresh dashboard
        } else {
            showToast(data.message || "Failed to send request", "error");
        }

    } catch (err) {
        console.error("Send request failed:", err);
        showToast("Failed to send request", "error");
    }
}

/* OPEN REQUESTS */
async function viewRequests() {

    document
        .getElementById("requestsModal")
        .classList.remove("hidden");

    const userId = localStorage.getItem("userId");

    const res = await fetch(
        `https://anvaya-production.up.railway.app/api/pair/requests/${userId}`
    );

    const requests = await res.json();

    let html = "";

    requests.forEach(req => {
        html += `
            <div class="search-user-card">
                <span>${req.username}</span>

                <div>
                    <button onclick="
                        acceptRequest(
                            ${req.id},
                            ${req.sender_id},
                            ${userId}
                        )
                    ">
                        Accept
                    </button>

                    <button onclick="
                        rejectRequest(${req.id})
                    ">
                        Reject
                    </button>
                </div>
            </div>
        `;
    });

    document.getElementById("requestsResults").innerHTML = html;
}

/* CLOSE */
function closeRequestsModal() {
    document
        .getElementById("requestsModal")
        .classList.add("hidden");
}

/* ACCEPT */
async function acceptRequest(requestId, senderId, receiverId) {
    try {
        const res = await fetch(
            "https://anvaya-production.up.railway.app/api/pair/accept-request",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    requestId,
                    senderId,
                    receiverId
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || `Accept request failed with ${res.status}`);
        }

        const newPairId = data.pairId || (data.pair && data.pair.id);
        if (newPairId) {
            localStorage.setItem("pairId", newPairId);
            window.location.href = "chat.html";
            return;
        }

        showToast(data.message || "Connection accepted. Please open chat from the dashboard.", "success");
        location.reload();
    } catch (err) {
        console.error("Accept request failed:", err);
        showToast(err.message || "Accept request failed", "error");
        viewRequests();
    }
}

/* REJECT */
async function rejectRequest(requestId) {

    const res = await fetch(
        "https://anvaya-production.up.railway.app/api/pair/reject-request",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                requestId
            })
        }
    );

    const data = await res.json();

    showToast(data.message || "Request rejected", "info");
    viewRequests();
}

function goToChat() {
    window.location.href = "chat.html";
}

/* INITIAL */
if (userId) {
    loadDashboard();
}

// Use event delegation so dashboard grid items stay clickable after render
dashboardGrid.addEventListener("click", function(event) {
    const item = event.target.closest(".grid-item");
    if (!item) return;

    const text = item.textContent;
    if (text.includes("Listen")) {
        window.location.href = "music.html";
    } else if (text.includes("Vault")) {
        window.location.href = "vault.html";
    } else if (text.includes("Settings")) {
        window.location.href = "settings.html";
    } else if (text.includes("Profile")) {
        window.location.href = "profile.html";
    } else if (text.includes("Chat")) {
        window.location.href = "chat.html";
    } else {
        showToast(text + " feature coming soon!", "info");
    }
});

async function loadDailyMessage() {

    const pairId = localStorage.getItem("pairId");

    if (!pairId) return;

    try {

        const res = await fetch(`https://anvaya-production.up.railway.app/api/profile/daily/${pairId}`);
        const data = await res.json();

        const popup = document.getElementById("dailyPopup");

        popup.classList.remove("hidden");

        if (data) {

            popup.innerHTML = `
                <h4>❤️ Today’s Message</h4>
                <p>${data.message}</p>
            `;

            // auto hide
            setTimeout(() => {
                popup.classList.add("hidden");
            }, 4000);

        } else {

            popup.innerHTML = `
                <h4>🌅 Daily Message</h4>
                <p>What's today's message?</p>
            `;

            popup.onclick = () => {
                window.location.href = "profile.html";
            };
        }

    } catch (err) {
        console.error(err);
    }
}

window.addEventListener("load", () => {
    loadDailyMessage();
});

