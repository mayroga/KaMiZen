const sessionDuration = 10 * 60; // 10 minutos
let timeLeft = sessionDuration;
let currentQuestionIndex = 0;
let userLevel = 1;
const maxLevel = 10;
const maxParticipants = 500;
const fakeChats = [
    "💰 Cerré un trato millonario hoy",
    "🔥 Nadie me supera en decisión rápida",
    "⚡ Cada segundo cuenta para subir de nivel",
    "💎 Hoy duplico mi rendimiento",
    "🏆 Mantén tu mente enfocada, otros se quedan atrás"
];
const questionBank = [
    {text:"¿Qué hiciste hoy que realmente produce dinero?", audio:"/static/audio/minuto2.mp3"},
    {text:"¿Cuál es la decisión que más rápido te acerca a tu meta?", audio:"/static/audio/minuto3.mp3"},
    {text:"Escribe una acción concreta que hoy genere bienestar financiero", audio:"/static/audio/minuto5.mp3"},
    {text:"Visualiza tu éxito y describe un logro pequeño de hoy", audio:"/static/audio/minuto8.mp3"},
    {text:"Si no actúas ahora, otros avanzan: ¿qué harás hoy?", audio:"/static/audio/minuto9.mp3"},
];
let sessionQuestions = [];
let chatMessages = [];
let connected = 1;

// Inicialización de la sesión
function initSession() {
    generateSessionQuestions();
    updateParticipants();
    updateRanking();
    showNextQuestion();
    startTimers();
    simulateChat();
}

// Generar preguntas únicas para la sesión
function generateSessionQuestions() {
    const copyBank = [...questionBank];
    while(copyBank.length && sessionQuestions.length < 5){
        const idx = Math.floor(Math.random()*copyBank.length);
        sessionQuestions.push(copyBank.splice(idx,1)[0]);
    }
}

// Mostrar pregunta y reproducir audio
function showNextQuestion(){
    if(currentQuestionIndex >= sessionQuestions.length) return;
    const q = sessionQuestions[currentQuestionIndex];
    document.getElementById("questionBox").innerText = q.text;
    const audioEl = document.getElementById("sessionAudio");
    audioEl.src = q.audio;
    audioEl.play();
}

// Enviar respuesta
function sendAnswer(){
    const input = document.getElementById("answerInput");
    const feedbackEl = document.getElementById("feedback");
    let ans = input.value.trim();
    input.value = "";
    if(!ans) ans = "No supe que responder, tomo ejemplo de KaMiZen";
    feedbackEl.innerText = generateFeedback(ans);
    updateUserLevel(ans);
    updateRanking();
    currentQuestionIndex++;
    showNextQuestion();
}

// Generar feedback lógico
function generateFeedback(ans){
    const positive = ["💥 Excelente, eso te pone por delante de los demás!",
                      "🔥 Muy bien, nivel +1!",
                      "⚡ Perfecto, avanzas rápido!"];
    const neutral = ["🤔 Bien, considera actuar más rápido la próxima vez",
                     "💡 Piensa en algo más concreto para subir nivel",
                     "⚠️ Otros avanzan más rápido, no te quedes atrás"];
    if(ans.length>5) return positive[Math.floor(Math.random()*positive.length)];
    else return neutral[Math.floor(Math.random()*neutral.length)];
}

// Actualizar nivel
function updateUserLevel(ans){
    if(ans.length>3) userLevel = Math.min(userLevel+1,maxLevel);
}

// Actualizar ranking (Top5)
function updateRanking(){
    const rankingEl = document.getElementById("rankingList");
    let top5 = [
        {name:"Anónimo1",level:Math.min(userLevel+1,maxLevel)},
        {name:"Anónimo2",level:Math.max(1,userLevel-1)},
        {name:"Anónimo3",level:userLevel},
        {name:"Anónimo4",level:Math.max(1,userLevel-2)},
        {name:"Tú",level:userLevel}
    ];
    top5 = top5.sort((a,b)=>b.level-a.level).slice(0,5);
    rankingEl.innerHTML = top5.map((p,i)=>`${i+1}. ${p.name} - <span class="level">${p.level}</span>`).join("<br>");
}

// Actualizar participantes conectados
function updateParticipants(){
    const participantsEl = document.getElementById("participants");
    participantsEl.innerText = `🔥 Conectados: ${connected + fakeChats.length}/${maxParticipants}`;
}

// Simular chat dinámico
function simulateChat(){
    const chatBox = document.getElementById("chatBox");
    setInterval(()=>{
        const msg = fakeChats[Math.floor(Math.random()*fakeChats.length)];
        chatBox.innerHTML += `<div class="chatMessage simulated">${msg}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        // Limitar chat a últimos 10 mensajes
        if(chatBox.children.length>10) chatBox.removeChild(chatBox.firstChild);
    }, Math.floor(Math.random()*5000)+5000); // 5-10s
}

// Enviar chat real
function sendChat(){
    const input = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatBox");
    let msg = input.value.trim();
    if(!msg) return;
    chatBox.innerHTML += `<div class="chatMessage">${msg}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    input.value="";
}

// Temporizador principal
function startTimers(){
    const timerEl = document.getElementById("timeRemaining");
    const interval = setInterval(()=>{
        if(timeLeft<=0){
            clearInterval(interval);
            endSession();
            return;
        }
        timeLeft--;
        const minutes = String(Math.floor(timeLeft/60)).padStart(2,"0");
        const seconds = String(timeLeft%60).padStart(2,"0");
        timerEl.innerText = `${minutes}:${seconds}`;
    },1000);
}

// Fin de sesión
function endSession(){
    document.getElementById("questionBox").innerText = "⚡ Sesión finalizada. Mañana subimos nivel.";
    document.getElementById("answerInput").disabled = true;
    document.getElementById("chatInput").disabled = true;
    document.getElementById("feedback").innerText = "💥 Mantén tu enfoque, prepárate para mañana!";
}

window.onload = initSession;
