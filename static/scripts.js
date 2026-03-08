let timeLeft = 600; 
let currentChallenge = null;
let correctAnswer = "";
let narrationText = "";

const questionEl = document.getElementById("question");
const feedbackEl = document.getElementById("feedback");
const answerInput = document.getElementById("answerInput");
const timeEl = document.getElementById("time");

// ─────────── TIMER ───────────
function formatTime(s){
    return Math.floor(s/60) + ":" + (s%60<10?"0":"")+s%60;
}

setInterval(() => {
    if (timeLeft > 0) {
        timeLeft--;
        timeEl.innerText = formatTime(timeLeft);
    } else {
        questionEl.innerText = "⏳ Sesión completada. Gracias por practicar KaMiZen";
    }
}, 1000);

// ─────────── PETICIÓN AL SERVIDOR ───────────
async function loadNextChallenge(){
    const res = await fetch("/api/next_challenge");
    const data = await res.json();

    currentChallenge = data;
    questionEl.innerText = data.question;
    correctAnswer = data.answer;
    narrationText = data.narration;
    feedbackEl.innerText = "";
}

// ─────────── RESPONDER ───────────
function submitAnswer(){
    let ans = answerInput.value.trim().toLowerCase();
    if (!currentChallenge) return;
    if (ans === "") return;

    if (ans === correctAnswer.toLowerCase()){
        feedbackEl.innerText = "💥 ¡Correcto! Bien hecho KaMiZen Warrior!";
    } else {
        feedbackEl.innerText = `❌ Incorrecto. La respuesta es: ${correctAnswer}`;
    }
    answerInput.value = "";
    loadNextChallenge();
}

// ─────────── VER RESPUESTA ───────────
function showAnswer(){
    feedbackEl.innerText = `➡️ Respuesta: ${correctAnswer}`;
}

// ─────────── VOZ NARRACIÓN ───────────
function playNarration(){
    if (!narrationText) return;

    const msg = new SpeechSynthesisUtterance(narrationText);
    msg.lang = "es-ES";
    msg.rate = 1;
    speechSynthesis.speak(msg);
}

// ─────────── INICIO ───────────
loadNextChallenge();
