// -------------------------
// KaMiZen – Sesión JS
// -------------------------

const token = localStorage.getItem("token");
if (!token) {
    alert("No tienes acceso. Compra entrada o usa admin.");
    window.location.href = "/";
}

// DOM Elements
const participantsEl = document.getElementById("participants");
const countdownEl = document.getElementById("countdown");
const questionEl = document.getElementById("question");
const answerEl = document.getElementById("answer");
const submitBtn = document.getElementById("submit-answer");
const feedbackEl = document.getElementById("feedback");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendChatBtn = document.getElementById("send-chat");
const audioEl = document.getElementById("audio");

// -------------------------
// AUDIO DINÁMICO
// -------------------------
async function loadAudio() {
    try {
        const res = await fetch(`/audio?token=${token}`);
        const data = await res.json();
        audioEl.src = data.audio_file;
        audioEl.play();
    } catch (err) {
        console.log("Error cargando audio:", err);
    }
}
loadAudio();

// -------------------------
// PREGUNTA ALEATORIA
// -------------------------
async function loadQuestion() {
    try {
        // Simulación: tomar pregunta aleatoria usando submit endpoint
        const res = await fetch("/submit-answer", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({token, answer: ""})
        });
        const data = await res.json();
        questionEl.textContent = data.feedback; // Feedback simula pregunta única
    } catch (err) {
        questionEl.textContent = "Error cargando pregunta.";
    }
}
loadQuestion();

// -------------------------
// ENVIAR RESPUESTA
// -------------------------
submitBtn.addEventListener("click", async () => {
    const answer = answerEl.value;
    if (!answer) return alert("Escribe algo primero");
    try {
        const res = await fetch("/submit-answer", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({token, answer})
        });
        const data = await res.json();
        feedbackEl.textContent = data.feedback;
        answerEl.value = "";
        loadQuestion(); // nueva pregunta inmediata
    } catch (err) {
        alert("Error enviando respuesta: " + err);
    }
});

// -------------------------
// CHAT EFÍMERO
// -------------------------
async function loadChat() {
    try {
        const res = await fetch(`/chat?token=${token}`);
        const data = await res.json();
        chatBox.innerHTML = "";
        data.messages.forEach(msg => {
            const p = document.createElement("p");
            p.textContent = msg;
            chatBox.appendChild(p);
        });
    } catch (err) {
        console.log("Error chat:", err);
    }
}
setInterval(loadChat, 2000);

// Enviar mensaje de chat
sendChatBtn.addEventListener("click", async () => {
    const msg = chatInput.value;
    if (!msg) return;
    try {
        await fetch("/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({token, message: msg})
        });
        chatInput.value = "";
        loadChat();
    } catch (err) {
        console.log("Error enviando chat:", err);
    }
});

// -------------------------
// CONTADOR DE PARTICIPANTES
// -------------------------
async function loadParticipants() {
    try {
        const res = await fetch(`/active-users?token=${token}`);
        const data = await res.json();
        participantsEl.textContent = `${data.count}/${data.max} participantes dentro`;
    } catch (err) {
        participantsEl.textContent = "Error cargando participantes";
    }
}
setInterval(loadParticipants, 3000);

// -------------------------
// CONTADOR DE 10 MINUTOS
// -------------------------
let sessionStart = Date.now();
function updateCountdown() {
    const elapsed = Math.floor((Date.now() - sessionStart)/1000);
    const remaining = 10*60 - elapsed;
    if (remaining <= 0) {
        alert("Sesión terminada. Los que no subieron nivel hoy, comienzan mañana en desventaja. Asegura tu lugar.");
        localStorage.removeItem("token");
        window.location.href = "/";
        return;
    }
    const min = Math.floor(remaining/60);
    const sec = remaining % 60;
    countdownEl.textContent = `Tiempo restante: ${min} min ${sec} seg`;
}
setInterval(updateCountdown, 1000);
