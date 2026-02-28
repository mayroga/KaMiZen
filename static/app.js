// ===== CONFIGURACIÓN SESIÓN =====
const sessionDuration = 10*60; // 10 minutos
let sessionTime = sessionDuration;
let level = 1;
const maxLevel = 10;
let questionIndex = 0;

// ===== AUDIOS PREGRABADOS POR FASE =====
const audioFiles = {
    1: "/static/audio/min1.mp3", // Corte digital
    2: "/static/audio/min2.mp3", // Activación financiera
    3: "/static/audio/min3.mp3",
    4: "/static/audio/min4.mp3",
    5: "/static/audio/min5.mp3", // Disciplina interna
    6: "/static/audio/min6.mp3",
    7: "/static/audio/min7.mp3",
    8: "/static/audio/min8.mp3", // Espiritualidad práctica
    9: "/static/audio/min9.mp3",
    10:"/static/audio/min10.mp3" // Cierre y tensión
};

// ===== PREGUNTAS ESTRATÉGICAS =====
const questionsBank = [
    {text:"💰 ¿Qué hiciste hoy que realmente produce dinero?", tts:"¡Rápido! ¿Qué hiciste hoy que realmente produce dinero?"},
    {text:"🔥 ¿Qué decisión difícil tomaste que te pone adelante?", tts:"¡Decide rápido! ¿Qué decisión difícil tomaste que te pone adelante?"},
    {text:"⚡ ¿Qué acción concreta vas a hacer ahora para tu bienestar?", tts:"¡Escribe ya! ¿Qué acción concreta vas a hacer ahora para tu bienestar?"},
    {text:"🏆 Describe un pequeño triunfo de hoy que otros no hicieron.", tts:"¡Vamos! Describe un pequeño triunfo de hoy que otros no hicieron."},
    {text:"💥 ¿Qué obstáculo venciste hoy y cómo?", tts:"¡Rápido! ¿Qué obstáculo venciste hoy y cómo?"}
];

// ===== CHAT SIMULADO =====
const fakeChatMessages = [
    "💰 Cerré un mini trato millonario",
    "🔥 Nadie me supera en decisión rápida",
    "⚡ Cada segundo cuenta",
    "🏆 Avancé un nivel más",
    "💥 Acción rápida = resultado rápido",
    "🎯 Hoy elijo moverme",
    "💡 Cada idea suma dinero",
    "🚀 No hay tiempo que perder"
];

// ===== ELEMENTOS DOM =====
const participantsEl = document.getElementById("participants");
const timeRemainingEl = document.getElementById("timeRemaining");
const questionBoxEl = document.getElementById("questionBox");
const answerInputEl = document.getElementById("answerInput");
const feedbackEl = document.getElementById("feedback");
const chatBoxEl = document.getElementById("chatBox");
const rankingEl = document.getElementById("ranking");
const chatInput = document.getElementById("chatInput");
const sessionAudio = document.getElementById("sessionAudio");

// ===== INICIO SESIÓN =====
function startSession(){
    participantsEl.innerText = "🔥 1/500 conectados";
    chatBoxEl.innerText = "";
    playPhaseAudio();
    nextQuestion();
    startSessionTimer();
    startFakeChat();
}

// ===== REPRODUCIR AUDIO SEGÚN MINUTO =====
function playPhaseAudio(){
    const currentMinute = 10 - Math.ceil(sessionTime/60);
    const audioFile = audioFiles[currentMinute+1];
    if(audioFile){
        sessionAudio.src = audioFile;
        sessionAudio.play();
    }
    setTimeout(playPhaseAudio, 60000); // Cada minuto
}

// ===== TTS =====
function speakText(text){
    if('speechSynthesis' in window){
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "es-ES";
        utterance.rate = 1.1;
        utterance.pitch = 1.2;
        window.speechSynthesis.speak(utterance);
    }
}

// ===== PREGUNTAS =====
function nextQuestion(){
    if(questionIndex >= questionsBank.length) questionIndex=0;
    const q = questionsBank[questionIndex++];
    questionBoxEl.innerText = q.text;
    speakText(q.tts);
    startQuestionTimer();
}

