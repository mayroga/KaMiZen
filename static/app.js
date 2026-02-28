// =============================
// KaMiZen App JS
// =============================

// Conexión WebSocket
const ws = new WebSocket(`ws://${window.location.host}/ws`);

// Elementos DOM
const participantsEl = document.getElementById("participants");
const rankingEl = document.getElementById("rankingList");
const questionBox = document.getElementById("questionBox");
const answerInput = document.getElementById("answerInput");
const feedbackEl = document.getElementById("feedback");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sessionAudio = document.getElementById("sessionAudio");
const timeRemainingEl = document.getElementById("timeRemaining");

let sessionTime = 600; // 10 minutos
let questionDuration = 90; // 1:30 por pregunta
let questionTimer;
let questionsAsked = [];

// Preguntas y audios locales (para fases agresivo/triunfo)
const questionsBank = [
  {text:"¿Qué hiciste hoy que realmente te pone por delante?", audio:"/static/audio/monday.mp3"},
  {text:"Describe un logro que otros no alcanzaron hoy", audio:"/static/audio/thursday.mp3"},
  {text:"¿Qué decisión rápida tomaste que te generó ventaja?", audio:"/static/audio/monday.mp3"},
  {text:"Cita algo que aprendiste y aplicaste hoy", audio:"/static/audio/thursday.mp3"},
  {text:"¿Qué acción concreta de hoy aumentó tu productividad?", audio:"/static/audio/monday.mp3"}
];

// ----------------------------
// Funciones
// ----------------------------

// Temporizador de sesión
function startSessionTimer() {
    let timeLeft = sessionTime;
    const timerInterval = setInterval(() => {
        if(timeLeft <= 0){
            clearInterval(timerInterval);
            questionBox.innerText = "⏳ Sesión finalizada. Mañana subes de nivel!";
            sessionAudio.pause();
            return;
        }
        timeRemainingEl.innerText = `${Math.floor(timeLeft/60).toString().padStart(2,'0')}:${(timeLeft%60).toString().padStart(2,'0')}`;
        timeLeft--;
    },1000);
}

// Selección de pregunta aleatoria sin repetir
function pickQuestion() {
    let available = questionsBank.filter(q => !questionsAsked.includes(q.text));
    if(available.length === 0){
        questionsAsked = [];
        available = questionsBank;
    }
    const q = available[Math.floor(Math.random()*available.length)];
    questionsAsked.push(q.text);
    questionBox.innerText = q.text;

    // Reproducir audio automáticamente
    sessionAudio.src = q.audio;
    sessionAudio.play();
}

// Enviar respuesta al WebSocket
function sendAnswer() {
    const text = answerInput.value.trim();
    if(text === "") return;
    ws.send(JSON.stringify({type:"answer", text}));
    answerInput.value = "";
}

// Enviar chat al WebSocket
function sendChat() {
    const text = chatInput.value.trim();
    if(text === "") return;
    ws.send(JSON.stringify({type:"chat", text}));
    chatInput.value = "";
}

// Actualizar ranking
function updateRanking(ranking){
    rankingEl.innerHTML = "";
    ranking.forEach(u=>{
        const div = document.createElement("div");
        div.innerHTML = `${u.name} - <span class="level">Nivel ${u.level}</span>`;
        rankingEl.appendChild(div);
    });
}

// Añadir mensaje de chat
function addChatMessage(sender,text,simulated=false){
    const div = document.createElement("div");
    div.classList.add("chatMessage");
    if(simulated) div.classList.add("simulated");
    div.innerHTML = `<strong>${sender}</strong>: ${text}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Feedback micro mientras escribe
answerInput.addEventListener("input", ()=>{
    if(answerInput.value.length > 0){
        feedbackEl.innerText = "⏳ Rápido, otros avanzan más rápido!";
    }
});

// ----------------------------
// WebSocket eventos
// ----------------------------
ws.onopen = () => {
    console.log("Conectado al WebSocket KaMiZen");
    startSessionTimer();
    pickQuestion();

    // Cambiar pregunta cada 90s
    questionTimer = setInterval(pickQuestion, questionDuration*1000);
};

ws.onmessage = (event)=>{
    const data = JSON.parse(event.data);

    switch(data.type){
        case "update_participants":
            participantsEl.innerText = `🔥 Conectados: ${data.count}/${data.max}`;
            break;

        case "update_ranking":
            updateRanking(data.ranking);
            break;

        case "question":
            currentQuestion = data.text;
            questionBox.innerText = data.text;
            break;

        case "feedback":
            feedbackEl.innerText = data.text;
            break;

        case "chat":
            addChatMessage(data.sender,data.text,data.simulated);
            break;

        default:
            console.log("Tipo desconocido:", data);
    }
};
