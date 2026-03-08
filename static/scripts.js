// 1. Generar ID único persistente para el motor de no-repetición
let uid = localStorage.getItem("aura_uid");
if (!uid) {
    uid = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("aura_uid", uid);
}

// 2. Conectar al WebSocket pasando el ID
let ws = new WebSocket(`ws://${location.host}/ws/${uid}`);
let sessionData = {};

ws.onmessage = (event) => {
    let msg = JSON.parse(event.data);
    if (msg.type === "init") {
        sessionData = msg.content;
        startSession();
    }
};

// 3. Motor de Sesión de 10 Minutos
function startSession() {
    let timeLeft = 600; // 10 minutos
    const timerEl = document.getElementById("time");
    const contentEl = document.getElementById("content");
    const statusEl = document.getElementById("status");

    let interval = setInterval(() => {
        timeLeft--;
        let min = Math.floor(timeLeft / 60);
        let sec = timeLeft % 60;
        timerEl.innerText = `${min}:${sec < 10 ? '0' : ''}${sec}`;

        // Flujo lógico de 10 minutos (bloques de 2.5 min)
        if (timeLeft === 600) updateUI("Enfoque: Bienestar", sessionData.bienestar);
        if (timeLeft === 450) updateUI("Estrategia: Éxito", sessionData.historia);
        if (timeLeft === 300) updateUI("Agilidad: Reto Mental", sessionData.ejercicio);
        if (timeLeft === 150) updateUI("Reflexión Final", "Analiza cómo aplicar esto hoy.");

        if (timeLeft <= 0) {
            clearInterval(interval);
            statusEl.innerText = "Sesión Completada";
        }
    }, 1000);
}

function updateUI(title, content) {
    document.getElementById("status").innerText = title;
    document.getElementById("content").innerText = content;
}

// 4. Función de borrado profesional (Reseteo de sesión)
function resetSession() {
    if (confirm("¿Deseas reiniciar tu ciclo de Asesoría?")) {
        localStorage.removeItem("aura_uid");
        localStorage.clear();
        location.reload();
    }
}
