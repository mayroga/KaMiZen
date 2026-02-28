// -------------------------
// KaMiZen – Sesión JS
// -------------------------
const token = localStorage.getItem("token") || prompt("Ingresa tu token de prueba");

const audioEl = document.getElementById("session-audio");
const questionText = document.getElementById("question-text");
const answerInput = document.getElementById("answer-input");
const submitBtn = document.getElementById("submit-answer");
const chatBox = document.getElementById("chat-box");
const participantsEl = document.getElementById("participants");
const countdownEl = document.getElementById("countdown");

let sessionTime = 10 * 60; // 10 minutos

// -------------------------
// Audio dinámico
// -------------------------
async function loadAudio() {
    const res = await fetch(`/audio?token=${token}`);
    const data = await res.json();
    audioEl.src = data.audio_file;
    audioEl.play();
}
loadAudio();

// -------------------------
// Contador regresivo
// -------------------------
function updateCountdown() {
    let min = Math.floor(sessionTime / 60);
    let sec = sessionTime % 60;
    countdownEl.textContent = `Tiempo restante: ${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    if(sessionTime > 0) {
        sessionTime--;
    } else {
        clearInterval(countdownInterval);
        alert("Sesión finalizada!");
    }
}
const countdownInterval = setInterval(updateCountdown, 1000);

// -------------------------
// Preguntas aleatorias
// -------------------------
async function loadQuestion() {
    const res = await fetch(`/submit-answer?token=${token}`);
    const data = await res.json();
    // Cada pregunta será aleatoria por usuario
    const qRes = await fetch(`/audio?token=${token}`);
    questionText.textContent = "Responde rápido: " + data.feedback;
}
loadQuestion();

// -------------------------
// Enviar respuesta
// -------------------------
submitBtn.addEventListener("click", async () => {
    const answer = answerInput.value;
    if(!answer) return alert("Escribe tu respuesta!");
    const res = await fetch("/submit-answer", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({token: token, answer: answer})
    });
    const data = await res.json();
    questionText.textContent = data.feedback;
    answerInput.value = "";
});

// -------------------------
// Chat efímero
// -------------------------
async function updateChat() {
    const res = await fetch(`/chat?token=${token}`);
    const data = await res.json();
    chatBox.innerHTML = "";
    data.messages.forEach(msg => {
        const div = document.createElement("div");
        div.className = "chat-message";
        div.textContent = msg;
        chatBox.appendChild(div);
    });
}
setInterval(updateChat, 2000);

// -------------------------
// Contador de usuarios
// -------------------------
async function updateParticipants() {
    const res = await fetch(`/active-users?token=${token}`);
    const data = await res.json();
    participantsEl.textContent = `${data.count}/${data.max} dentro`;
}
setInterval(updateParticipants, 3000);
