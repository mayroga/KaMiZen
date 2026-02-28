// ===== KaMiZen app.js =====
let sessionDuration = 600; // 10 minutos
let questionDuration = 60; // 60s por pregunta
let participantsCount = 2; // inicial simulado
let userLevel = 1;
let ranking = [
    {name:"Anónimo1",level:12},
    {name:"Anónimo2",level:10},
    {name:"Anónimo3",level:9},
    {name:"Anónimo4",level:7},
    {name:"Anónimo5",level:5}
];

const questions = [
    "¿Qué hiciste hoy que otros no hicieron?",
    "Escribe tu pequeño triunfo de hoy",
    "Decide algo rápido para ganar dinero imaginario",
    "Escribe un momento de poder que hayas tenido",
    "Menciona una acción que te acerque a ser millonario"
];

const simulatedChats = [
    "💥 Acabo de cerrar un trato millonario!",
    "🔥 Hoy nadie me superó en ventas",
    "💰 Tomé una decisión rápida y gané",
    "⚡ Siempre un paso adelante de los demás",
    "🏆 Cada minuto cuenta para subir de nivel"
];

let chatBox = document.getElementById("chatBox");
let participantsEl = document.getElementById("participants");
let timeEl = document.getElementById("timeRemaining");
let questionBox = document.getElementById("questionBox");
let feedbackEl = document.getElementById("feedback");
let rankingEl = document.getElementById("ranking");
let sessionAudio = document.getElementById("sessionAudio");

let currentQuestionIndex = 0;
let remainingTime = sessionDuration;

// === Funciones ===
function startSession(){
    updateParticipants();
    nextQuestion();
    updateRanking();
    playAudio();

    setInterval(sessionCountdown,1000);
    setInterval(simulateChat,8000);
}

function sessionCountdown(){
    remainingTime--;
    let minutes = Math.floor(remainingTime/60);
    let seconds = remainingTime%60;
    timeEl.textContent = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    if(remainingTime<=0){
        questionBox.textContent = "💥 SESIÓN TERMINADA. Los que actuaron hoy avanzaron. Los que dudaron empiezan mañana en desventaja.";
        feedbackEl.textContent="";
    }
}

function updateParticipants(){
    participantsEl.textContent = `🔥 Participantes: ${participantsCount}/500`;
}

function nextQuestion(){
    currentQuestionIndex = Math.floor(Math.random()*questions.length);
    questionBox.textContent = `⏳ ${questionDuration}s para responder: ${questions[currentQuestionIndex]}`;
    speakText(questions[currentQuestionIndex]);
    startQuestionTimer();
}

function startQuestionTimer(){
    let timeLeft = questionDuration;
    let questionInterval = setInterval(()=>{
        timeLeft--;
        questionBox.textContent = `⏳ ${timeLeft}s para responder: ${questions[currentQuestionIndex]}`;
        if(timeLeft<=0){
            clearInterval(questionInterval);
            feedbackEl.textContent = "⚠️ Tiempo agotado. Otros avanzaron.";
            nextQuestion();
        }
    },1000);
}

function sendAnswer(){
    let ans = document.getElementById("answerInput").value;
    if(ans.trim()==="") return;
    feedbackEl.textContent = `💥 Perfecto! Nivel +1`;
    userLevel++;
    document.getElementById("answerInput").value="";
    updateRanking();
    nextQuestion();
}

function updateRanking(){
    let top5 = ranking.slice(0,5);
    let html = "🏆 Top 5 del momento<br>";
    top5.forEach((r,i)=>{
        html+= `${i+1}. ${r.name} - Nivel ${r.level}<br>`;
    });
    html+= `<strong>Tu Nivel: ${userLevel}</strong>`;
    rankingEl.innerHTML = html;
}

function simulateChat(){
    let msg = simulatedChats[Math.floor(Math.random()*simulatedChats.length)];
    let div = document.createElement("div");
    div.className="chatMessage simulated";
    div.textContent = msg;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    setTimeout(()=>{div.remove()},25000);
}

function sendChat(){
    let input = document.getElementById("chatInput");
    let msg = input.value.trim();
    if(msg==="") return;
    let div = document.createElement("div");
    div.className="chatMessage";
    div.textContent = `💬 ${msg}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    input.value="";
    setTimeout(()=>{div.remove()},25000);
}

function playAudio(){
    sessionAudio.src="/audio/monday.mp3";
    sessionAudio.play();
}

// === Voz sintetizada ===
function speakText(text){
    if('speechSynthesis' in window){
        let utter = new SpeechSynthesisUtterance(text);
        utter.lang="es-ES";
        utter.pitch=1.2;
        utter.rate=1.1;
        speechSynthesis.speak(utter);
    }
}

// === Inicia la sesión automáticamente ===
window.onload = startSession;
