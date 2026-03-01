// -------------------------
// KaMiZen – Sesión JS (Unificado con WebSocket)
// -------------------------

// 1. Manejo de Acceso (Comentado para pruebas iniciales)
const token = localStorage.getItem("token") || "invitado";

// 2. Conexión WebSocket
const ws = new WebSocket(`ws://${location.host}/ws`);

// 3. Elementos DOM (Corregidos según session.html)
const participantsEl = document.getElementById("participants");
const timeEl = document.getElementById("time");
const questionEl = document.getElementById("question");
const answerInput = document.getElementById("answerInput"); // ID correcto
const feedbackEl = document.getElementById("feedback");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");

// -------------------------
// EVENTOS WEBSOCKET
// -------------------------
ws.onmessage = function(event) {
    const data = JSON.parse(event.data);

    if (data.type === "question") {
        questionEl.innerText = data.text;
        feedbackEl.innerText = "";
    }

    if (data.type === "feedback") {
        feedbackEl.innerText = data.text;
    }

    if (data.type === "update_participants") {
        participantsEl.innerText = data.count;
    }

    if (data.type === "update_ranking") {
        const rankingDiv = document.getElementById("ranking");
        if (rankingDiv) {
            rankingDiv.innerHTML = data.ranking.map(r => 
                `<div class="rank-item">${r.name} - Nivel ${r.level}</div>`
            ).join("");
        }
    }

    if (data.type === "chat") {
        const msg = document.createElement("div");
        msg.innerHTML = `<strong>${data.sender}:</strong> ${data.text}`;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
};

// -------------------------
// FUNCIONES DE ENVÍO
// -------------------------
function sendAnswer() {
    const text = answerInput.value.trim();
    if (!text) return;
    
    ws.send(JSON.stringify({
        type: "answer",
        text: text
    }));
    answerInput.value = "";
}

function sendChat() {
    const text = chatInput.value.trim();
    if (!text) return;

    ws.send(JSON.stringify({
        type: "chat",
        text: text
    }));
    chatInput.value = "";
}

// -------------------------
// TEMPORIZADOR 10 MIN
// -------------------------
let timeLeft = 600;
const timer = setInterval(() => {
    if (timeLeft <= 0) {
        clearInterval(timer);
        alert("Sesión KaMiZen finalizada.");
        location.href = "/";
        return;
    }
    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    timeEl.innerText = `${min}:${sec < 10 ? "0" : ""}${sec}`;
}, 1000);

// Escuchar tecla Enter para enviar
answerInput.addEventListener("keypress", (e) => { if(e.key === "Enter") sendAnswer(); });
chatInput.addEventListener("keypress", (e) => { if(e.key === "Enter") sendChat(); });
