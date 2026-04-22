const { buildApiUrl, navigateTo } = window.APP_CONFIG;

document.addEventListener("DOMContentLoaded", () => {

    const loginId = document.getElementById("loginId");
    const password = document.getElementById("password");
    const btn = document.getElementById("loginBtn");

    const loginIdError = document.getElementById("loginIdError");
    const passwordError = document.getElementById("passwordError");

    /* ---------------- VALIDATION ---------------- */
    function validate() {
        let valid = true;

        if (loginId.value.trim() === "") {
            valid = false;
            loginId.classList.add("invalid");
            loginIdError.innerText = "Required";
        } else {
            loginId.classList.remove("invalid");
            loginId.classList.add("valid");
            loginIdError.innerText = "";
        }

        if (password.value.trim().length < 6) {
            valid = false;
            password.classList.add("invalid");
            passwordError.innerText = "Minimum 6 characters";
        } else {
            password.classList.remove("invalid");
            password.classList.add("valid");
            passwordError.innerText = "";
        }

        if (valid) {
            btn.disabled = false;
            btn.classList.add("active");
        } else {
            btn.disabled = true;
            btn.classList.remove("active");
        }
    }

    loginId.addEventListener("input", validate);
    password.addEventListener("input", validate);

    /* ---------------- PASSWORD TOGGLE ---------------- */
    const toggle = document.getElementById("togglePassword");
    toggle.addEventListener("click", () => {
        password.type = password.type === "password" ? "text" : "password";
    });

    /* ---------------- LOGIN SUBMIT ---------------- */
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        if (btn.disabled) return;

        btn.innerText = "Connecting...";
        btn.classList.add("loading");

        try {
            const response = await fetch(buildApiUrl("/api/auth/login"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    loginId: loginId.value.trim(),
                    password: password.value
                })
            });

            const data = await response.json();

            if (!response.ok || data.status !== "success") {
                return showError(data.message || "Login failed");
            }

            // STORE USER DATA
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("userId", data.user.id);

            btn.innerText = "Success ❤️";
            btn.classList.remove("loading");
            btn.classList.add("success");

            // REDIRECT BASED ON FIRST LOGIN
            setTimeout(() => {
                if (data.firstLogin) {
                    navigateTo("profileSetup");
                } else {
                    navigateTo("dashboard");
                }
            }, 400);

        } catch (error) {
            showError("Server not reachable");
        }
    });

    /* ---------------- ERROR HANDLER ---------------- */
    function showError(message) {
        password.classList.add("invalid");
        passwordError.innerText = message;

        btn.innerText = "Enter Space";
        btn.classList.remove("loading");
    }

});

