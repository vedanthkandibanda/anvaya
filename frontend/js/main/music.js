const { apiBaseUrl, buildApiUrl, buildUploadUrl, navigateTo } = window.APP_CONFIG;

const socket = io(apiBaseUrl);

const pairId = localStorage.getItem("pairId");
const userId = localStorage.getItem("userId");

if (!userId) {
    navigateTo("login");
}

if (localStorage.getItem("onboardingRequired") === "1") {
    navigateTo("profileSetup");
}

if (!pairId) {
    alert("You are not connected yet.");
    navigateTo("dashboard");
}

const songList = document.getElementById("songList");
const emptyState = document.getElementById("emptyState");

const player = document.getElementById("audioPlayer");
const playerBox = document.getElementById("playerBox");
const joinBtn = document.getElementById("joinBtn");

socket.emit("joinRoom", { pairId, userId });

let currentSong = null;

/* 🎧 SAMPLE SONGS */
async function loadSongs() {
    try {
        const res = await fetch(buildApiUrl(`/api/music/${pairId}`));
        if (!res.ok) {
            throw new Error("Unable to load songs");
        }
        const data = await res.json();

        songList.innerHTML = "";

        if (data.length === 0) {
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";

        data.forEach(song => {
            const div = document.createElement("div");
            div.classList.add("song");

            const name = document.createElement("span");
            name.textContent = song.name || "Untitled";

            const playBtn = document.createElement("button");
            playBtn.textContent = "▶";
            playBtn.addEventListener("click", () => playSong(song.file_url));

            div.appendChild(name);
            div.appendChild(playBtn);
            songList.appendChild(div);
        });
    } catch (err) {
        console.error("Song load failed:", err);
        emptyState.style.display = "block";
    }
}

loadSongs();

async function uploadSong() {

    const file = document.getElementById("songFile").files[0];
    const name = document.getElementById("songName").value.trim();

    if (!file) {
        alert("Select a song file first");
        return;
    }

    if (!name) {
        alert("Enter song name");
        return;
    }

    if (!file.type || !file.type.startsWith("audio/")) {
        alert("Please upload a valid audio file (mp3, wav, m4a, ogg)");
        return;
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("name", name);
    formData.append("pairId", pairId);

    const res = await fetch(buildApiUrl("/api/music/upload"), {
        method: "POST",
        body: formData
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Upload failed");
        return;
    }

    alert("Uploaded 🎧");

    document.getElementById("songFile").value = "";
    document.getElementById("songName").value = "";

    loadSongs();
}

/* ▶ PLAY */
function playSong(file) {

    if (!file) {
        alert("Invalid song file");
        return;
    }

    currentSong = file;

    const url = buildUploadUrl(file);

    player.src = url;
    player.currentTime = 0;
    player.play().catch(() => {
        // Playback can be blocked without user interaction in some browsers.
    });

    document.getElementById("nowPlaying").innerText = "🎧 Playing";

    playerBox.classList.remove("hidden");

    document.getElementById("sessionText").innerText = "Playing for your partner ❤️";

    socket.emit("musicInvite", {
        pairId,
        song: file,
        time: 0
    });
}

/* 🎯 RECEIVE INVITE */
let incomingSong = null;

socket.on("musicInvite", (data) => {

    if (data.pairId !== pairId) return;

    incomingSong = data;

    document.getElementById("invitePopup").classList.remove("hidden");
});

/* 🔄 SYNC (OPTIONAL BASIC) */
socket.on("musicSync", (data) => {

    if (data.pairId !== pairId) return;

    // prevent loop
    if (Math.abs(player.currentTime - data.time) < 1) return;

    if (data.action === "play") {

        player.currentTime = data.time;
        player.play();
    }

    if (data.action === "pause") {

        player.pause();
        player.currentTime = data.time;
    }

    if (data.action === "seek") {

        player.currentTime = data.time;
    }

    if (data.action === "sync") {
        if (Math.abs(player.currentTime - data.time) > 2) {
            player.currentTime = data.time;
        }
    }
});

/* NAV */
function goBack() {
    navigateTo("dashboard");
}

player.addEventListener("play", () => {

    socket.emit("musicSync", {
        pairId,
        action: "play",
        time: player.currentTime
    });

});

player.addEventListener("pause", () => {

    socket.emit("musicSync", {
        pairId,
        action: "pause",
        time: player.currentTime
    });

});

player.addEventListener("seeked", () => {

    socket.emit("musicSync", {
        pairId,
        action: "seek",
        time: player.currentTime
    });

});

setInterval(() => {

    socket.emit("musicSync", {
        pairId,
        action: "sync",
        time: player.currentTime
    });

}, 5000);

function playCurrent() {
    player.play();
}

function pauseCurrent() {
    player.pause();
}

player.addEventListener("timeupdate", () => {

    const percent = (player.currentTime / player.duration) * 100;
    document.getElementById("progress").style.width = percent + "%";

});

function joinMusic() {

    if (!incomingSong) {
        closeInvite();
        return;
    }

    const data = incomingSong;

    const url = buildUploadUrl(data.song);

    player.src = url;
    player.currentTime = data.time;
    player.play().catch(() => {
        // Playback can be blocked without user interaction in some browsers.
    });

    playerBox.classList.remove("hidden");

    document.getElementById("sessionText").innerText = "Listening together ❤️";

    socket.emit("musicJoin", { pairId });

    closeInvite();
}

function closeInvite() {
    document.getElementById("invitePopup").classList.add("hidden");
}

