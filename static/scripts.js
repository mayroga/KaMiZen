let ws = new WebSocket(`ws://${location.host}/ws`);
let currentQuestion = "";
let currentAnswer = "";
let elapsedTime = 0;
const sessionTime = 600; // 10 minutos
const questionEl = document.getElementById("question");
const feedbackEl = document.getElementById("feedback");
const answerInput = document.getElementById("answerInput");
const timeEl = document.getElementById("time");
const rankingEl = document.getElementById("ranking");
const progressFill = document.getElementById("progressFill");
const chatBox = document.getElementById("chatBox");

// -----------------------------
// Formatear tiempo
// -----------------------------
function formatTime(s){ return `${Math.floor(s/60)}:${(s%60<10?"0":"")}${s%60}`; }
let sessionInterval = setInterval(()=>{
    if(elapsedTime>=sessionTime){
        clearInterval(sessionInterval);
        questionEl.innerText="⏳ Sesión finalizada. ¡Mañana subes de nivel!";
        feedbackEl.innerText="";
        return;
    }
    elapsedTime++;
    timeEl.innerText = formatTime(sessionTime-elapsedTime);
    progressFill.style.width = (elapsedTime/sessionTime*100)+"%";
},1000);

// -----------------------------
// WebSocket
// -----------------------------
ws.onmessage = function(event){
    let data = JSON.parse(event.data);

    if(data.type==="question"){
        currentQuestion = data.text || "🎯 Cargando desafío...";
        currentAnswer = data.answer || "";
        questionEl.innerText = currentQuestion;
        feedbackEl.innerText = "";
    }
    if(data.type==="feedback"){
        feedbackEl.innerText = data.text;
    }
    if(data.type==="update_participants"){
        document.getElementById("participants").innerText = data.count;
    }
    if(data.type==="update_ranking"){
        rankingEl.innerHTML = "";
        data.ranking.forEach(r=>{
            rankingEl.innerHTML += `<div class="rank-item">${r.name} - Nivel ${r.level}</div>`;
        });
    }
    if(data.type==="chat"){
        chatBox.innerHTML += `<div><strong>${data.sender}:</strong> ${data.text}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
};

// -----------------------------
// Enviar respuesta
// -----------------------------
function sendAnswer(){
    let text = answerInput.value.trim();
    if(text==="") return;
    ws.send(JSON.stringify({type:"answer", text:text}));
    answerInput.value="";
}

// -----------------------------
// Ver respuesta
// -----------------------------
function showAnswer(){
    feedbackEl.innerText = currentAnswer || "🎯 Respuesta no disponible";
}

// -----------------------------
// Siguiente desafío
// -----------------------------
function nextChallenge(){
    ws.send(JSON.stringify({type:"answer", text:""}));
}

// -----------------------------
// Escuchar historia (SpeechSynthesis)
function playAudioStory(){
    if(currentQuestion==="") return;
    let utterance = new SpeechSynthesisUtterance(currentQuestion);
    utterance.lang = "es-ES";
    utterance.rate = 1;
    speechSynthesis.speak(utterance);
}
