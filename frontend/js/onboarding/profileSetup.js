const { buildApiUrl } = window.APP_CONFIG;

const userId = localStorage.getItem("userId");

if (!userId) {
    window.location.href = "../auth/login.html";
}

const profileForm = document.getElementById("profileForm");
const dpInput = document.getElementById("dpInput");
const dpCircle = document.querySelector(".dp-circle");

function showToast(message, type = "error") {
    let container = document.getElementById("onboardingToastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "onboardingToastContainer";
        container.style.position = "fixed";
        container.style.top = "16px";
        container.style.right = "16px";
        container.style.zIndex = "9999";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.innerText = message;
    toast.style.marginBottom = "10px";
    toast.style.padding = "10px 14px";
    toast.style.borderRadius = "10px";
    toast.style.color = "#fff";
    toast.style.background = type === "success" ? "#2e7d32" : "#c62828";
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2400);
}

profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const bio = document.getElementById("bio").value.trim();
    const age = document.getElementById("age").value;
    const interests = document.getElementById("interests").value.trim();
    const love_language = document.getElementById("loveLanguage").value;
    const mood_type = document.getElementById("moodType").value;
    const profilePic = dpInput.files[0];

    try {
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("bio", bio);
        formData.append("age", age);
        formData.append("interests", interests);
        formData.append("love_language", love_language);
        formData.append("mood_type", mood_type);
        if (profilePic) {
            formData.append("profilePic", profilePic);
        }

        const res = await fetch("https://anvaya-production.up.railway.app/api/user/profile-setup", {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (res.ok && data.status === "success") {
            window.location.href = "../dashboard.html";
            return;
        }

        showToast(data.message || "Unable to save profile");

    } catch (err) {
        showToast("Server error");
    }
});

function skipProfile() {
    if (!userId) {
        window.location.href = "../auth/login.html";
        return;
    }

    fetch("https://anvaya-production.up.railway.app/api/user/profile-setup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userId,
            bio: "",
            age: "",
            interests: "",
            love_language: "",
            mood_type: ""
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                window.location.href = "../dashboard.html";
            } else {
                showToast(data.message || "Unable to skip profile setup");
            }
        })
        .catch(() => showToast("Server error"));
}

/* DP PREVIEW */
dpInput.addEventListener("change", () => {
    const file = dpInput.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            dpCircle.innerHTML = "";

            const img = document.createElement("img");
            img.src = e.target.result;
            img.classList.add("dp-preview");

            dpCircle.appendChild(img);
        };

        reader.readAsDataURL(file);
    }
});

