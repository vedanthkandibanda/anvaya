// 🔐 AUTH GUARD (ADD AT TOP)
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../auth/login.html";
}

const profileDp = document.getElementById("profileDp");
const profileName = document.getElementById("profileName");
const profileBio = document.getElementById("profileBio");
const connectionStatusEl = document.getElementById("connectionStatus");
const connectionNameEl = document.getElementById("connectionName");
const connectionSinceEl = document.getElementById("connectionSince");
const dailyInputEl = document.getElementById("dailyInput");
const dailyForm = document.getElementById("dailyForm");
const dailyPreview = document.getElementById("dailyPreview");
const memoryModal = document.getElementById("memoryModal");
const editProfileModal = document.getElementById("editProfileModal");
const editBtn = document.querySelector(".edit-btn");
const saveProfileBtn = document.getElementById("saveProfile");
const editBio = document.getElementById("editBio");
const editInterests = document.getElementById("editInterests");
const editDpInput = document.getElementById("editDpInput");
const toastContainer = document.getElementById("toastContainer");
const addBtn = document.getElementById("addMemoryBtn");
const saveBtn = document.getElementById("saveMemory");
const list = document.getElementById("memoryList");

addBtn.onclick = () => openModal(memoryModal);
editBtn.addEventListener("click", openProfileEditor);

const modalCloseButtons = document.querySelectorAll("[data-close]");
modalCloseButtons.forEach(button => {
    button.addEventListener("click", (event) => {
        const modal = event.target.closest(".modal");
        if (modal) closeModal(modal);
    });
});

window.addEventListener("click", (event) => {
    document.querySelectorAll(".modal:not(.hidden)").forEach(modal => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
});

function openModal(modal) {
    modal.classList.remove("hidden");
}

function closeModal(modal) {
    modal.classList.add("hidden");
}

function goBack() {
    window.location.href = "dashboard.html";
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    toastContainer.appendChild(toast);
    window.requestAnimationFrame(() => {
        toast.classList.add("visible");
    });
    setTimeout(() => {
        toast.classList.remove("visible");
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, 2800);
}

function renderDailyMessage(text) {
    if (!text) {
        dailyForm.classList.remove("hidden");
        dailyPreview.classList.add("hidden");
        dailyPreview.innerHTML = "";
        return;
    }
    dailyForm.classList.add("hidden");
    dailyPreview.classList.remove("hidden");
    dailyPreview.innerHTML = `<div class="daily-saved"><p>${text}</p></div>`;
}

function openProfileEditor() {
    editBio.value = profileBio.innerText === "Your bio here..." ? "" : profileBio.innerText;
    editInterests.value = localStorage.getItem("userInterests") || "";
    openModal(editProfileModal);
}

async function loadProfileData() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
        const res = await fetch(`http://localhost:5000/api/user/profile/${userId}`);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.user) {
            profileName.innerText = data.user.name || "Your Name";
            profileBio.innerText = data.user.bio || "Your bio here...";
            profileDp.src = data.user.profile_pic || getAvatar(data.user.name);
            localStorage.setItem("userId", data.user.id);
            localStorage.setItem("userInterests", data.user.interests || "");
        }

        if (data.partner) {
            connectionStatusEl.innerText = "Connected with ❤️";
            connectionNameEl.innerText = data.partner.name;
            connectionSinceEl.innerText = "Connected with your partner";
            localStorage.setItem("pairId", data.pairId);
            localStorage.setItem("partnerName", data.partner.name);
        } else {
            connectionStatusEl.innerText = "Not connected yet";
            connectionNameEl.innerText = "No partner";
            connectionSinceEl.innerText = "Connect from the dashboard";
        }
    } catch (err) {
        console.error("Profile load failed", err);
    }
}

