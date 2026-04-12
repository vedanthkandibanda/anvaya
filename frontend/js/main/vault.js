// 🔐 AUTH GUARD (ADD AT TOP)
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../auth/login.html";
}

const modal = document.getElementById("vaultModal");
const uploadBtn = document.getElementById("uploadBtn");
const saveBtn = document.getElementById("saveMemory");
const timeline = document.getElementById("vaultTimeline");
const emptyState = document.getElementById("emptyState");
const editModal = document.getElementById("editVaultModal");
const updateBtn = document.getElementById("updateMemory");
const toastContainer = document.getElementById("toastContainer");

let editingMemoryId = null;

uploadBtn.onclick = () => modal.classList.remove("hidden");

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

    // Close any open action dropdown if clicked outside
    if (!event.target.closest(".memory-top")) {
        document.querySelectorAll(".memory-actions.visible").forEach(box => {
            box.classList.remove("visible");
        });
    }
});

function closeModal(modal) {
    modal.classList.add("hidden");
}

function showToast(message, type = "success") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("visible"));
    setTimeout(() => {
        toast.classList.remove("visible");
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, 2200);
}

function toUploadUrl(value) {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
        return value;
    }
    return `http://localhost:5000/uploads/${value}`;
}

function goBack() {
    window.location.href = "dashboard.html";
}

/* ❤️ HEARTS */
const hearts = document.getElementById("hearts");
for (let i = 0; i < 20; i++) {
    const span = document.createElement("span");
    span.innerHTML = "❤️";
    span.style.left = Math.random() * 100 + "vw";
    span.style.animationDuration = (Math.random() * 6 + 5) + "s";
    hearts.appendChild(span);
}

/* ADD MEMORY UI ONLY (backend next step) */
saveBtn.onclick = async () => {

    const pairId = localStorage.getItem("pairId");

    const formData = new FormData();

    formData.append("pairId", pairId);
    formData.append("type", document.getElementById("memoryType").value);
    formData.append("title", document.getElementById("memoryTitle").value);
    formData.append("description", document.getElementById("memoryDesc").value);
    formData.append("memory_date", document.getElementById("memoryDate").value);

    const file = document.getElementById("memoryFile").files[0];
    if (file) formData.append("file", file);

    const res = await fetch("http://localhost:5000/api/vault", {
        method: "POST",
        body: formData
    });

    if (!res.ok) {
        showToast("Unable to save memory", "error");
        return;
    }

    modal.classList.add("hidden");
    showToast("Memory saved", "success");
    loadVault();
};

function openEditModal(memory) {
    editingMemoryId = memory.id;
    document.getElementById("editMemoryType").value = memory.type || "text";
    document.getElementById("editMemoryDate").value = (memory.memory_date || "").toString().slice(0, 10);
    document.getElementById("editMemoryTitle").value = memory.title || "";
    document.getElementById("editMemoryDesc").value = memory.description || "";
    document.getElementById("editMemoryFile").value = "";
    editModal.classList.remove("hidden");
}

updateBtn.onclick = async () => {
    if (!editingMemoryId) return;

    const formData = new FormData();
    formData.append("type", document.getElementById("editMemoryType").value);
    formData.append("memory_date", document.getElementById("editMemoryDate").value);
    formData.append("title", document.getElementById("editMemoryTitle").value);
    formData.append("description", document.getElementById("editMemoryDesc").value);

    const file = document.getElementById("editMemoryFile").files[0];
    if (file) {
        formData.append("file", file);
    }

    const res = await fetch(`http://localhost:5000/api/vault/${editingMemoryId}`, {
        method: "PUT",
        body: formData
    });

    if (!res.ok) {
        showToast("Unable to update memory", "error");
        return;
    }

    closeModal(editModal);
    showToast("Memory updated", "success");
    editingMemoryId = null;
    loadVault();
};

async function loadVault() {

    const pairId = localStorage.getItem("pairId");

    const res = await fetch(`http://localhost:5000/api/vault/${pairId}`);
    const data = await res.json();

    timeline.innerHTML = "";

    if (data.length === 0) {
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";

    data.forEach(m => {

        const card = document.createElement("div");
        card.classList.add("memory-card");

        let media = "";

        if (m.type === "image") {
            media = `<img src="${toUploadUrl(m.file_url)}">`;
        }

        if (m.type === "video") {
            media = `<video controls src="${toUploadUrl(m.file_url)}"></video>`;
        }

        card.innerHTML = `
            <div class="memory-top">
                <strong>${m.memory_date}</strong>
                <span class="edit-icon">⋮</span>
                <div class="memory-actions">
                    <button class="memory-action-btn edit">✏️ Edit</button>
                    <button class="memory-action-btn delete">🗑️ Delete</button>
                </div>
            </div>

            ${media}
            <p>${m.title}</p>
            <small>${m.description}</small>
        `;

        const actionBox = card.querySelector(".memory-actions");
        card.querySelector(".edit-icon").onclick = () => {
            actionBox.classList.toggle("visible");
        };

        card.querySelector(".memory-action-btn.delete").onclick = async () => {
            const res = await fetch(`http://localhost:5000/api/vault/${m.id}`, {
                method: "DELETE"
            });
            if (!res.ok) {
                showToast("Unable to delete memory", "error");
                return;
            }
            showToast("Memory deleted permanently", "success");
            loadVault();
        };

        card.querySelector(".memory-action-btn.edit").onclick = () => {
            openEditModal(m);
            actionBox.classList.remove("visible");
        };

        timeline.appendChild(card);
    });
}

loadVault();