let ws = new WebSocket(`ws://${location.host}/ws`);
let currentQuestion = "";
let currentAnswer = "";
let sessionTime = 600;
let elapsedTime = 0;

// ELEMENTOS
const questionEl = document.getElementById("question");
const feedbackEl = document.getElementById("feedback");
const answerInput = document.getElementById("answerInput");
const timeEl = document.getElementById("time");
const rankingEl = document.getElementById("ranking");
const progressFill = document.getElementById("progressFill");
const chatBox = document.getElementById("chatBox");

// AUDIO
function playAudio(){
    if(!currentQuestion) return;
    let msg = new SpeechSynthesisUtterance(currentQuestion);
    window.speechSynthesis.speak(msg);
}

// ENVIAR RESPUESTA
function sendAnswer(){
    let ans = answerInput.value.trim();
    if(!ans) return;
    ws.send(JSON.stringify({type:"answer", text:ans}));
    answerInput.value="";
}

// SIGUIENTE DESAFÍO SIN RESPONDER
function nextChallenge(){
    ws.send(JSON.stringify({type:"answer", text:""}));
}

// WEBSOCKET EVENTS
ws.onmessage = function(event){
    let data = JSON.parse(event.data);

    if(data.type==="question"){
        currentQuestion = data.text || "🎯 Cargando desafío...";
        currentAnswer = data.answer || "";
        questionEl.innerText = currentQuestion;
    }

    if(data.type==="feedback"){
        feedbackEl.innerText = data.text || "";
    }

    if(data.type==="update_participants"){
        document.getElementById("participants").innerText = data.count;
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

    if(data.type==="chat"){
        let div = document.createElement("div");
        div.innerHTML = `<strong>${data.sender}:</strong> ${data.text}`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
};

// TIMER
function formatTime(s){return `${Math.floor(s/60)}:${(s%60<10?"0":"")}${s%60}`;}
let sessionInterval = setInterval(()=>{
    if(elapsedTime>=sessionTime){
        clearInterval(sessionInterval);
        questionEl.innerText="⏳ Sesión finalizada. ¡Mañana subes de nivel!";
        feedbackEl.innerText="";
        return;
    }
    elapsedTime++;
    timeEl.innerText = formatTime(sessionTime-elapsedTime);
    let pct = (elapsedTime/sessionTime)*100;
    progressFill.style.width = pct+"%";
},1000);
