const { apiBaseUrl, buildApiUrl, buildUploadUrl, navigateTo } = window.APP_CONFIG;

/* ❤️ HEARTS */
const heartsContainer = document.getElementById("chatHearts");
const moodBtn = document.getElementById("moodBtn");
const moodPopup = document.getElementById("moodPopup");
const chatMessages = document.getElementById("chatMessages");
const chatContainer = document.querySelector(".chat-container");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const sendStatus = document.getElementById("sendStatus");
const moodLayer = document.getElementById("chatMoodLayer");
const partnerStatusEl = document.getElementById("partnerStatusText");
const partnerDpEl = document.querySelector(".partner-dp");
const backBtn = document.querySelector(".back-btn");

const rawUserId = localStorage.getItem("userId");
const userId = rawUserId && rawUserId !== "null" && rawUserId !== "undefined" ? rawUserId : null;
let rawPairId = localStorage.getItem("pairId");
let pairId = rawPairId && rawPairId !== "null" && rawPairId !== "undefined" ? rawPairId : null;
const socket = io(apiBaseUrl);

const preview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");
const addToVaultBtn = document.getElementById("addToVaultBtn");
const addToVaultModal = document.getElementById("addToVaultModal");
const saveToVaultBtn = document.getElementById("saveToVault");
const vaultMemoryDate = document.getElementById("vaultMemoryDate");
const vaultMemoryTitle = document.getElementById("vaultMemoryTitle");
const vaultMemoryDesc = document.getElementById("vaultMemoryDesc");

let selectedImageUrl = null;

if (!userId) {
    navigateTo("login");
}

if (localStorage.getItem("onboardingRequired") === "1") {
    navigateTo("profileSetup");
}

if (!pairId) {
    partnerStatusEl.innerText = "Looking for your partner...";
}

function joinPairRoomIfReady() {
    if (pairId && socket.connected) {
        socket.emit("joinRoom", { pairId, userId });
    }
}

const statusText = document.getElementById("statusText");
const partnerNameEl = document.getElementById("chatPartnerName");
const toastContainer = document.getElementById("toastContainer");

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

socket.on("userOnline", () => {
    statusText.innerText = "Online 🟢";
});

let typingTimeout;

input.addEventListener("input", () => {
    if (!pairId) return;

    socket.emit("typing", { pairId, userId });

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
        socket.emit("stopTyping", { pairId, userId });
    }, 1000);
});

for (let i = 0; i < 20; i++) {
    const span = document.createElement("span");
    span.innerHTML = "❤️";
    span.style.left = Math.random() * 100 + "vw";
    span.style.animationDuration = (Math.random() * 6 + 5) + "s";
    span.style.fontSize = (Math.random() * 10 + 10) + "px";
    heartsContainer.appendChild(span);
}

window.setMoodTheme = setMoodTheme;

moodBtn.addEventListener("click", () => {
    moodPopup.classList.toggle("hidden");
});

moodPopup.querySelectorAll("button[data-theme]").forEach((button) => {
    button.addEventListener("click", () => {
        const theme = button.dataset.theme;
        if (theme) {
            setMoodTheme(theme);
        }
    });
});

document.addEventListener("click", (event) => {
    if (!moodPopup.contains(event.target) && !moodBtn.contains(event.target)) {
        moodPopup.classList.add("hidden");
    }
});

backBtn.addEventListener("click", () => {
    navigateTo("dashboard");
});

function setPartnerInfo(partner) {
    const displayName = typeof partner === "string" ? partner : partner?.name || "Your Person";
    if (partnerNameEl) {
        partnerNameEl.innerText = displayName;
    }
    if (partnerStatusEl) {
        partnerStatusEl.innerText = "Connected ❤️";
    }
    if (partnerDpEl) {
        if (typeof partner === "object" && partner?.profile_pic) {
            partnerDpEl.src = partner.profile_pic;
        } else {
            partnerDpEl.src = getPartnerAvatar(displayName);
        }
    }
}

