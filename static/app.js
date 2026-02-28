// ==== CONFIGURACIÓN ====
const sessionDuration = 10 * 60; // 10 minutos en segundos
let timeRemaining = sessionDuration;
let currentLevel = 1;
const maxLevel = 10;
let questionIndex = 0;

// Preguntas provocadoras para dopamina / competencia / estatus
const questions = [
    "💎 ¿Qué ventaja tuviste hoy sobre los demás?",
    "🔥 ¿Quién intentó ganarte y qué hiciste diferente?",
    "⚡ ¿Qué acción rápida te adelantó en estatus?",
    "💃 ¿Cómo brillaste hoy y te hicieron notar?",
    "💰 ¿Qué ganancia o poder obtuviste sin esfuerzo?",
    "🌟 ¿Qué decisión te puso por encima de otros?",
    "💥 ¿Qué hiciste hoy que nadie más haría?"
];

// Audios pregrabados por fase (minutos)
const audios = [
    "/static/audio/min1.mp3", // Corte digital
    "/static/audio/min2_4.mp3", // Pregunta agresiva
    "/static/audio/min5_7.mp3", // Acción/triunfo
    "/static/audio/min8_9.mp3", // Motivación/visualización
    "/static/audio/min10.mp3" // Tensión positiva
];

// Chat simulado dinámico
const simulatedMessages = [
    "💎 Compré el auto que quería hoy",
    "🔥 Nadie me supera en decisión rápida",
    "⚡ Cada segundo cuenta para subir nivel",
    "💃 Todos me miran, estoy por encima",
    "💰 Cerré un trato millonario hoy",
    "💥 Subí de nivel antes que ellos",
    "⚡ Hoy fui el más rápido en reaccionar",
    "💎 Nadie alcanzó mi estilo"
];

// Ranking simulado
let ranking = [
    {name: "Anónimo1", level: 10},
    {name: "Anónimo2", level: 8},
    {name: "Anónimo3", level: 7},
    {name: "Anónimo4", level: 6},
    {name: "Anónimo5", level: 5}
];

// ===== ELEMENTOS DEL DOM =====
const participantsEl = document.getElementById("participants");
const timeEl = document.getElementById("timeRemaining");
const questionBox = document.getElementById("questionBox");
const answerInput = document.getElementById("answerInput");
const feedbackEl = document.getElementById("feedback");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const rankingEl = document.getElementById("ranking");
const audioEl = document.getElementById("sessionAudio");

// ===== FUNCIONES PRINCIPALES =====

// Actualiza el temporizador general
function updateTimer() {
    let minutes = Math.floor(timeRemaining / 60);
    let seconds = timeRemaining % 60;
    timeEl.textContent = `${minutes.toString().padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`;
    timeRemaining--;
    if (timeRemaining < 0) {
        endSession();
    }
}

// Cambia la pregunta y audio según la fase
function nextQuestion() {
    if(questionIndex >= questions.length) questionIndex = 0;
    questionBox.textContent = questions[questionIndex];

    // Cambiar audio por fase
    let phase;
    if(timeRemaining > 7*60) phase = 0; // minuto 1
    else if(timeRemaining > 4*60) phase = 1; // min 2-4
    else if(timeRemaining > 1*60) phase = 2; // min 5-7
    else if(timeRemaining > 0) phase = 3; // min 8-9
    else phase = 4; // min 10

    audioEl.src = audios[phase];
    audioEl.play();

    questionIndex++;
}

// Enviar respuesta del usuario
function sendAnswer() {
    let answer = answerInput.value.trim();
    if(!answer) {
        feedbackEl.textContent = "No escribiste nada, intenta algo rápido que otros no harían.";
        return;
    }

    // Feedback lógico y subir nivel
    if(currentLevel < maxLevel) {
        currentLevel++;
        feedbackEl.textContent = `💥 Nivel +1 – Estás por encima de ${Math.floor(Math.random()*50 + 40)}% de los conectados`;
    } else {
        feedbackEl.textContent = `🏆 Nivel máximo alcanzado`;
    }

    // Actualizar ranking simulado
    ranking[0].level = Math.max(ranking[0].level, currentLevel);
    updateRanking();

    answerInput.value = "";
    nextQuestion();
}

// Chat real
function sendChat() {
    let message = chatInput.value.trim();
    if(!message) return;
    appendChat("Tú", message);
    chatInput.value = "";
}

// Agregar mensaje al chat
function appendChat(sender, message, simulated=false) {
    let div = document.createElement("div");
    div.classList.add("chatMessage");
    if(simulated) div.classList.add("simulated");
    div.textContent = `${sender}: ${message}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Borrar mensaje simulado después de 25s
    if(simulated) setTimeout(()=>{ div.remove(); }, 25000);
}

// Chat simulado constante
function generateSimulatedChat() {
    let msg = simulatedMessages[Math.floor(Math.random() * simulatedMessages.length)];
    appendChat("Anon", msg, true);
    setTimeout(generateSimulatedChat, Math.random()*5000 + 5000); // 5-10s
}

// Actualizar ranking visual
function updateRanking() {
    rankingEl.innerHTML = "🏆 Top 5 del momento<br>";
    ranking.forEach((r,i)=>{
        rankingEl.innerHTML += `${i+1}. ${r.name} - Nivel ${r.level}<br>`;
    });
}

// Fin de sesión
function endSession() {
    clearInterval(timerInterval);
    questionBox.textContent = "🔥 Sesión terminada. Mañana subes otro nivel, no te quedes atrás!";
    audioEl.src = "/static/audio/min10.mp3";
    audioEl.play();
    answerInput.disabled = true;
}

// ===== INICIO DE SESIÓN =====
updateRanking();
nextQuestion();
generateSimulatedChat();
let timerInterval = setInterval(updateTimer, 1000);
