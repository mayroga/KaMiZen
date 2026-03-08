let ws = new WebSocket(`ws://${location.host}/ws`);
let currentGame = null;
let sessionTime = 600; // 10 minutos
let elapsedTime = 0;
let userLevel = 1;

// ELEMENTOS
const questionEl = document.getElementById("question");
const feedbackEl = document.getElementById("feedback");
const answerInput = document.getElementById("answerInput");
const timeEl = document.getElementById("time");
const rankingEl = document.getElementById("ranking");
const progressFill = document.getElementById("progressFill");
const chatBox = document.getElementById("chatBox");
const miniStoryEl = document.getElementById("miniStory");

// TEMPORIZADOR
function formatTime(s){return `${Math.floor(s/60)}:${(s%60<10?"0":"")}${s%60}`;}
let timerInterval = setInterval(()=>{
    if(elapsedTime>=sessionTime){
        clearInterval(timerInterval);
        questionEl.innerText="⏳ Sesión finalizada. ¡Mañana subes de nivel!";
        feedbackEl.innerText="";
        return;
    }
    elapsedTime++;
    timeEl.innerText = formatTime(sessionTime-elapsedTime);
    let pct = (elapsedTime/sessionTime)*100;
    progressFill.style.width = pct+"%";
},1000);

// BOT SIMULADO
const botMsgs = ["🔥 Otro trader sube nivel","💰 Cada decisión suma","⚡ Rápido!","🏆 Nivel aumentado"];
function botChat(){
    let msg = botMsgs[Math.floor(Math.random()*botMsgs.length)];
    let div = document.createElement("div");
    div.className="simulated";
    div.innerText = `BOT: ${msg}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}
setInterval(botChat, 15000);

// NUEVO RETO
function newChallenge(game){
    currentGame = game;
    questionEl.innerText = currentGame.question || "Cargando desafío...";
    feedbackEl.innerText = "";
    miniStoryEl.innerText = currentGame.story || "";
}

// RESPONDER
function sendAnswer(){
    if(!currentGame) return;
    let ans = answerInput.value.trim();
    if(ans==="") return;
    if(currentGame.answer){
        if(Array.isArray(currentGame.answer)){
            if(currentGame.answer.includes(ans.toLowerCase())){
                userLevel++;
                feedbackEl.innerText="💥 Correcto! Dopamina activada!";
            } else {
                feedbackEl.innerText=`❌ Incorrecto. Era: ${currentGame.answer.join(", ")}`;
            }
        } else {
            if(ans.toLowerCase()===currentGame.answer.toLowerCase()){
                userLevel++;
                feedbackEl.innerText="💥 Correcto! Dopamina activada!";
            } else {
                feedbackEl.innerText=`❌ Incorrecto. Era: ${currentGame.answer}`;
            }
        }
    }
    answerInput.value="";
    ws.send(JSON.stringify({type:"answer", text:ans}));
}

// VER RESPUESTA
function showAnswer(){
    if(!currentGame || !currentGame.answer) return;
    feedbackEl.innerText = Array.isArray(currentGame.answer)?currentGame.answer.join(", "):currentGame.answer;
}

// REPRODUCIR AUDIO DE MINI HISTORIA
function playStoryAudio(){
    if(!currentGame || !currentGame.story) return;
    let utterance = new SpeechSynthesisUtterance(currentGame.story);
    utterance.lang = "es-ES";
    speechSynthesis.speak(utterance);
}

// WEBSOCKET
ws.onmessage = function(event){
    let data = JSON.parse(event.data);
    if(data.type==="question"){
        newChallenge(data);
    }
    if(data.type==="update_ranking"){
        rankingEl.innerHTML = "";
        data.ranking.forEach(r=>{
            let div = document.createElement("div");
            div.className="rank-item";
            div.innerText = `${r.name} - Nivel ${r.level}`;
            rankingEl.appendChild(div);
        });
    }
    if(data.type==="update_participants"){
        document.getElementById("participants").innerText = data.count;
    }
    if(data.type==="chat"){
        let div = document.createElement("div");
        div.innerText=`${data.sender}: ${data.text}`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
};
