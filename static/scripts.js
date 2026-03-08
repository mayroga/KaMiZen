// 1. Generar UID persistente
let uid = localStorage.getItem("aura_uid");
if (!uid) {
    uid = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("aura_uid", uid);
}

// 2. Conectar WebSocket
let ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws/${uid}`);
let sessionData = {};

// 3. Recibir mensajes
ws.onmessage = (event) => {
    let msg = JSON.parse(event.data);
    if (msg.type === "init" || msg.type === "update") {
        sessionData = msg.content;
        startSession();
    }
};

ws.onopen = () => console.log("WebSocket conectado.");
ws.onclose = () => console.log("WebSocket desconectado.");

// 4. Motor de sesión de 10 minutos
function startSession() {
    let timeLeft = 600; // 10 minutos
    const timerEl = document.getElementById("time");
    const contentEl = document.getElementById("content");
    const statusEl = document.getElementById("status");

    // Limpiar intervalos previos
    if (window.sessionInterval) clearInterval(window.sessionInterval);

    window.sessionInterval = setInterval(() => {
        timeLeft--;
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        if (timerEl) timerEl.innerText = `${min}:${sec < 10 ? '0' : ''}${sec}`;

        // Bloques de sesión
        if (timeLeft >= 450 && timeLeft < 600) updateUI("Enfoque: Bienestar", sessionData.bienestar);
        else if (timeLeft >= 300 && timeLeft < 450) updateUI("Estrategia: Éxito", sessionData.historia);
        else if (timeLeft >= 150 && timeLeft < 300) updateUI("Agilidad: Reto Mental", sessionData.ejercicio);
        else if (timeLeft >= 0 && timeLeft < 150) updateUI("Reflexión Final", "Analiza cómo aplicar esto hoy.");

        if (timeLeft <= 0) {
            clearInterval(window.sessionInterval);
            if (statusEl) statusEl.innerText = "Sesión Completada";
        }
    }, 1000);
}

// 5. Actualizar UI
function updateUI(title, content) {
    const statusEl = document.getElementById("status");
    const contentEl = document.getElementById("content");
    if (statusEl) statusEl.innerText = title;
    if (contentEl) contentEl.innerText = content;
}

// 6. Reseteo seguro de sesión
function resetSession() {
    if (confirm("¿Deseas reiniciar tu ciclo de Asesoría?")) {
        localStorage.removeItem("aura_uid");
        location.reload();
    }
}
