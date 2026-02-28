// ===== CONFIGURACIÓN DE LA SESIÓN =====
const sessionDuration = 10 * 60; // 10 minutos
let sessionTime = sessionDuration;
let questionIndex = 0;
let level = 1;
const maxLevel = 10;

// Preguntas estratégicas por minuto
const questionsBank = [
    "💰 ¿Qué hiciste hoy que realmente produce dinero?",
    "🔥 ¿Qué decisión difícil tomaste que te pone adelante?",
    "⚡ ¿Qué acción concreta vas a hacer ahora para tu bienestar?",
    "🏆 Describe un pequeño triunfo de hoy que otros no hicieron.",
    "💥 ¿Qué obstáculo venciste hoy y cómo?",
    "💡 Qué hábito financiero fortaleciste hoy?",
    "🚀 Qué paso tomaste hoy que te acerca a tu meta más grande?",
    "🎯 Qué decisión rápida tomaste que otros dudaron en hacer?"
];

// Chat simulado constante (frases únicas)
const fakeChatMessages = [
    "💰 Cerré un trato millonario hoy",
    "🔥 Nadie me supera en decisión rápida",
    "⚡ Cada segundo cuenta para subir de nivel",
    "🏆 Avancé un nivel más, ¿y tú?",
    "💥 Acción rápida = resultado rápido",
    "🎯 Hoy elijo moverme, no esperar",
    "💡 Cada idea que aplico suma dinero",
    "🚀 No hay tiempo que perder"
];

// Audios por etapa (pueden ser TTS o pregrabados)
const audios = [
    "audio/agresivo.mp3", // Minuto 1
    "audio/estrategia.mp3", // Minuto 2-4
    "audio/disciplina.mp3", // Minuto 5-7
    "audio/espiritual.mp3", // Minuto 8-9
    "audio/cierre.mp3" // Minuto 10
];

const sessionTimerEl = document.getElementById("session-timer");
const questionTextEl = document.getElementById("question-text");
const questionTimerEl = document.getElementById("question-timer");
const answerInputEl = document.getElementById("answer-input");
const feedbackEl = document.getElementById("feedback");
const chatBoxEl = document.getElementById("chat-box");
const audioPlayer = document.getElementById("audio-player");
const topRankingEl = document.getElementById("top-ranking");

let activeChatInterval;
let questionInterval;
let questionTime = 30;

// ===== INICIO DE SESIÓN =====
function startSession() {
    playAudio(0); // audio agresivo inicial
    startSessionCountdown();
    startQuestionLoop();
    startFakeChat();
}

// ===== AUDIO =====
function playAudio(index) {
    audioPlayer.src = audios[index];
    audioPlayer.play();
}

// ===== PREGUNTAS DINÁMICAS =====
function getNextQuestion() {
    if(questionIndex >= questionsBank.length) questionIndex = 0;
    const question = questionsBank[questionIndex++];
    questionTextEl.innerText = question;
    playAudio(Math.min(Math.floor(sessionTime / 120), audios.length-1));
    startQuestionTimer();
}

// ===== TIMER PREGUNTA =====
function startQuestionTimer() {
    questionTime = 30;
    questionTimerEl.innerText = `⏳ ${questionTime}s para responder`;
    clearInterval(questionInterval);
    questionInterval = setInterval(() => {
        questionTime--;
        questionTimerEl.innerText = `⏳ ${questionTime}s para responder`;
        if(questionTime <= 0) {
            clearInterval(questionInterval);
            processAnswer(""); // si no respondió
            getNextQuestion();
        }
    }, 1000);
}

// ===== PROCESAR RESPUESTA =====
function processAnswer(answer) {
    answer = answer.trim();
    if(!answer) {
        feedbackEl.innerText = "Ejemplo: 'Hoy cerré un mini trato que otros no hicieron.'";
    } else {
        level = Math.min(level + 1, maxLevel);
        feedbackEl.innerText = `Nivel +1 – Estás por encima de ${Math.floor(Math.random()*50+50)}% de los conectados`;
        updateRanking();
    }
    answerInputEl.value = "";
}

// ===== RANKING =====
function updateRanking() {
    // Simple ranking simulado
    topRankingEl.innerHTML = `
        <li>Anónimo1 - Nivel ${Math.min(level+Math.floor(Math.random()*2), maxLevel)}</li>
        <li>Anónimo2 - Nivel ${Math.min(level+Math.floor(Math.random()*2), maxLevel)}</li>
        <li>Anónimo3 - Nivel ${Math.min(level+Math.floor(Math.random()*2), maxLevel)}</li>
        <li>Anónimo4 - Nivel ${Math.min(level+Math.floor(Math.random()*2), maxLevel)}</li>
        <li>Anónimo5 - Nivel ${Math.min(level+Math.floor(Math.random()*2), maxLevel)}</li>
    `;
}

// ===== CHAT SIMULADO =====
function startFakeChat() {
    activeChatInterval = setInterval(() => {
        const msg = fakeChatMessages[Math.floor(Math.random()*fakeChatMessages.length)];
        const p = document.createElement("p");
        p.innerText = msg;
        chatBoxEl.appendChild(p);
        setTimeout(() => { p.remove(); }, 25000); // desaparece en 25s
        chatBoxEl.scrollTop = chatBoxEl.scrollHeight;
    }, Math.floor(Math.random()*5000+5000));
}

// ===== SESIÓN TOTAL =====
function startSessionCountdown() {
    const countdown = setInterval(() => {
        sessionTime--;
        const min = Math.floor(sessionTime/60);
        const sec = sessionTime%60;
        sessionTimerEl.innerText = `${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
        if(sessionTime <= 0) {
            clearInterval(countdown);
            clearInterval(activeChatInterval);
            clearInterval(questionInterval);
            questionTextEl.innerText = "💥 Sesión finalizada. Mañana subimos nivel.";
            questionTimerEl.innerText = "";
            feedbackEl.innerText = "";
            answerInputEl.disabled = true;
        }
    }, 1000);
}

// ===== EVENTOS =====
document.getElementById("submit-answer").addEventListener("click", () => {
    processAnswer(answerInputEl.value);
    getNextQuestion();
});

document.getElementById("send-chat").addEventListener("click", () => {
    const msg = document.getElementById("chat-input").value.trim();
    if(msg) {
        const p = document.createElement("p");
        p.innerText = `Tú: ${msg}`;
        chatBoxEl.appendChild(p);
        setTimeout(() => { p.remove(); }, 25000);
        document.getElementById("chat-input").value = "";
        chatBoxEl.scrollTop = chatBoxEl.scrollHeight;
    }
});

// ===== INICIAR SESIÓN AUTOMÁTICAMENTE =====
window.onload = () => {
    startSession();
    getNextQuestion();
};
