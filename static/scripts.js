// 1. Generar UID persistente
let uid = localStorage.getItem("aura_uid");
if (!uid) {
    uid = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("aura_uid", uid);
}

// 2. Conectar al WebSocket remoto KaMiZen
let ws = new WebSocket(`wss://kamizen.onrender.com/ws/${uid}`);
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
        if (title.includes("Historia") || title.includes("Estrategia")) 
            document.getElementById("historia").innerText = content;
        if (title.includes("Ejercicio") || title.includes("Reto Mental")) 
            document.getElementById("ejercicio").innerText = content;
        if (title.includes("Bienestar") || title.includes("Enfoque")) 
            document.getElementById("bienestar").innerText = content;
    }
}

// 6. Siguiente contenido automático desde servidor
function nextContent() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert("WebSocket KaMiZen no conectado. Intenta recargar la página.");
        return;
    }

    // Solicitar nuevo set de contenido al servidor
    fetch(`/ws/${uid}`)
        .then(res => res.json())
        .then(data => {
            sessionData = data;
            updateUI("Historia del Día", sessionData.historia);
            updateUI("Ejercicio del Día", sessionData.ejercicio);
            updateUI("Bienestar del Día", sessionData.bienestar);
            updateUI("KaMiZen Actualizado", "¡Sigue aplicando tus aprendizajes!");
        })
        .catch(err => console.log("Error al obtener nuevo contenido KaMiZen:", err));
}

// 7. Función de reinicio KaMiZen (borrar UID)
function resetSession() {
    if (confirm("¿Deseas reiniciar tu ciclo KaMiZen?")) {
        localStorage.removeItem("aura_uid");
        location.reload();
    }
}
