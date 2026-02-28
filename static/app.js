// ====== KA MIZEN SESSION JS ====== //

const sessionDuration = 10 * 60; // 10 minutos en segundos
let timeLeft = sessionDuration;
let questionInterval = 120; // cada 2 minutos cambio de pregunta
let currentQuestionIndex = 0;
let level = 1;
let maxLevel = 10;
let chatMessages = [];
let ranking = [];
let fakeParticipants = ["Anónimo1","Anónimo2","Anónimo3","Anónimo4","Anónimo5"];
let fakeChatPool = [
  "💰 Cerré un trato millonario hoy",
  "🔥 Nadie me supera en decisión rápida",
  "⚡ Cada segundo cuenta para subir de nivel",
  "💎 Tomé acción antes que otros",
  "🏆 Hoy rompí mis límites",
  "💡 Idea brillante puesta en práctica",
  "🧠 Control mental absoluto",
  "💥 Subí un nivel en productividad"
];

const questionsBank = [
  {text:"¿Qué hiciste hoy que realmente produce dinero?", audio:"audio/activation1.mp3"},
  {text:"Describe una acción de valor que otros no hicieron.", audio:"audio/activation2.mp3"},
  {text:"Elige hoy una decisión que te acerque a tu objetivo principal.", audio:"audio/activation3.mp3"},
  {text:"¿Qué mini-hábito implementaste hoy que te hace más fuerte?", audio:"audio/activation4.mp3"},
  {text:"Visualiza tu mejor versión: ¿qué hiciste hoy para acercarte a ella?", audio:"audio/activation5.mp3"},
  {text:"Acción concreta que generará dinero en 24h: ¿cuál es?", audio:"audio/action1.mp3"},
  {text:"Define hoy un logro financiero o personal concreto.", audio:"audio/action2.mp3"},
  {text:"Tu mente es herramienta. Tu disciplina es puente. Tu acción es destino.", audio:"audio/spiritual1.mp3"},
  {text:"Escribe algo que te dé ventaja mañana sobre otros.", audio:"audio/closing1.mp3"}
];

// ===== DOM ELEMENTS =====
const sessionTimerEl = document.getElementById("sessionTimer");
const questionTextEl = document.getElementById("questionText");
const questionTimerEl = document.getElementById("questionTimer");
const answerInputEl = document.getElementById("answerInput");
const submitAnswerBtn = document.getElementById("submitAnswer");
const chatBoxEl = document.getElementById("chatBox");
const chatInputEl = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChat");
const topRankingEl = document.getElementById("topRanking");
const audioPlayer = document.getElementById("audioPlayer");

// ====== SESSION LOGIC ======
let sessionInterval, questionTimer, questionTimeLeft;

function startSession() {
  updateRanking();
  nextQuestion();
  sessionInterval = setInterval(updateSessionTimer, 1000);
  startChatSimulation();
}

// ====== SESSION TIMER ======
function updateSessionTimer() {
  if(timeLeft <= 0){
    endSession();
    return;
  }
  timeLeft--;
  let min = String(Math.floor(timeLeft/60)).padStart(2,'0');
  let sec = String(timeLeft%60).padStart(2,'0');
  sessionTimerEl.textContent = `Tiempo restante: ${min}:${sec}`;
}

// ====== QUESTIONS ======
function nextQuestion() {
  if(currentQuestionIndex >= questionsBank.length){
    currentQuestionIndex = 0;
  }
  const question = questionsBank[currentQuestionIndex];
  questionTextEl.textContent = question.text;
  playAudio(question.audio);
  startQuestionTimer(30);
  currentQuestionIndex++;
}

// ====== QUESTION TIMER ======
function startQuestionTimer(seconds){
  questionTimeLeft = seconds;
  questionTimerEl.textContent = `⏳ ${questionTimeLeft}s para responder`;
  if(questionTimer) clearInterval(questionTimer);
  questionTimer = setInterval(()=>{
    questionTimeLeft--;
    questionTimerEl.textContent = `⏳ ${questionTimeLeft}s para responder`;
    if(questionTimeLeft <=0){
      clearInterval(questionTimer);
      handleAnswer(null); // tiempo agotado
    }
  },1000);
}

// ====== HANDLE ANSWERS ======
submitAnswerBtn.addEventListener("click", ()=>{
  handleAnswer(answerInputEl.value);
});

function handleAnswer(answer){
  let feedback="";
  if(!answer || answer.trim().length<2){
    feedback = "⚠️ Ejemplo: Hoy hice una llamada importante que generó ingreso.";
  } else {
    feedback = "💥 Excelente, eso te pone por delante de los demás.";
    level = Math.min(level+1,maxLevel);
  }
  addChatMessage(`Sistema: ${feedback}`);
  updateRanking();
  answerInputEl.value = "";
  nextQuestion();
}

// ====== CHAT SIMULATION ======
function startChatSimulation(){
  setInterval(()=>{
    let msg = fakeChatPool[Math.floor(Math.random()*fakeChatPool.length)];
    addChatMessage(`${fakeParticipants[Math.floor(Math.random()*fakeParticipants.length)]}: ${msg}`,true);
  }, 5000); // cada 5s mensaje simulado
}

function addChatMessage(msg, isTemporary=false){
  const p = document.createElement("p");
  p.textContent = msg;
  chatBoxEl.appendChild(p);
  chatBoxEl.scrollTop = chatBoxEl.scrollHeight;
  if(isTemporary){
    setTimeout(()=>{p.remove()}, Math.random()*10000+10000); // 10-20s desaparece
  }
}

// ====== RANKING ======
function updateRanking(){
  topRankingEl.innerHTML = "";
  let rankingList = fakeParticipants.slice(0,5).map((p,i)=>({
    name:p,
    level: Math.min(level-i,1)
  }));
  rankingList.push({name:"Tú", level:level});
  rankingList.sort((a,b)=>b.level-a.level);
  rankingList.slice(0,5).forEach(r=>{
    const li = document.createElement("li");
    li.textContent = `${r.name} - Nivel ${r.level}`;
    topRankingEl.appendChild(li);
  });
}

// ====== AUDIO ======
function playAudio(src){
  audioPlayer.src = src;
  audioPlayer.play().catch(e=>console.log("Audio error",e));
}

// ====== SEND CHAT ======
sendChatBtn.addEventListener("click", ()=>{
  const msg = chatInputEl.value;
  if(msg.trim().length>0){
    addChatMessage(`Tú: ${msg}`);
    chatInputEl.value="";
  }
});

// ====== END SESSION ======
function endSession(){
  clearInterval(sessionInterval);
  clearInterval(questionTimer);
  questionTextEl.textContent = "⏳ Sesión finalizada. Mañana subimos nivel.";
  questionTimerEl.textContent="";
  addChatMessage("⚠️ Sesión finalizada. Prepárate para mañana!");
  audioPlayer.src="";
}

// ====== START AUTOMATIC ======
window.onload = startSession;