// ===== TIMER PREGUNTA =====
let questionTime = 30;
let questionInterval;
function startQuestionTimer(){
    questionTime = 30;
    clearInterval(questionInterval);
    questionInterval = setInterval(()=>{
        questionTime--;
        questionBoxEl.innerText = `${questionsBank[questionIndex-1].text} ⏳ ${questionTime}s`;
        if(questionTime<=0){
            clearInterval(questionInterval);
            processAnswer("");
            nextQuestion();
        }
    },1000);
}

// ===== PROCESAR RESPUESTA =====
function processAnswer(answer){
    answer = answer.trim();
    if(!answer){
        feedbackEl.innerText = "Ejemplo: 'Hoy cerré un mini trato que otros no hicieron.'";
        speakText("Si no sabes qué responder, aquí tienes un ejemplo: Hoy cerré un mini trato que otros no hicieron.");
    } else {
        level = Math.min(level+1,maxLevel);
        const perc = Math.floor(Math.random()*50+50);
        feedbackEl.innerText = `Nivel +1 – Estás por encima de ${perc}% de los conectados`;
        speakText("💥 Excelente, eso te pone por delante de los demás.");
        updateRanking();
        microFeedbackWhileTyping();
    }
    answerInputEl.value = "";
}

// ===== MICRO FEEDBACK =====
function microFeedbackWhileTyping(){
    const messages = ["⏳ Otros avanzan más rápido","💥 Cada palabra cuenta","🔥 No te quedes atrás"];
    setTimeout(()=> speakText(messages[Math.floor(Math.random()*messages.length)]), 500);
}

// ===== RANKING SIMULADO =====
function updateRanking(){
    rankingEl.innerHTML = `
    🏆 Top 5 del momento
    <ol>
        <li>Anónimo1 - Nivel ${Math.min(level+Math.floor(Math.random()*2), maxLevel)}</li>
        <li>Anónimo2 - Nivel ${Math.min(level+Math.floor(Math.random()*2), maxLevel)}</li>
        <li>Anónimo3 - Nivel ${Math.min(level+Math.floor(Math.random()*2), maxLevel)}</li>
        <li>Anónimo4 - Nivel ${Math.min(level+Math.floor(Math.random()*2), maxLevel)}</li>
        <li>Anónimo5 - Nivel ${Math.min(level+Math.floor(Math.random()*2), maxLevel)}</li>
    </ol>`;
}

// ===== CHAT SIMULADO =====
function startFakeChat(){
    setInterval(()=>{
        const msg = fakeChatMessages[Math.floor(Math.random()*fakeChatMessages.length)];
        const p = document.createElement("p");
        p.innerText = msg;
        p.classList.add("chatMessage","simulated");
        chatBoxEl.appendChild(p);
        setTimeout(()=> p.remove(), 25000);
        chatBoxEl.scrollTop = chatBoxEl.scrollHeight;
    }, Math.floor(Math.random()*5000+5000));
}

// ===== SESIÓN TOTAL =====
function startSessionTimer(){
    const countdown = setInterval(()=>{
        sessionTime--;
        const min = Math.floor(sessionTime/60);
        const sec = sessionTime%60;
        timeRemainingEl.innerText = `${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
        if(sessionTime<=0){
            clearInterval(countdown);
            clearInterval(questionInterval);
            questionBoxEl.innerText = "💥 Sesión finalizada. Mañana subimos nivel.";
            answerInputEl.disabled = true;
            feedbackEl.innerText="";
            speakText("💥 Sesión finalizada. Mañana subimos nivel.");
        }
    },1000);
}

// ===== ENVIAR RESPUESTA =====
function sendAnswer(){
    processAnswer(answerInputEl.value);
    nextQuestion();
}

// ===== ENVIAR CHAT =====
function sendChat(){
    const msg = chatInput.value.trim();
    if(msg){
        const p = document.createElement("p");
        p.innerText = `Tú: ${msg}`;
        p.classList.add("chatMessage");
        chatBoxEl.appendChild(p);
        setTimeout(()=> p.remove(),25000);
        chatInput.value="";
        chatBoxEl.scrollTop = chatBoxEl.scrollHeight;
    }
}

// ===== INICIO AUTOMÁTICO =====
window.onload = ()=> startSession();
