// =============================
// KaMiZen – Session JS
// =============================
let ws = new WebSocket(`ws://${location.host}/ws`);
let timeLeft = 600; // 10 minutos
let currentAnswer = "";

// ------------------
// TIMER
// ------------------
setInterval(() => {
    if(timeLeft>0){
        timeLeft--;
        let min = Math.floor(timeLeft/60);
        let sec = timeLeft%60;
        document.getElementById("time").innerText = `${min}:${sec<10?"0":""}${sec}`;
    }
}, 1000);

// ------------------
// WEBSOCKET EVENTS
// ------------------
ws.onmessage = function(event){
    let data = JSON.parse(event.data);

    if(data.type==="question"){
        document.getElementById("question").innerText = data.text;
        document.getElementById("feedback").innerText = "";
        currentAnswer = "";
    }

    if(data.type==="feedback"){
        document.getElementById("feedback").innerText = data.text;
    }

    if(data.type==="update_participants"){
        document.getElementById("participants").innerText = data.count;
    }

    if(data.type==="update_ranking"){
        let rankingDiv = document.getElementById("ranking");
        rankingDiv.innerHTML = "";
        data.ranking.forEach(r=>{
            rankingDiv.innerHTML += `<div class="rank-item">${r.name} - Nivel ${r.level}</div>`;
        });
    }

    if(data.type==="chat"){
        let chatBox = document.getElementById("chatBox");
        chatBox.innerHTML += `<div><strong>${data.sender}:</strong> ${data.text}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
};

// ------------------
// SEND ANSWER
// ------------------
function sendAnswer(){
    let input = document.getElementById("answerInput");
    let text = input.value.trim();
    if(text==="") return;

    ws.send(JSON.stringify({type:"answer", text:text}));
    input.value="";
}

// ------------------
// SHOW ANSWER BUTTON
// ------------------
function showAnswer(){
    document.getElementById("feedback").innerText =
        "Responde para activar dopamina 💥";
}

// ------------------
// BOT CHAT SIMULADO - NO REAL
// ------------------
function addSimulatedChat(msg){
    let chatBox = document.getElementById("chatBox");
    chatBox.innerHTML += `<div><strong>${msg.sender}:</strong> ${msg.text}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}
