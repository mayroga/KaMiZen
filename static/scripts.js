// ============================
// CONFIGURACIÓN
// ============================
let sessionTime = 600; // tiempo total opcional
let elapsedTime = 0;

// ELEMENTOS
const questionEl = document.getElementById("question");
const feedbackEl = document.getElementById("feedback");
const answerInput = document.getElementById("answerInput");
const timeEl = document.getElementById("time");
const progressFill = document.getElementById("progressFill");
const chatBox = document.getElementById("chatBox");
const miniStoryEl = document.getElementById("miniStory");
const lessonBox = document.getElementById("lessonBox");
const audioClip = document.getElementById("audioClip");

let currentChallenge;

// ============================
// MINI HISTORIAS REALES Y ENSEÑANZAS
// ============================
const miniStories = [
    "💡 Ana perdió su trabajo, inició un proyecto pequeño y ahora ayuda a 50 personas cada semana.",
    "🏆 Carlos decidió meditar 10 minutos cada mañana y lidera su equipo con calma y seguridad.",
    "🌱 Marta aprendió a organizar su día y duplicó su productividad sin estrés.",
    "⚡ Pedro enfrenta retos diarios con resiliencia y se siente más fuerte cada día."
];

const lessons = [
    "Enseñanza: Pequeños hábitos diarios generan grandes resultados.",
    "Enseñanza: La calma y concentración multiplican tu poder interior.",
    "Enseñanza: Ayudar a otros potencia tu bienestar y felicidad.",
    "Enseñanza: Cada reto es una oportunidad de crecimiento."
];

// ============================
// RETOS (acertijos, adivinanzas, consejos)
// ============================
const challenges = [
    {q:"Adivina: Cuanto más quitas, más grande se vuelve. ¿Qué es?", a:"agujero"},
    {q:"Si tienes 3 manzanas y pierdes 1, ¿cuántas te quedan?", a:"2"},
    {q:"💡 Mini consejo: Sonríe y respira profundo antes de continuar.", a:""},
    {q:"Reto de pensamiento: Soy tu amigo y nunca me ves. ¿Quién soy?", a:"aire"},
    {q:"Mini historia: Lucía aprendió que 5 minutos de meditación diaria cambian su día.", a:""},
    {q:"Adivina: Siempre va hacia arriba pero nunca se mueve. ¿Qué es?", a:"edad"}
];

// ============================
// AUDIO
// ============================
const audioClips = [
    "/static/audio/male1.mp3",
    "/static/audio/male2.mp3"
];

function playAudio(){
    let clip = audioClips[Math.floor(Math.random()*audioClips.length)];
    audioClip.src = clip;
    audioClip.play();
}

// ============================
// NUEVO RETO
// ============================
function newChallenge(){
    currentChallenge = challenges[Math.floor(Math.random()*challenges.length)];
    questionEl.innerText = currentChallenge.q;
    feedbackEl.innerText = "";
    miniStoryEl.innerText = miniStories[Math.floor(Math.random()*miniStories.length)];
    lessonBox.innerText = lessons[Math.floor(Math.random()*lessons.length)];
    playAudio();
}

// ============================
// ENVIAR RESPUESTA
// ============================
function sendAnswer(){
    let ans = answerInput.value.trim().toLowerCase();
    if(ans==="") return;

    if(currentChallenge.a===""){
        feedbackEl.innerText = "💥 Excelente! Disfruta la experiencia y sigue aprendiendo.";
    } else if(ans===currentChallenge.a.toLowerCase()){
        feedbackEl.innerText = "💥 Correcto! Dopamina y bienestar activados!";
    } else {
        feedbackEl.innerText = `❌ Incorrecto. La respuesta era: ${currentChallenge.a}`;
    }

    answerInput.value="";
    newChallenge();
}

// ============================
// BOT CHAT MOTIVADOR
// ============================
const botMsgs = [
    "🔥 Respira, sonríe y continúa",
    "💡 Cada reto es aprendizaje",
    "🏆 Tu mente se fortalece con cada respuesta",
    "🌱 Pequeños hábitos generan poder interior"
];

function botChat(){
    let msg = botMsgs[Math.floor(Math.random()*botMsgs.length)];
    let div = document.createElement("div");
    div.className="simulated";
    div.innerText = `AURA_BOT: ${msg}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ============================
// BOT AUTOMÁTICO Y RITMO
// ============================
setInterval(botChat, 12000); // cada 12 segundos

// ============================
// TEMPORIZADOR OPCIONAL
// ============================
function formatTime(s){ return `${Math.floor(s/60)}:${(s%60<10?"0":"")}${s%60}`; }

setInterval(()=>{
    elapsedTime++;
    timeEl.innerText = formatTime(elapsedTime);
    let pct = Math.min((elapsedTime/sessionTime)*100,100);
    progressFill.style.width = pct+"%";
}, 1000);

// ============================
// BOTÓN ADELANTAR JUEGO
// ============================
function skipChallenge(){
    newChallenge();
}

// ============================
// INICIO
// ============================
newChallenge();
