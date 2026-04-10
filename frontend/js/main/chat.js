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
const socket = io("http://localhost:5000");

if (!userId) {
    window.location.href = "../auth/login.html";
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

document.addEventListener("click", (event) => {
    if (!moodPopup.contains(event.target) && !moodBtn.contains(event.target)) {
        moodPopup.classList.add("hidden");
    }
});

backBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
});

function setPartnerInfo(name) {
    const displayName = name || "Your Person";
    if (partnerStatusEl) {
        partnerStatusEl.innerText = "Connected ❤️";
    }
    partnerDpEl.src = getPartnerAvatar(displayName);
}

function getPartnerAvatar(name) {
    const initial = name?.trim()?.charAt(0).toUpperCase() || "A";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="40" fill="#ff4d6d"/><text x="50%" y="55%" font-size="36" text-anchor="middle" fill="#fff" font-family="Segoe UI, sans-serif" dy=".1em">${initial}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

async function fetchPairStatus() {
    if (!userId) return;

    try {
        const res = await fetch(`http://localhost:5000/api/pair/status/${userId}`);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();

        if (!data.isConnected) {
            alert("No active connection found. Please connect from dashboard.");
            window.location.href = "dashboard.html";
            return;
        }

        if (data.partnerName) {
            setPartnerInfo(data.partnerName);
            localStorage.setItem("partnerName", data.partnerName);
        }

        if (data.pairId) {
            pairId = data.pairId;
            localStorage.setItem("pairId", data.pairId);
            joinPairRoomIfReady();
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
    localStorage.setItem("chatMoodTheme", theme);
    moodPopup.classList.add("hidden");
    renderMoodAnimation(theme);
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

        const response = await fetch("http://localhost:5000/api/messages/media", {
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
    let symbol = "❤️";
    if (theme === "romantic") symbol = "✨";
    if (theme === "sad") symbol = "🌧";
    if (theme === "angry") symbol = "⚡";
    if (theme === "period") symbol = "🌸";
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement("span");
        particle.classList.add("mood-particle");
        particle.innerHTML = symbol;
        particle.style.left = Math.random() * 100 + "vw";
        particle.style.fontSize = (Math.random() * 12 + 14) + "px";
        particle.style.animationDuration = (Math.random() * 5 + 5) + "s";
        moodLayer.appendChild(particle);
    }
}

function scrollChatToBottom() {
    requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

function createMessageElement(msg) {
    const div = document.createElement("div");
    div.classList.add("message");
    const isOwn = msg.sender_id == userId;
    div.classList.add(isOwn ? "sent" : "received");

    const content = msg.media_url
        ? `<img src="http://localhost:5000/uploads/${msg.media_url}" class="chat-img">`
        : `<span>${msg.message || ""}</span>`;

    const isScheduled = isOwn && msg.is_delayed;
    const tickMarkup = isOwn
        ? isScheduled
            ? "⏳ Scheduled"
            : getTick(msg.status)
        : "";
    const statusTick = tickMarkup ? `<small class="tick">${tickMarkup}</small>` : "";
    const reactionHtml = msg.reaction ? `<div class="reaction">${msg.reaction}</div>` : "";

    div.innerHTML = `
        <div class="msg-content" data-id="${msg.id}">
            ${content}
            ${statusTick}
        </div>
        ${reactionHtml}
    `;
    return div;
}

async function loadMessages() {
    if (!pairId) return;
    try {
        const res = await fetch(`http://localhost:5000/api/messages/${pairId}?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) {
            throw new Error(`Failed to load messages: ${res.status}`);
        }
        const data = await res.json();
        chatMessages.innerHTML = "";
        const scheduledMsg = data.find(msg => msg.sender_id == userId && msg.is_delayed == 1);
        const visibleMessages = data.filter(msg => !(msg.sender_id == userId && msg.is_delayed == 1));

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
        const response = await fetch("http://localhost:5000/api/messages/send", {
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
    if (data.senderId == userId) {
        return;
    }

    chatMessages.appendChild(createMessageElement({
        message: data.message,
        sender_id: data.senderId,
        status: "delivered"
    }));
    scrollChatToBottom();
    await acknowledgeReceived();
    await loadMessages();
});

async function acknowledgeReceived() {
    if (!pairId || !userId) return;

    try {
        await fetch("http://localhost:5000/api/messages/delivered", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pairId, userId })
        });
        socket.emit("messageDelivered", pairId);

        await fetch("http://localhost:5000/api/messages/seen", {
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
        chatContainer.classList.add(`theme-${savedTheme}`);
        renderMoodAnimation(savedTheme);
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

const preview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("chat-img")) {
        preview.classList.remove("hidden");
        previewImg.src = e.target.src;
    } else if (e.target.id === "imagePreview") {
        preview.classList.add("hidden");
    }
});

const reactionBox = document.getElementById("reactionBox");

let selectedMessageId = null;

document.addEventListener("click", (e) => {
    if (reactionBox.contains(e.target)) {
        return;
    }

    const msg = e.target.closest(".msg-content");

    if (msg && msg.dataset.id) {
        selectedMessageId = msg.dataset.id;

        reactionBox.style.top = e.pageY + "px";
        reactionBox.style.left = e.pageX + "px";

        reactionBox.classList.remove("hidden");
    } else {
        selectedMessageId = null;
        reactionBox.classList.add("hidden");
    }
});

reactionBox.addEventListener("click", async (e) => {
    const emoji = e.target.innerText;
    if (!emoji || !selectedMessageId) return;

    const msg = document.querySelector(`[data-id="${selectedMessageId}"]`);
    const currentReaction = msg?.parentElement?.querySelector(".reaction")?.innerText || null;
    const reaction = currentReaction === emoji ? null : emoji;

    const response = await fetch("http://localhost:5000/api/messages/react", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messageId: selectedMessageId,
            reaction
        })
    });

    if (response.ok) {
        updateMessageReaction(selectedMessageId, reaction);
    }

    reactionBox.classList.add("hidden");
});

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
        const response = await fetch("http://localhost:5000/api/messages/send", {
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
        const response = await fetch("http://localhost:5000/api/messages/schedule/edit", {
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
        const response = await fetch("http://localhost:5000/api/messages/schedule/cancel", {
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