const protocol = location.protocol === "https:" ? "wss" : "ws";
let ws = new WebSocket(`${protocol}://${location.host}/ws`);

let currentQuestion = "";
let sessionTime = 600; // 10 min
let elapsedTime = 0;

// ELEMENTOS
const questionEl = document.getElementById("question");
const feedbackEl = document.getElementById("feedback");
const answerInput = document.getElementById("answerInput");
const timeEl = document.getElementById("time");
const rankingEl = document.getElementById("ranking");
const chatBox = document.getElementById("chatBox");

// -----------------------------
// Temporizador
// -----------------------------
function formatTime(s){ return `${Math.floor(s/60)}:${(s%60<10?"0":"")}${s%60}`; }
let timerInterval = setInterval(()=>{
    if(elapsedTime >= sessionTime){
        clearInterval(timerInterval);
        questionEl.innerText = "⏳ Sesión finalizada. ¡Mañana subes de nivel!";
        return;
    }
    elapsedTime++;
    timeEl.innerText = formatTime(sessionTime-elapsedTime);
}, 1000);

// -----------------------------
// WebSocket
// -----------------------------
ws.onmessage = (event)=>{
    const data = JSON.parse(event.data);

    if(data.type==="question"){
        currentQuestion = data.text;
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

// -----------------------------
// Enviar respuesta
// -----------------------------
function sendAnswer(){
    let ans = answerInput.value.trim();
    if(ans==="") return;
    ws.send(JSON.stringify({type:"answer", text: ans}));
    answerInput.value="";
}

// -----------------------------
// Siguiente desafío
// -----------------------------
function nextChallenge(){
    feedbackEl.innerText = "⏳ Cargando próximo desafío...";
    ws.send(JSON.stringify({type:"answer", text:""})); // Enviar vacío fuerza nuevo reto
}

// -----------------------------
// Escuchar historia con voz del navegador
// -----------------------------
function playStory(){
    if(currentQuestion.trim()==="") return;
    const utterance = new SpeechSynthesisUtterance(currentQuestion);
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
}
