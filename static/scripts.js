// -------------------------
// KaMiZen – Landing JS
// -------------------------

const buyBtn = document.getElementById("buy-entry");
const adminBtn = document.getElementById("admin-login-btn");
const countdownEl = document.getElementById("countdown");

// -------------------------
// Contador hasta la próxima sesión diaria
// -------------------------
function updateCountdown() {
    const now = new Date();
    // Próxima sesión en cualquier momento diario (simulación 24h)
    const nextSession = new Date(now.getTime() + 60*60*1000); // +1 hora para demo
    const diff = nextSession - now;
    const min = Math.floor(diff / 1000 / 60);
    const sec = Math.floor(diff / 1000 % 60);
    countdownEl.textContent = `Próxima sesión: ${min} min ${sec} seg`;
}
setInterval(updateCountdown, 1000);

// -------------------------
// Comprar entrada $9.99
// -------------------------
buyBtn.addEventListener("click", async () => {
    try {
        const res = await fetch("/purchase", {method: "POST"});
        const data = await res.json();
        const token = data.access_token;
        localStorage.setItem("token", token);
        alert("Compra exitosa! Accediendo a sesión...");
        window.location.href = `/session?token=${token}`;
    } catch (err) {
        alert("Error al comprar entrada: " + err);
    }
});

// -------------------------
// Login Admin
// -------------------------
adminBtn.addEventListener("click", async () => {
    const username = document.getElementById("admin-username").value;
    const password = document.getElementById("admin-password").value;

    if (!username || !password) return alert("Completa usuario y contraseña");

    try {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        const res = await fetch("/admin-login", {method: "POST", body: formData});
        const data = await res.json();
        const token = data.token;
        localStorage.setItem("token", token);
        alert("Login Admin exitoso! Accediendo a sesión...");
        window.location.href = `/session?token=${token}`;
    } catch (err) {
        alert("Error login admin: " + err);
    }
});
