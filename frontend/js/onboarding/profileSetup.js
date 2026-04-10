const userId = localStorage.getItem("userId");

if (!userId) {
    window.location.href = "../auth/login.html";
}

const profileForm = document.getElementById("profileForm");
const dpInput = document.getElementById("dpInput");
const dpCircle = document.querySelector(".dp-circle");

profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const bio = document.getElementById("bio").value.trim();
    const age = document.getElementById("age").value;
    const interests = document.getElementById("interests").value.trim();
    const love_language = document.getElementById("loveLanguage").value;
    const mood_type = document.getElementById("moodType").value;

    try {
        const res = await fetch("http://localhost:5000/api/user/profile-setup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId,
                bio,
                age,
                interests,
                love_language,
                mood_type
            })
        });

        const data = await res.json();

        if (res.ok && data.status === "success") {
            window.location.href = "../dashboard.html";
            return;
        }

        alert(data.message || "Unable to save profile");

    } catch (err) {
        alert("Server error");
    }
});

function skipProfile() {
    if (!userId) {
        window.location.href = "../auth/login.html";
        return;
    }

    fetch("http://localhost:5000/api/user/profile-setup", {
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
                alert(data.message || "Unable to skip profile setup");
            }
        })
        .catch(() => alert("Server error"));
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