function getPartnerAvatar(name) {
    const initial = name?.trim()?.charAt(0).toUpperCase() || "A";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="40" fill="#ff4d6d"/><text x="50%" y="55%" font-size="36" text-anchor="middle" fill="#fff" font-family="Segoe UI, sans-serif" dy=".1em">${initial}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function parseSqlDatetime(value) {
    if (!value) return null;
    const iso = value.replace(" ", "T");
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
}

async function fetchPairStatus() {
    if (!userId) return;

    try {
        const res = await fetch(buildApiUrl(`/api/user/profile/${userId}`));
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();

        if (!data.isConnected) {
            showToast("No active connection found. Please connect from dashboard.", "error");
            navigateTo("dashboard");
            return;
        }

        if (data.partner) {
            setPartnerInfo(data.partner);
            localStorage.setItem("partnerName", data.partner.name);
        }

        if (data.pairId) {
            pairId = data.pairId;
            localStorage.setItem("pairId", data.pairId);
            joinPairRoomIfReady();
        }

        if (data.user) {
            localStorage.setItem("userId", data.user.id);
        }
    } catch (err) {
        console.error("Pair status fetch failed", err);
        if (!pairId) {
            partnerStatusEl.innerText = "Unable to load partner";
        }
    }
}

function setMoodTheme(theme) {
    chatContainer.classList.remove(
        "theme-love",
        "theme-romantic",
        "theme-sad",
        "theme-angry",
        "theme-period"
    );
    chatContainer.classList.add(`theme-${theme}`);
    applyMoodMessageBackground(theme);
    localStorage.setItem("chatMoodTheme", theme);
    moodPopup.classList.add("hidden");
    renderMoodAnimation(theme);
}

function applyMoodMessageBackground(theme) {
    const map = {
        love: "linear-gradient(180deg, rgba(255, 241, 245, 0.9), rgba(255, 229, 236, 0.9))",
        romantic: "linear-gradient(180deg, rgba(43, 45, 66, 0.12), rgba(141, 153, 174, 0.24))",
        sad: "linear-gradient(180deg, rgba(219, 234, 254, 0.85), rgba(191, 219, 254, 0.85))",
        angry: "linear-gradient(180deg, rgba(254, 202, 202, 0.82), rgba(248, 113, 113, 0.32))",
        period: "linear-gradient(180deg, rgba(255, 228, 230, 0.9), rgba(253, 164, 175, 0.35))"
    };

    const overlayMap = {
        love: "radial-gradient(circle at 20% 20%, rgba(255, 105, 180, 0.20), transparent 35%), radial-gradient(circle at 80% 80%, rgba(255, 77, 109, 0.18), transparent 36%)",
        romantic: "linear-gradient(180deg, rgba(18, 24, 38, 0.42), rgba(58, 68, 96, 0.30)), radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.10), transparent 20%)",
        sad: "linear-gradient(180deg, rgba(116, 150, 210, 0.18), rgba(191, 219, 254, 0.22))",
        angry: "linear-gradient(180deg, rgba(255, 120, 120, 0.16), rgba(215, 38, 61, 0.20))",
        period: "linear-gradient(180deg, rgba(255, 192, 203, 0.16), rgba(253, 164, 175, 0.22))"
    };

    const blurMap = {
        love: "blur(6px)",
        romantic: "blur(8px)",
        sad: "blur(7px)",
        angry: "blur(6px)",
        period: "blur(7px)"
    };

    chatMessages.style.background = map[theme] || "";
    moodLayer.style.background = overlayMap[theme] || "transparent";
    moodLayer.style.backdropFilter = blurMap[theme] || "blur(0px)";
}

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");

uploadBtn.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file || !pairId) return;

    uploadBtn.disabled = true;
    sendStatus.textContent = "Uploading...";

    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("pairId", pairId);
        formData.append("senderId", userId);

        const response = await fetch(buildApiUrl("/api/messages/media"), {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed with ${response.status}`);
        }

        await loadMessages();
        sendStatus.textContent = "";
    } catch (err) {
        console.error("Media upload failed", err);
        sendStatus.textContent = "Upload failed";
    } finally {
        uploadBtn.disabled = false;
        fileInput.value = "";
        setTimeout(() => {
            sendStatus.textContent = "";
        }, 2000);
    }
});

function renderMoodAnimation(theme) {
    moodLayer.innerHTML = "";
    const moodMap = {
        love: ["❤️", "💕", "💗"],
        romantic: ["🌙", "✨", "⭐"],
        sad: ["🌧", "💧", "☁️"],
        angry: ["⚡", "🔥", "💥"],
        period: ["🌸", "🩷", "✨"]
    };

    const symbols = moodMap[theme] || ["✨"];
    const particleCount = theme === "romantic" ? 26 : 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("span");
        particle.classList.add("mood-particle");
        particle.innerHTML = symbols[Math.floor(Math.random() * symbols.length)];
        particle.style.left = Math.random() * 100 + "%";
        particle.style.top = "calc(100% + 20px)";
        particle.style.fontSize = (Math.random() * 10 + 14) + "px";
        particle.style.animationDuration = (Math.random() * 6 + 7) + "s";
        particle.style.animationDelay = (Math.random() * 3) + "s";
        moodLayer.appendChild(particle);
    }
}

function scrollChatToBottom() {
    requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return entities[character] || character;
    });
}

function getMediaKind(fileName = "") {
    const normalized = String(fileName).toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(normalized)) return "image";
    if (/\.(mp4|webm|mov|m4v|ogg)$/i.test(normalized)) return "video";
    if (/\.(mp3|wav|m4a|aac|flac|oga)$/i.test(normalized)) return "audio";
    return "file";
}

function renderMediaContent(fileName) {
    const safeFileName = escapeHtml(fileName || "attachment");
    const mediaUrl = buildUploadUrl(fileName);
    const safeMediaUrl = escapeHtml(mediaUrl);
    const mediaKind = getMediaKind(fileName);

    if (mediaKind === "image") {
        return `<img src="${safeMediaUrl}" class="chat-img" alt="Shared image">`;
    }

    if (mediaKind === "video") {
        return `<video class="chat-video" controls preload="metadata" src="${safeMediaUrl}"></video>`;
    }

    if (mediaKind === "audio") {
        return `<audio class="chat-audio" controls preload="metadata" src="${safeMediaUrl}"></audio>`;
    }

    return `<a class="chat-file" href="${safeMediaUrl}" target="_blank" rel="noopener noreferrer">Open attachment: ${safeFileName}</a>`;
}

function createMessageElement(msg) {
    const div = document.createElement("div");
    div.classList.add("message");
    const isOwn = msg.sender_id == userId;
    div.classList.add(isOwn ? "sent" : "received");

    const deliverAt = parseSqlDatetime(msg.deliver_at);
    const lockedUntil = parseSqlDatetime(msg.locked_until);
    const now = new Date();
    const isScheduled = isOwn && deliverAt && now < deliverAt;
    const isLocked = !isScheduled && lockedUntil && now < lockedUntil;

    const actualContent = msg.media_url
        ? renderMediaContent(msg.media_url)
        : `<span>${escapeHtml(msg.message || "")}</span>`;

    const tickMarkup = isOwn
        ? isScheduled
            ? "⏳ Scheduled"
            : getTick(msg.status)
        : "";
    const statusTick = tickMarkup ? `<small class="tick">${tickMarkup}</small>` : "";
    const reactionHtml = msg.reaction ? `<div class="reaction">${msg.reaction}</div>` : "";

    if (isScheduled) {
        div.innerHTML = `
            <div class="msg-content" data-id="${msg.id}">
                <span>${escapeHtml(msg.message || "")} ⏳ Scheduled</span>
                ${statusTick}
            </div>
            ${reactionHtml}
        `;
        return div;
    }

    if (isLocked) {
        const placeholder = `<span class="locked-msg">🔒 Locked Message</span>`;
        const realInnerHTML = `
            <div class="msg-content" data-id="${msg.id}">
                ${actualContent}
                ${statusTick}
            </div>
            ${reactionHtml}
        `;

        div.dataset.unlock = lockedUntil.toISOString();
        div.dataset.text = realInnerHTML;
        div.innerHTML = `
            <div class="msg-content locked-placeholder" data-id="${msg.id}">
                ${placeholder}
                ${statusTick}
            </div>
            ${reactionHtml}
        `;

        const lockedElement = div.querySelector(".msg-content");
        if (lockedElement) {
            lockedElement.addEventListener("click", () => {
                const seconds = Math.max(0, Math.ceil((lockedUntil.getTime() - new Date().getTime()) / 1000));
                showToast(`Unlocks in ${seconds} seconds`, "info");
            });
        }

        return div;
    }

    div.innerHTML = `
        <div class="msg-content" data-id="${msg.id}">
            ${actualContent}
            ${statusTick}
        </div>
        ${reactionHtml}
    `;
    return div;
}

async function loadMessages() {
    if (!pairId) return;
    try {
        const res = await fetch(buildApiUrl(`/api/messages/${pairId}?userId=${encodeURIComponent(userId)}`));
        if (!res.ok) {
            throw new Error(`Failed to load messages: ${res.status}`);
        }
        const data = await res.json();
        chatMessages.innerHTML = "";
        const scheduledMsg = data.find(msg => msg.sender_id == userId && msg.is_delayed == 1);
        const visibleMessages = data.filter(msg => msg.sender_id == userId || msg.is_delayed == 0);

        visibleMessages.forEach(msg => {
            chatMessages.appendChild(createMessageElement(msg));
        });

        updateScheduleStateFromMessages(scheduledMsg);
        scrollChatToBottom();
    } catch (err) {
        console.error(err);
    }
}

async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    sendBtn.disabled = true;
    sendStatus.textContent = "Sending...";

    try {
        const response = await fetch(buildApiUrl("/api/messages/send"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pairId,
                senderId: userId,
                message: text
            })
        });

        if (!response.ok) {
            throw new Error(`Send failed with ${response.status}`);
        }

        chatMessages.appendChild(createMessageElement({
            message: text,
            sender_id: userId,
            status: "sent"
        }));

        scrollChatToBottom();
        input.value = "";
        sendStatus.textContent = "";
    } catch (err) {
        console.error("Message send failed", err);
        sendStatus.textContent = "Send failed";
    } finally {
        sendBtn.disabled = false;
    }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

socket.on("connect", () => {
    joinPairRoomIfReady();
});

socket.on("receiveMessage", async (data) => {
    const senderId = data.senderId ?? data.sender_id;
    if (senderId == userId) {
        return;
    }

    const messageData = {
        ...data,
        sender_id: senderId,
        senderId: senderId,
        status: data.status || "delivered"
    };

    chatMessages.appendChild(createMessageElement(messageData));
    scrollChatToBottom();
    await acknowledgeReceived();
    await loadMessages();
});

async function acknowledgeReceived() {
    if (!pairId || !userId) return;

    try {
        await fetch(buildApiUrl("/api/messages/delivered"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pairId, userId })
        });
        socket.emit("messageDelivered", pairId);

        await fetch(buildApiUrl("/api/messages/seen"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pairId, userId })
        });
        socket.emit("messageSeen", pairId);
    } catch (err) {
        console.error("Acknowledge received failed", err);
    }
}

async function initChatPage() {
    const savedTheme = localStorage.getItem("chatMoodTheme");
    if (savedTheme) {
        setMoodTheme(savedTheme);
    }

    const storedPartnerName = localStorage.getItem("partnerName");
    if (storedPartnerName) {
        setPartnerInfo(storedPartnerName);
    }

    await fetchPairStatus();

    if (pairId) {
        await loadMessages();
        await acknowledgeReceived();
    }
}

const typingText = document.getElementById("typingText");
const partnerStatusText = document.getElementById("partnerStatusText");

socket.on("showTyping", () => {
    typingText.style.display = "block";
    statusText.style.display = "none";
    if (partnerStatusText) {
        partnerStatusText.style.display = "none";
    }
});

socket.on("hideTyping", () => {
    typingText.style.display = "none";
    statusText.style.display = "block";
    if (partnerStatusText) {
        partnerStatusText.style.display = "block";
    }
});

socket.on("receiveMedia", async (data) => {
    if (data.senderId == userId) {
        return;
    }

    await acknowledgeReceived();
    await loadMessages();
});

socket.on("scheduledMessageSent", ({ senderId, messageId }) => {
    if (+senderId !== +userId) return;
    if (!scheduledMessage || +scheduledMessage.id !== +messageId) return;

    flashScheduleButtonSuccess();
});

window.addEventListener("load", initChatPage);

socket.on("updateDelivered", loadMessages);
socket.on("updateSeen", loadMessages);

window.addEventListener("pageshow", (event) => {
    if (event.persisted || document.visibilityState === "visible") {
        if (pairId) {
            loadMessages();
            acknowledgeReceived();
        }
        joinPairRoomIfReady();
    }
});

function getTick(status) {
    if (status === "sent") return "✓";
    if (status === "delivered") return "✓✓";
    if (status === "seen") return "✓✓💙";
}

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("chat-img")) {
        preview.classList.remove("hidden");
        previewImg.src = e.target.src;
        selectedImageUrl = e.target.src;
    } else if (e.target.id === "imagePreview") {
        preview.classList.add("hidden");
    } else if (e.target.id === "addToVaultBtn") {
        preview.classList.add("hidden");
        addToVaultModal.classList.remove("hidden");
    }
});

const reactionBox = document.getElementById("reactionBox");

let selectedMessageId = null;

function hideReactionBox() {
    selectedMessageId = null;
    reactionBox.classList.add("hidden");
}

document.addEventListener("click", (e) => {
    if (reactionBox.contains(e.target)) {
        return;
    }

    const msg = e.target.closest(".msg-content");

    if (msg && msg.dataset.id) {
        const isSameMessage = selectedMessageId === msg.dataset.id && !reactionBox.classList.contains("hidden");
        if (isSameMessage) {
            hideReactionBox();
            return;
        }

        selectedMessageId = msg.dataset.id;

        reactionBox.style.top = e.pageY + "px";
        reactionBox.style.left = e.pageX + "px";

        reactionBox.classList.remove("hidden");
    } else {
        hideReactionBox();
    }
});

reactionBox.addEventListener("click", async (e) => {
    const emojiTarget = e.target.closest("span");
    const emoji = emojiTarget?.innerText;
    if (!emoji || !selectedMessageId) return;

    const messageId = selectedMessageId;
    hideReactionBox();

    const msg = document.querySelector(`[data-id="${messageId}"]`);
    const currentReaction = msg?.parentElement?.querySelector(".reaction")?.innerText || null;
    const reaction = currentReaction === emoji ? null : emoji;

    const response = await fetch(buildApiUrl("/api/messages/react"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messageId,
            reaction
        })
    });

    if (response.ok) {
        updateMessageReaction(messageId, reaction);
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        hideReactionBox();
    }
});

// MODAL CLOSE LOGIC
const modalCloseButtons = document.querySelectorAll("[data-close]");
modalCloseButtons.forEach(button => {
    button.addEventListener("click", (event) => {
        const modal = event.target.closest(".modal");
        if (modal) closeModal(modal);
    });
});

// Close modal when clicking outside
document.addEventListener("click", (event) => {
    document.querySelectorAll(".modal:not(.hidden)").forEach(modal => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
});

function closeModal(modal) {
    modal.classList.add("hidden");
}

function extractUploadFileName(url) {
    if (!url) return "";
    const marker = "/uploads/";
    const index = url.indexOf(marker);
    if (index === -1) return "";
    return url.slice(index + marker.length);
}

// SAVE TO VAULT
saveToVaultBtn.onclick = async () => {
    const date = vaultMemoryDate.value;
    const title = vaultMemoryTitle.value;
    const desc = vaultMemoryDesc.value;

    if (!date || !title || !desc) {
        showToast("Please fill all fields");
        return;
    }
    if (!pairId) {
        showToast("Pair not connected", "error");
        return;
    }
    const fileName = extractUploadFileName(selectedImageUrl);
    if (!fileName) {
        showToast("Please select an uploaded image", "error");
        return;
    }

    const formData = new FormData();
    formData.append("pairId", pairId);
    formData.append("type", "image");
    formData.append("title", title);
    formData.append("description", desc);
    formData.append("memory_date", date);
    formData.append("file_url", fileName);

    const res = await fetch(buildApiUrl("/api/vault"), {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
    });

    if (res.ok) {
        showToast("Added to vault!");
        addToVaultModal.classList.add("hidden");
        vaultMemoryDate.value = "";
        vaultMemoryTitle.value = "";
        vaultMemoryDesc.value = "";
    } else {
        showToast("Failed to add to vault");
    }
};

function updateMessageReaction(messageId, reaction) {
    const msg = document.querySelector(`[data-id="${messageId}"]`);
    if (!msg) return;
    const container = msg.parentElement;
    const reactionDiv = container.querySelector(".reaction");

    if (!reaction && reactionDiv) {
        reactionDiv.remove();
        return;
    }

    if (reactionDiv) {
        reactionDiv.innerText = reaction;
        return;
    }

    const newReactionDiv = document.createElement("div");
    newReactionDiv.classList.add("reaction");
    newReactionDiv.innerText = reaction;
    container.appendChild(newReactionDiv);
}

socket.on("reactionUpdated", ({ messageId, reaction }) => {
    updateMessageReaction(messageId, reaction);
});

let scheduledMessage = null;
let isEditingSchedule = false;

const delayBtn = document.getElementById("delayBtn");
const scheduleBox = document.getElementById("scheduleBox");
const scheduleLabel = document.getElementById("scheduleLabel");
const scheduleMessageInput = document.getElementById("scheduleMessageInput");
const scheduleSummary = document.getElementById("scheduleSummary");
const confirmBtn = document.getElementById("confirmSchedule");
const editBtn = document.getElementById("editSchedule");
const cancelBtn = document.getElementById("cancelSchedule");
const scheduleInput = document.getElementById("scheduleTime");
const scheduleFeedback = document.getElementById("scheduleFeedback");

function updateScheduleButton(state) {
    delayBtn.classList.remove("scheduled", "sent");
    if (state === "scheduled") {
        delayBtn.innerText = "Scheduled";
        delayBtn.classList.add("scheduled");
        return;
    }
    if (state === "sent") {
        delayBtn.innerText = "Sent";
        delayBtn.classList.add("sent");
        setTimeout(() => {
            resetScheduleState();
        }, 1500);
        return;
    }

    delayBtn.innerText = "⏱";
}

function formatDatetimeLocal(value) {
    if (!value) return "";
    const date = new Date(value.replace(" ", "T") + "Z");
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function localDatetimeToUtcMysql(value) {
    if (!value) return null;
    const normalized = value.includes("T") && !value.includes(":")
        ? value.replace("T", " ")
        : value;
    const parseValue = normalized.endsWith(":00") ? normalized : `${normalized}:00`;
    const date = new Date(parseValue);
    if (Number.isNaN(date.getTime())) {
        console.error("Invalid schedule datetime value", { value, normalized, parseValue });
        return null;
    }
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:00`;
}

function resetScheduleState() {
    scheduledMessage = null;
    isEditingSchedule = false;
    scheduleMessageInput.value = "";
    scheduleInput.value = "";
    scheduleSummary.classList.add("hidden");
    scheduleMessageInput.classList.remove("hidden");
    scheduleInput.classList.remove("hidden");
    confirmBtn.classList.remove("hidden");
    editBtn.classList.add("hidden");
    scheduleLabel.textContent = "Please draft a message for me and suggest a time to send it later.";
    scheduleFeedback.textContent = "";
    updateScheduleButton();
}

function showScheduledPopup() {
    scheduleSummary.classList.remove("hidden");
    scheduleMessageInput.classList.add("hidden");
    scheduleInput.classList.add("hidden");
    confirmBtn.classList.add("hidden");
    editBtn.classList.remove("hidden");
    scheduleFeedback.textContent = "";
    if (scheduledMessage) {
        scheduleSummary.innerText = `Scheduled message: "${scheduledMessage.message}"\nSend time: ${scheduledMessage.deliverAt}`;
    }
}

delayBtn.addEventListener("click", () => {
    scheduleFeedback.textContent = "";
    if (scheduledMessage && !isEditingSchedule) {
        showScheduledPopup();
    } else {
        scheduleSummary.classList.add("hidden");
        scheduleMessageInput.classList.remove("hidden");
        scheduleInput.classList.remove("hidden");
        confirmBtn.classList.remove("hidden");
        editBtn.classList.add("hidden");
        scheduleLabel.textContent = "Sell me something and select time so that I will send it later.";
        if (scheduledMessage) {
            scheduleMessageInput.value = scheduledMessage.message;
            scheduleInput.value = scheduledMessage.deliverAt;
        }
    }
    scheduleBox.classList.toggle("hidden");
});

async function scheduleNewMessage() {
    const text = scheduleMessageInput.value.trim();
    const selectedTime = scheduleInput.value;

    if (!text) {
        scheduleFeedback.textContent = "Please type the scheduled message.";
        return false;
    }
    if (!selectedTime) {
        scheduleFeedback.textContent = "Please select a date and time.";
        return false;
    }

    try {
        const utcDeliverAt = localDatetimeToUtcMysql(selectedTime);
        if (!utcDeliverAt) {
            scheduleFeedback.textContent = "Unable to convert schedule time. Please use a valid date/time.";
            return false;
        }

        const payload = {
            pairId,
            senderId: userId,
            message: text,
            deliverAt: utcDeliverAt
        };
        const response = await fetch(buildApiUrl("/api/messages/send"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        let data;
        try {
            data = await response.json();
        } catch (jsonErr) {
            const text = await response.text();
            console.error("Schedule request returned non-JSON response", { status: response.status, body: text });
            throw new Error(`Schedule failed with status ${response.status}`);
        }

        if (!response.ok) {
            console.error("Schedule request failed", { status: response.status, body: data });
            throw new Error(data.message || `Schedule failed with ${response.status}`);
        }

        scheduledMessage = {
            id: data.id,
            message: text,
            deliverAt: selectedTime
        };
        updateScheduleButton("scheduled");
        scheduleFeedback.textContent = "Scheduled successfully.";
        scheduleBox.classList.add("hidden");
        return true;
    } catch (err) {
        console.error("Schedule failed", err);
        scheduleFeedback.textContent = "Could not schedule the message.";
        return false;
    }
}

async function editScheduledMessage() {
    if (!scheduledMessage) return false;
    const text = scheduleMessageInput.value.trim();
    const selectedTime = scheduleInput.value;

    if (!text) {
        scheduleFeedback.textContent = "Please type the scheduled message.";
        return false;
    }
    if (!selectedTime) {
        scheduleFeedback.textContent = "Please select a date and time.";
        return false;
    }

    try {
        const utcDeliverAt = localDatetimeToUtcMysql(selectedTime);
        if (!utcDeliverAt) {
            scheduleFeedback.textContent = "Unable to convert schedule time. Please use a valid date/time.";
            return false;
        }

        const payload = {
            messageId: scheduledMessage.id,
            senderId: userId,
            message: text,
            deliverAt: utcDeliverAt
        };
        const response = await fetch(buildApiUrl("/api/messages/schedule/edit"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        let data;
        try {
            data = await response.json();
        } catch (jsonErr) {
            const text = await response.text();
            console.error("Edit schedule request returned non-JSON response", { status: response.status, body: text });
            throw new Error(`Update failed with status ${response.status}`);
        }

        if (!response.ok) {
            console.error("Edit schedule request failed", { status: response.status, body: data });
            throw new Error(data.message || `Update failed with ${response.status}`);
        }

        scheduledMessage.message = text;
        scheduledMessage.deliverAt = selectedTime;
        scheduleFeedback.textContent = "Scheduled message updated.";
        scheduleBox.classList.add("hidden");
        return true;
    } catch (err) {
        console.error("Edit schedule failed", err);
        scheduleFeedback.textContent = "Could not update scheduled message.";
        return false;
    }
}

async function cancelScheduledMessage() {
    if (!scheduledMessage) {
        scheduleBox.classList.add("hidden");
        return;
    }

    try {
        const response = await fetch(buildApiUrl("/api/messages/schedule/cancel"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messageId: scheduledMessage.id,
                senderId: userId
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || `Cancel failed with ${response.status}`);
        }

        resetScheduleState();
        scheduleBox.classList.add("hidden");
        await loadMessages();
    } catch (err) {
        console.error("Cancel schedule failed", err);
        scheduleFeedback.textContent = "Could not cancel scheduled message.";
    }
}

confirmBtn.addEventListener("click", async () => {
    if (scheduledMessage && isEditingSchedule) {
        await editScheduledMessage();
        isEditingSchedule = false;
        return;
    }

    if (!scheduledMessage) {
        await scheduleNewMessage();
    }
});

editBtn.addEventListener("click", () => {
    if (!scheduledMessage) return;
    isEditingSchedule = true;
    scheduleSummary.classList.add("hidden");
    scheduleMessageInput.classList.remove("hidden");
    scheduleInput.classList.remove("hidden");
    confirmBtn.classList.remove("hidden");
    editBtn.classList.add("hidden");
    scheduleLabel.textContent = "Edit your scheduled message and time.";
    scheduleMessageInput.value = scheduledMessage.message;
    scheduleInput.value = scheduledMessage.deliverAt;
    scheduleFeedback.textContent = "";
});

cancelBtn.addEventListener("click", cancelScheduledMessage);

function flashScheduleButtonSuccess() {
    updateScheduleButton("sent");
}

function updateScheduleStateFromMessages(scheduledMsg) {
    if (scheduledMsg) {
        scheduledMessage = {
            id: scheduledMsg.id,
            message: scheduledMsg.message,
            deliverAt: formatDatetimeLocal(scheduledMsg.deliver_at)
        };
        updateScheduleButton("scheduled");
        return;
    }

    if (scheduledMessage) {
        flashScheduleButtonSuccess();
    } else {
        resetScheduleState();
    }
}

const momentBtn = document.getElementById("momentBtn");
const overlay = document.getElementById("momentOverlay");

let tapCount = 0;
let holdTimer;
let holdTriggered = false;

function hideMomentOverlay() {
    overlay.classList.add("hidden");
    overlay.innerHTML = "";
    tapCount = 0;
    holdTriggered = false;
    clearTimeout(holdTimer);
}

momentBtn.addEventListener("click", () => {
    overlay.classList.remove("hidden");
    overlay.innerHTML = `
        <div class="moment-card">
            <button class="moment-close-btn" type="button">✖</button>
            <div class="moment-content">Tap once for here, hold for stay, or tap 3 times for urgent.</div>
        </div>
    `;
});

overlay.addEventListener("mousedown", (event) => {
    if (event.target.closest(".moment-close-btn")) return;
    holdTriggered = false;
    holdTimer = setTimeout(() => {
        holdTriggered = true;
        sendMoment("stay");
    }, 2000);
});

overlay.addEventListener("mouseup", () => {
    clearTimeout(holdTimer);
});

overlay.addEventListener("click", (event) => {
    if (event.target.closest(".moment-close-btn")) {
        hideMomentOverlay();
        return;
    }

    if (!event.target.closest(".moment-card")) return;
    if (holdTriggered) {
        holdTriggered = false;
        return;
    }

    tapCount++;
    setTimeout(() => {
        if (tapCount === 1) sendMoment("here");
        else if (tapCount >= 3) sendMoment("urgent");
        tapCount = 0;
    }, 300);
});

function showMoment(type) {
    overlay.classList.remove("hidden");
    let html = "";

    if (type === "here") {
        html = `
            <div class="moment-wrapper">
                <div class="heart">❤️</div>
                <p>I'm here</p>
            </div>
        `;
    }

    if (type === "miss") {
        html = `
            <div class="moment-wrapper">
                <div class="heartbeat">💓</div>
                <p>I miss you</p>
            </div>
        `;
    }

    if (type === "urgent") {
        html = `
            <div class="moment-wrapper">
                <div class="shake">⚡</div>
                <p>Talk to me</p>
            </div>
        `;
    }

    if (type === "stay") {
        html = `
            <div class="moment-wrapper">
                <div class="glow"></div>
                <p>Stay with me</p>
            </div>
        `;
    }

    overlay.innerHTML = `
        <div class="moment-card">
            <button class="moment-close-btn" type="button">✖</button>
            <div class="moment-content">${html}</div>
        </div>
    `;

    setTimeout(() => {
        hideMomentOverlay();
    }, 2000);
}

socket.on("receiveMoment", (data) => {
    showMoment(data.type);
});

function sendMoment(type) {

    socket.emit("sendMoment", {
        pairId,
        senderId: userId,
        type
    });

    showMoment(type); // show locally also
}

setInterval(() => {

    const messages = document.querySelectorAll(".message");

    messages.forEach(msgEl => {

        const unlockTime = msgEl.dataset.unlock;

        if (unlockTime && new Date(unlockTime) <= new Date()) {
            msgEl.innerHTML = msgEl.dataset.text;
        }

    });

}, 3000);

