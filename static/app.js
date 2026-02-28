// ===== KaMiZen app.js =====
let sessionDuration = 600; // 10 minutos
let questionDuration = 60; // 60s por pregunta
let participantsCount = 2; // inicial simulado
let userLevel = 1;
const maxLevel = 10;

let ranking = [
    {name:"Anónimo1",level:5},
    {name:"Anónimo2",level:4},
    {name:"Anónimo3",level:3},
    {name:"Anónimo4",level:2},
    {name:"Anónimo5",level:1}
];

const questions = [
    "Escribe un pequeño triunfo personal de hoy",
    "Menciona una acción de valor que realizaste",
    "Escribe una decisión que te acerque al dinero",
    "Comparte un momento de poder que tuviste",
    "Describe algo que hiciste que otros no hicieron",
    "Escribe una acción que mejora tu bienestar",
    "Menciona un pequeño logro que te da ventaja",
    "Describe cómo superaste un obstáculo hoy"
];

const simulatedChats = [
    "💰 Cerré un trato millonario hoy",
    "🔥 Nadie me supera en decisión rápida",
    "⚡ Cada segundo cuenta para subir de nivel",
    "💥 Hoy tomé la acción que otros no tomaron",
    "🏆 Cada minuto cuenta para estar por delante"
];

let chatBox = document.getElementById("chatBox");
let participantsEl = document.getElementById("participants");
let timeEl = document.getElementById("timeRemaining");
let questionBox = document.getElementById("questionBox");
let feedbackEl = document.getElementById("feedback");
let rankingEl = document.getElementById("ranking");
let sessionAudio = document.getElementById("sessionAudio");

let usedQuestions = [];
let remainingTime = sessionDuration;
let currentQuestionIndex = 0;

// ===== Funciones =====
function startSession(){
    updateParticipants();
    nextQuestion();
    updateRanking();
    playAudio();

    setInterval(sessionCountdown,1000);
    setInterval(simulateChat,7000); // chat simulado constante
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
    // Selección aleatoria de pregunta no repetida
    if(usedQuestions.length === questions.length) usedQuestions = [];
    let available = questions.filter((q)=>!usedQuestions.includes(q));
    let question = available[Math.floor(Math.random()*available.length)];
    usedQuestions.push(question);
    currentQuestionIndex = questions.indexOf(question);

    questionBox.textContent = `⏳ ${questionDuration}s para responder: ${question}`;
    speakText(question);
    startQuestionTimer();
    playAudioForQuestion();
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
    let ans = document.getElementById("answerInput").value.trim();
    if(ans==="") return;

    if(userLevel < maxLevel) userLevel++;
    feedbackEl.textContent = `💥 Nivel +1 – Estás por encima de 60% de los conectados`;
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

// ===== Audio =====
function playAudio(){
    sessionAudio.src="/audio/monday.mp3"; // ejemplo, puede cambiar
    sessionAudio.play();
}

function playAudioForQuestion(){
    // Cambiar a audio pregrabado por pregunta
    // Puedes poner audio dinámico diferente según el índice
    sessionAudio.src="/audio/thursday.mp3";
    sessionAudio.play();
}

// ===== Voz sintetizada =====
function speakText(text){
    if('speechSynthesis' in window){
        let utter = new SpeechSynthesisUtterance(text);
        utter.lang="es-ES";
        utter.pitch=1.2;
        utter.rate=1.1;
        speechSynthesis.speak(utter);
    }
}

// ===== Inicia sesión automáticamente =====
window.onload = startSession;
