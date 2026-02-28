let userId = null;
let sessionDuration = 600;
let timerInterval = null;
let questionTimer = null;
let level = 0;
let simulatedChat = [
  "💥 Acabo de superar mi límite.",
  "⚡ Nadie me va a ganar hoy.",
  "🔥 Cada segundo cuenta.",
  "⚠️ Si no actúas, otros suben nivel.",
  "💪 Voy por el top 5."
];
let topRanking = [
  {name: "Anónimo1", lvl: 12},
  {name: "Anónimo2", lvl: 10},
  {name: "Anónimo3", lvl: 9},
  {name: "Anónimo4", lvl: 7},
  {name: "Anónimo5", lvl: 5}
];

async function initSession() {
  const joinRes = await fetch("/join", { method: "POST" });
  const joinData = await joinRes.json();
  if (joinData.error) { alert("Sesión llena."); return; }
  userId = joinData.user_id;

  loadAudio();
  updateSessionInfo();
  loadQuestion();
  loadChat();
  showRanking();

  timerInterval = setInterval(updateTimer, 1000);
  setInterval(updateSessionInfo, 5000);
  setInterval(loadChat, 3000);
  setInterval(addSimulatedChat, 10000);
  setInterval(showRanking, 8000);
}

async function updateSessionInfo() {
  const res = await fetch("/session-info");
  const data = await res.json();

  let timerEl = document.getElementById("timeRemaining");
  timerEl.innerText = formatTime(data.remaining);
  if (data.remaining <= 120) timerEl.style.color = "red";

  document.getElementById("userCount").innerHTML = `🔥 ${data.users} están dentro ahora mismo<br>⚠️ ${data.max_users - data.users} espacios restantes`;

  if (data.remaining <= 0) {
    clearInterval(timerInterval);
    alert("SESION CERRADA.\nLos que actuaron hoy avanzaron.\nLos que dudaron empiezan mañana en desventaja.");
    location.reload();
  }
}

function formatTime(sec) {
  let m = Math.floor(sec/60).toString().padStart(2,'0');
  let s = (sec % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

async function loadAudio() {
  const res = await fetch("/audio-file");
  const data = await res.json();
  const audio = document.getElementById("sessionAudio");
  audio.src = data.audio;
  audio.play();
}

async function loadQuestion() {
  const res = await fetch("/question");
  const data = await res.json();
  document.getElementById("questionBox").innerText = `⏳ 60s para responder: ${data.question}`;
  startQuestionTimer();
}

function startQuestionTimer() {
  clearInterval(questionTimer);
  let t = 60;
  questionTimer = setInterval(() => {
    t--;
    let box = document.getElementById("questionBox");
    box.innerText = `⏳ ${t}s para responder: ${box.innerText.split(': ')[1]}`;
    if (t <= 0) {
      clearInterval(questionTimer);
      document.getElementById("feedback").innerText = "⚠️ Tiempo agotado. Otros avanzaron.";
      level = Math.max(0, level - 1);
      loadQuestion();
    }
  },1000);
}

async function sendAnswer() {
  const answer = document.getElementById("answerInput").value;
  if (!answer) return;
  const res = await fetch("/answer", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({answer})
  });
  const data = await res.json();
  level++;
  document.getElementById("feedback").innerHTML = `⚡ Nivel +${level} - ${data.feedback}`;
  document.getElementById("answerInput").value = "";
  loadQuestion();
}

async function loadChat() {
  const res = await fetch("/chat");
  const data = await res.json();
  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = "";
  data.messages.forEach(msg => {
    let div = document.createElement("div");
    div.innerText = msg;
    chatBox.appendChild(div);
  });
}

async function sendChat() {
  const message = document.getElementById("chatInput").value;
  if (!message) return;
  await fetch("/chat", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({message})
  });
  document.getElementById("chatInput").value = "";
  loadChat();
}

function addSimulatedChat() {
  const chatBox = document.getElementById("chatBox");
  let msg = simulatedChat[Math.floor(Math.random()*simulatedChat.length)];
  let div = document.createElement("div");
  div.innerText = msg;
  chatBox.appendChild(div);
  if(chatBox.childElementCount>20) chatBox.removeChild(chatBox.firstChild);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showRanking() {
  const rankingEl = document.getElementById("ranking");
  if(!rankingEl) return;
  rankingEl.innerHTML = "<h3>🏆 Top 5 del momento</h3>";
  topRanking.forEach((r,i)=>{
    rankingEl.innerHTML += `${i+1}. ${r.name} - Nivel ${r.lvl}<br>`;
  });
}

window.onload = initSession;
