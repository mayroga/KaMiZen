// 1. Generar UID persistente
let uid = localStorage.getItem("aura_uid");
if (!uid) {
    uid = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("aura_uid", uid);
}

// 2. Conectar al WebSocket KaMiZen
let ws = new WebSocket(`ws://${location.host}/ws/${uid}`);
let sessionData = {};

// 3. Recibir contenido inicial
ws.onmessage = (event) => {
    let msg = JSON.parse(event.data);
    if (msg.type === "init") {
        sessionData = msg.content;
        startSession();
    }
};

ws.onopen = () => console.log("WebSocket KaMiZen conectado");
ws.onerror = (e) => console.log("WebSocket Error:", e);
ws.onclose = () => console.log("WebSocket KaMiZen cerrado");

// 4. Motor de sesión 10 minutos
let timerInterval;
let timeLeft = 600; // 10 minutos
function startSession() {
    updateUI("Preparando sesión KaMiZen...", "¡Todo listo!");
    timerInterval = setInterval(() => {
        timeLeft--;
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        document.getElementById("time").innerText = `${min}:${sec < 10 ? '0' : ''}${sec}`;

        // Bloques de 2.5 min
        if (timeLeft === 600) updateUI("Enfoque: Bienestar", sessionData.bienestar);
        if (timeLeft === 450) updateUI("Estrategia: Éxito", sessionData.historia);
        if (timeLeft === 300) updateUI("Agilidad: Reto Mental", sessionData.ejercicio);
        if (timeLeft === 150) updateUI("Reflexión Final", "Analiza cómo aplicar esto hoy.");

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            updateUI("Sesión Completada", "¡Excelente trabajo con KaMiZen!");
        }
    }, 1000);
}

// 5. Actualizar UI de bloques
function updateUI(title, content) {
    document.getElementById("status").innerText = title;
    if (content) {
        if (title.includes("Historia")) document.getElementById("historia").innerText = content;
        if (title.includes("Ejercicio")) document.getElementById("ejercicio").innerText = content;
        if (title.includes("Bienestar")) document.getElementById("bienestar").innerText = content;
    }
}

// 6. Siguiente contenido manual
function nextContent() {
    if (!sessionData.historia || !sessionData.ejercicio || !sessionData.bienestar) return;

    const newHistoria = prompt("Historia KaMiZen:", sessionData.historia);
    const newEjercicio = prompt("Ejercicio KaMiZen:", sessionData.ejercicio);
    const newBienestar = prompt("Bienestar KaMiZen:", sessionData.bienestar);

    document.getElementById("historia").innerText = newHistoria || sessionData.historia;
    document.getElementById("ejercicio").innerText = newEjercicio || sessionData.ejercicio;
    document.getElementById("bienestar").innerText = newBienestar || sessionData.bienestar;

    updateUI("Contenido KaMiZen Actualizado", "Sigue aplicando tus aprendizajes.");
}
