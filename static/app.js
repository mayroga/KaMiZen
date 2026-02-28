let ws = new WebSocket(`ws://${window.location.host}/ws`);
let timeRemaining = 10 * 60; // 10 minutos
let timerInterval;

const participantsDiv = document.getElementById("participants");
const rankingList = document.getElementById("rankingList");
const questionBox = document.getElementById("questionBox");
const answerInput = document.getElementById("answerInput");
const feedbackDiv = document.getElementById("feedback");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sessionAudio = document.getElementById("sessionAudio");

// ---------------------------
// Temporizador sesión
// ---------------------------
function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        let min = Math.floor(timeRemaining / 60).toString().padStart(2, "0");
        let sec = (timeRemaining % 60).toString().padStart(2, "0");
        document.getElementById("timeRemaining").innerText = `${min}:${sec}`;
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            questionBox.innerText = "⏰ Sesión finalizada. ¡Mañana subimos nivel!";
            answerInput.disabled = true;
            chatInput.disabled = true;
        }
    }, 1000);
}

// ---------------------------
// WebSocket mensajes
// ---------------------------
ws.onmessage = (event) => {
    let data = JSON.parse(event.data);
    if (data.type === "update_participants") {
        participantsDiv.innerText = `🔥 Conectados: ${data.count}/${data.max}`;
    } else if (data.type === "update_ranking") {
        rankingList.innerHTML = "";
        data.ranking.forEach(u => {
            let div = document.createElement("div");
            div.innerHTML = `${u.name} - <span class="level">${u.level}</span>`;
            rankingList.appendChild(div);
        });
    } else if (data.type === "question") {
        questionBox.innerText = data.text;
        sessionAudio.src = `/static/audio/monday.mp3`; // audio pregrabado fase inicial
        sessionAudio.play();
    } else if (data.type === "feedback") {
        feedbackDiv.innerText = data.text;
    } else if (data.type === "chat") {
        let div = document.createElement("div");
        div.className = `chatMessage ${data.simulated ? "simulated" : ""}`;
        div.innerText = `${data.sender}: ${data.text}`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
};

// ---------------------------
// Enviar respuesta
// ---------------------------
function sendAnswer() {
    let text = answerInput.value.trim();
    if (text) {
        ws.send(JSON.stringify({type: "answer", text}));
        answerInput.value = "";
    }
}

// ---------------------------
// Enviar chat
// ---------------------------
function sendChat() {
    let text = chatInput.value.trim();
    if (text) {
        ws.send(JSON.stringify({type: "chat", text}));
        chatInput.value = "";
    }
}

// ---------------------------
// Iniciar sesión
// ---------------------------
startTimer();
