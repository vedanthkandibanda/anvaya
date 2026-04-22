const { navigateTo } = window.APP_CONFIG;

function goBack() {
    navigateTo("login");
}

async function sendEmail() {
    const email = document.getElementById("email").value.trim().toLowerCase();

    if (!email) {
        alert("Enter email");
        return;
    }

    localStorage.setItem("resetEmail", email);
    navigateTo("resetPassword");
}
