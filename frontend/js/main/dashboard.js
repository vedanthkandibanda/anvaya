const connectionActions = document.getElementById("connectionActions");
const connectionName = document.getElementById("connectionName");
const dashboardGrid = document.querySelector(".dashboard-grid");

/* CURRENT USER */
const rawUserId = localStorage.getItem("userId");
const userId = rawUserId && rawUserId !== "null" && rawUserId !== "undefined" ? rawUserId : null;

/* CHECK AUTH */
if (!userId) {
    console.log("No userId found, redirecting to login");
    window.location.href = "../auth/login.html";
} else {
    console.log("User ID found:", userId);
}

/* LOAD DASHBOARD */
async function loadDashboard() {
    console.log("Loading dashboard for user:", userId);

    try {
        const res = await fetch(
            `http://localhost:5000/api/pair/status/${userId}`
        );

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const userData = await res.json();
        console.log("Dashboard data received:", userData);

        renderDashboard(userData);

    } catch (err) {
        console.error("Dashboard load failed:", err);
        alert("Dashboard load failed: " + err.message);
    }
}

/* RENDER */
function renderDashboard(userData) {
    console.log("Rendering dashboard with data:", userData);

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

    } else {
        console.log("User connected, showing full features");

        connectionName.innerText = userData.partnerName;
        if (userData.pairId) {
            localStorage.setItem("pairId", userData.pairId);
        }
        if (userData.partnerName) {
            localStorage.setItem("partnerName", userData.partnerName);
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
    }
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
    alert("Disconnect feature coming soon!");
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
            `http://localhost:5000/api/pair/search?query=${encodeURIComponent(query)}&userId=${userId}`
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
            "http://localhost:5000/api/pair/request",
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
            alert(data.message);
            closeSearchModal();
            loadDashboard(); // Refresh dashboard
        } else {
            alert(data.message || "Failed to send request");
        }

    } catch (err) {
        console.error("Send request failed:", err);
        alert("Failed to send request");
    }
}

/* OPEN REQUESTS */
async function viewRequests() {

    document
        .getElementById("requestsModal")
        .classList.remove("hidden");

    const userId = localStorage.getItem("userId");

    const res = await fetch(
        `http://localhost:5000/api/pair/requests/${userId}`
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
            "http://localhost:5000/api/pair/accept-request",
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

        alert(data.message || "Connection accepted. Please open chat from the dashboard.");
        location.reload();
    } catch (err) {
        console.error("Accept request failed:", err);
        alert(err.message || "Accept request failed");
        viewRequests();
    }
}

/* REJECT */
async function rejectRequest(requestId) {

    const res = await fetch(
        "http://localhost:5000/api/pair/reject-request",
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

    alert(data.message);
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
    if (text.includes("Vault")) {
        window.location.href = "vault.html";
    } else if (text.includes("Settings")) {
        window.location.href = "settings.html";
    } else if (text.includes("Profile")) {
        window.location.href = "profile.html";
    } else if (text.includes("Chat")) {
        window.location.href = "chat.html";
    } else {
        alert(text + " feature coming soon!");
    }
});