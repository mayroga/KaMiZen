// Mensajes motivadores KaMiZen
function autoBotChat() {
    const msgs = [
        "🔥 Tu mente se entrena con KaMiZen",
        "💡 Cada elección suma en KaMiZen",
        "🏆 Siente tu progreso diario",
        "🌱 Disfruta el bienestar que creas",
        "⚡ Cada reto KaMiZen te fortalece",
        "💎 Aprende algo nuevo hoy con KaMiZen"
    ];

    setInterval(() => {
        const chatBox = document.getElementById("chatBox");
        if (!chatBox) return;
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        chatBox.innerHTML += `<div class="simulated"><strong>AURA_BOT KaMiZen:</strong> ${msg}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 15000); // cada 15s
}

// Highlight temporal de feedback (opcional)
function highlightFeedback() {
    const fb = document.getElementById("feedback");
    if (!fb) return;
    fb.style.color = "#ffcc00";
    setTimeout(() => { fb.style.color = "#00ffcc"; }, 500);
}

// Inicializar bot
document.addEventListener("DOMContentLoaded", () => {
    autoBotChat();
});
