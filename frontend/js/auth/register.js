const { buildApiUrl, navigateTo } = window.APP_CONFIG;

document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("btn");

    const fields = {
        username: document.getElementById("username"),
        email: document.getElementById("email"),
        phone: document.getElementById("phone"),
        password: document.getElementById("password")
    };

    const rules = {
        length: document.getElementById("rule-length"),
        symbol: document.getElementById("rule-symbol"),
        number: document.getElementById("rule-number")
    };

    function validate(key) {
        const val = fields[key].value.trim();
        let valid = false;

        switch(key) {
            case "username": valid = val.length >= 4; break;
            case "email": valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); break;
            case "phone": valid = /^\d{10}$/.test(val); break;
            case "password":
                const hasLength = val.length >= 8;
                const hasSymbol = /[!@#$%^&*]/.test(val);
                const hasNumbers = (val.match(/\d/g) || []).length >= 2;

                rules.length.classList.toggle("valid", hasLength);
                rules.symbol.classList.toggle("valid", hasSymbol);
                rules.number.classList.toggle("valid", hasNumbers);

                valid = hasLength && hasSymbol && hasNumbers;
                break;
        }

        fields[key].classList.toggle("valid", valid);
        fields[key].classList.toggle("invalid", !valid && val !== "");

        return valid;
    }

    function check() {
        const all =
            validate("username") &&
            validate("email") &&
            validate("phone") &&
            validate("password");

        btn.disabled = !all;
        btn.classList.toggle("active", all);
    }

    Object.keys(fields).forEach(key => {
        fields[key].addEventListener("input", check);
        fields[key].addEventListener("blur", () => validate(key));
    });

    /* PASSWORD TOGGLE */
    document.getElementById("eye").addEventListener("click", () => {
        const pass = fields.password;
        pass.type = pass.type === "password" ? "text" : "password";
    });

    /* HEART GENERATION */
    const heartsContainer = document.querySelector(".hearts");
    for (let i = 0; i < 20; i++) {
        const heart = document.createElement("span");
        heart.innerText = "❤️";

        heart.style.left = Math.random() * 100 + "vw";
        heart.style.top = Math.random() * 100 + "vh";
        heart.style.animationDuration = (5 + Math.random() * 5) + "s";

        heartsContainer.appendChild(heart);
    }

    /* SUBMIT */
    document.getElementById("registerForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        if (btn.disabled) return;

        btn.innerText = "Creating your space...";
        btn.classList.add("success");

        const userData = {
            username: fields.username.value.trim(),
            email: fields.email.value.trim(),
            phone: fields.phone.value.trim(),
            password: fields.password.value,
            gender: document.getElementById("gender").value
        };

        try {
            const response = await fetch(buildApiUrl("/api/auth/register"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok || data.status !== "success") {
                return showError(data.message || "Something went wrong");
            }

            btn.innerText = "❤️ Space Created";
            btn.classList.remove("success");
            btn.classList.add("success-done");

            setTimeout(() => {
                navigateTo("login");
            }, 1200);

        } catch (error) {
            showError("Server not reachable");
        }
    });

    function showError(message) {
        btn.innerText = "Create Account";
        btn.classList.remove("success");

        alert(message);
    }

});

