// 🔐 AUTH GUARD (ADD AT TOP)
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../auth/login.html";
}