function getAvatar(name) {
    const initial = name?.trim()?.charAt(0).toUpperCase() || "A";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="40" fill="#ff4d6d"/><text x="50%" y="55%" font-size="36" text-anchor="middle" fill="#fff" font-family="Segoe UI, sans-serif" dy=".1em">${initial}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

async function loadTodayDailyMessage() {
    const pairId = localStorage.getItem("pairId");
    if (!pairId) return;

    try {
        const res = await fetch(`http://localhost:5000/api/profile/daily/${pairId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data?.message) {
            renderDailyMessage(data.message);
            dailyInputEl.value = data.message;
            return;
        }
        renderDailyMessage(null);
    } catch (err) {
        console.error("Daily message load failed", err);
    }
}

const smartModal = document.getElementById("smartModal");
const smartTitle = document.getElementById("smartTitle");

document.querySelectorAll(".smart-item").forEach(item => {

    item.addEventListener("click", () => {

        const text = item.innerText;

        smartModal.classList.remove("hidden");

        if (text.includes("Schedule")) smartTitle.innerText = "Schedule Message";
        if (text.includes("Birthday")) smartTitle.innerText = "Birthday Message";
        if (text.includes("Surprise")) smartTitle.innerText = "Surprise Message";
        if (text.includes("Open")) smartTitle.innerText = "Open After Message";
    });

});

const hearts = document.getElementById("hearts");

for (let i = 0; i < 20; i++) {
    const span = document.createElement("span");
    span.innerHTML = "❤️";
    span.style.left = Math.random() * 100 + "vw";
    span.style.animationDuration = (Math.random() * 6 + 5) + "s";
    hearts.appendChild(span);
}

document.getElementById("saveDaily").onclick = async () => {
    const text = dailyInputEl.value.trim();
    const pairId = localStorage.getItem("pairId");
    if (!text) {
        showToast("Please enter a daily message", "error");
        return;
    }

    const res = await fetch("http://localhost:5000/api/profile/daily", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ pairId, message: text })
    });

    if (!res.ok) {
        showToast("Unable to save daily message", "error");
        return;
    }

    renderDailyMessage(text);
    showToast("Saved ❤️", "success");
};

saveBtn.onclick = async () => {

    const pairId = localStorage.getItem("pairId");

    const date = document.getElementById("memoryDate").value;
    const title = document.getElementById("memoryTitle").value;
    const desc = document.getElementById("memoryDesc").value;

    const res = await fetch("http://localhost:5000/api/profile/memory", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
            pairId,
            title,
            description: desc,
            memory_date: date
        })
    });

    if (res.ok) {
        showToast("Memory saved ❤️", "success");
        closeModal(memoryModal);
        loadMemories();
    } else {
        showToast("Unable to save memory", "error");
    }
};

async function loadMemories() {
    const pairId = localStorage.getItem("pairId");
    if (!pairId) return;

    list.innerHTML = "";

    const res = await fetch(`http://localhost:5000/api/profile/memory/${pairId}`);
    const data = await res.json();

    data.forEach(m => {
        const div = document.createElement("div");
        div.classList.add("memory-item");

        div.innerHTML = `
            <strong>${m.memory_date}</strong>
            <p>${m.title}</p>
            <small>${m.description}</small>
        `;

        list.appendChild(div);
    });
}

saveProfileBtn.addEventListener("click", async () => {
    const userId = localStorage.getItem("userId");
    const bio = editBio.value.trim();
    const interests = editInterests.value.trim();

    if (!userId) {
        showToast("User not found", "error");
        return;
    }

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("bio", bio);
    formData.append("interests", interests);
    if (editDpInput.files[0]) {
        formData.append("profilePic", editDpInput.files[0]);
    }

    const res = await fetch("http://localhost:5000/api/user/profile-update", {
        method: "POST",
        body: formData
    });

    const data = await res.json();
    if (res.ok && data.status === "success") {
        profileBio.innerText = bio || "Your bio here...";
        profileDp.src = data.user.profile_pic || getAvatar(profileName.innerText);
        localStorage.setItem("userInterests", interests);
        showToast("Profile updated successfully", "success");
        closeModal(editProfileModal);
    } else {
        showToast(data.message || "Unable to update profile", "error");
    }
});

loadProfileData()
    .then(loadTodayDailyMessage)
    .then(loadMemories)
    .catch(err => console.error("Profile init failed", err));

document.getElementById("smartSend").onclick = async () => {
    const pairId = localStorage.getItem("pairId");
    const userId = localStorage.getItem("userId");
    const text = document.getElementById("smartText").value.trim();
    const time = document.getElementById("smartTime").value;

    if (!text || !time) {
        showToast("Please fill smart message and time", "error");
        return;
    }

    const res = await fetch("http://localhost:5000/api/profile/smart", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
            pairId,
            senderId: userId,
            message: text,
            deliverAt: time
        })
    });

    if (res.ok) {
        closeModal(document.getElementById("smartModal"));
        showToast("Smart message set ❤️", "success");
    } else {
        showToast("Unable to set smart message", "error");
    }
};

/* ☰ MENU POPUP */
const menuBtn = document.getElementById("menuBtn");
const menuPopup = document.getElementById("menuPopup");

menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menuPopup.classList.toggle("hidden");
});

// Close popup when clicking outside
document.addEventListener("click", (e) => {
    if (!menuPopup.classList.contains("hidden") && !menuPopup.contains(e.target)) {
        menuPopup.classList.add("hidden");
    }
});

function goToSettings() {
    menuPopup.classList.add("hidden");
    window.location.href = "settings.html";
}

async function disconnectFromMenu() {
    menuPopup.classList.add("hidden");

    const pairId = localStorage.getItem("pairId");
    const userId = localStorage.getItem("userId");

    if (!pairId) {
        showToast("You are not connected to anyone.", "error");
        return;
    }

    if (!confirm("This will permanently delete all your messages and memories with your partner. Are you sure?")) return;

    try {
        const res = await fetch("http://localhost:5000/api/pairs/disconnect", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ pairId, userId })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.message || "Failed to disconnect", "error");
            return;
        }

        localStorage.removeItem("pairId");
        localStorage.removeItem("partnerId");
        window.location.href = "dashboard.html";

    } catch (err) {
        console.error("Disconnect error:", err);
        showToast("Network error. Please try again.", "error");
    }
}

function logoutFromMenu() {
    menuPopup.classList.add("hidden");
    if (!confirm("Are you sure you want to logout?")) return;
    localStorage.clear();
    window.location.href = "../auth/login.html";
}

