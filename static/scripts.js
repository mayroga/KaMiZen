// ============================
// KaMiZen – Juegos Mentales y Historias
// ============================

let currentGame;
let userLevel = 1;
let elapsedTime = 0;
let sessionTime = 600; // 10 min
let askedQuestions = new Set();

const questionEl = document.getElementById("question");
const feedbackEl = document.getElementById("feedback");
const answerInput = document.getElementById("answerInput");
const timeEl = document.getElementById("time");
const progressFill = document.getElementById("progressFill");
const rankingEl = document.getElementById("ranking");
const miniStoryEl = document.getElementById("miniStory");
const audioClip = document.getElementById("audioClip");

// -----------------------------
// RETOS
// -----------------------------
function generateGame(){
    const games = [
        // Matemáticas
        () => {
            let a=Math.floor(Math.random()*20+1), b=Math.floor(Math.random()*20+1);
            return {q:`Si sumas ${a} + ${b}, ¿cuánto es?`, a:`${a+b}`};
        },
        // Adivinanzas
        () => {
            return {q:"Blanca por dentro, verde por fuera. Si quieres que te lo diga, espera la respuesta...", a:"pera"};
        },
        // Mini historias de éxito
        () => {
            const stories = [
                "💎 Pedro duplicó su productividad haciendo 10 min de enfoque diario.",
                "🌱 Ana mejoró su bienestar meditando 5 min cada mañana.",
                "🚀 Marta tomó una decisión arriesgada y lidera un equipo exitoso."
            ];
            let s = stories[Math.floor(Math.random()*stories.length)];
            return {q:s, a:""}; // sin respuesta concreta
        },
        // Decisiones tipo trading
        () => {
            return {q:"Tienes $100. Puedes arriesgar $50 con 50% chance de duplicarlo o mantenerlo seguro. ¿Qué eliges? (arriesgar/seguro)", a:["arriesgar","seguro"]};
        }
    ];
    let game;
    do {
        game = games[Math.floor(Math.random()*games.length)]();
    } while(askedQuestions.has(game.q));
    askedQuestions.add(game.q);
    return game;
}

// -----------------------------
// AUDIO Y MINI HISTORIAS
// -----------------------------
function playAudio(){
    const clips = ["/static/audio/male1.mp3","/static/audio/male2.mp3"];
    audioClip.src = clips[Math.floor(Math.random()*clips.length)];
    audioClip.play();
}

function newChallenge(){
    currentGame = generateGame();
    questionEl.innerText = currentGame.q;
    feedbackEl.innerText = "";
    miniStoryEl.innerText = currentGame.a=="" ? "💡 Reflexiona sobre esto y aprende algo nuevo!" : "";
    playAudio();
}

// -----------------------------
// RESPONDER
// -----------------------------
function sendAnswer(){
    let ans = answerInput.value.trim().toLowerCase();
    if(ans==="") return;

    let correct = currentGame.a;
    let isCorrect = (Array.isArray(correct) ? correct.map(x=>x.toLowerCase()).includes(ans) : ans === correct.toLowerCase());

    if(isCorrect || correct===""){
        userLevel++;
        feedbackEl.innerText = "💥 Correcto! Dopamina activada!";
    } else {
        feedbackEl.innerText = `❌ Incorrecto. Era: ${Array.isArray(correct)?correct.join("/") : correct}`;
    }
    answerInput.value="";
}

// -----------------------------
// VER RESPUESTA
// -----------------------------
function showAnswer(){
    if(Array.isArray(currentGame.a)) feedbackEl.innerText = "Respuesta: " + currentGame.a.join("/");
    else feedbackEl.innerText = "Respuesta: " + currentGame.a;
}

// -----------------------------
// SIGUIENTE RETO
// -----------------------------
function nextChallenge(){
    newChallenge();
}

// -----------------------------
// BARRA DE TIEMPO
// -----------------------------
function formatTime(s){return `${Math.floor(s/60)}:${(s%60<10?"0":"")}${s%60}`;}
setInterval(()=>{
    if(elapsedTime>=sessionTime) {
        questionEl.innerText="⏳ Sesión finalizada. ¡Felicidades!";
        feedbackEl.innerText="";
        return;
    }
    elapsedTime++;
    timeEl.innerText = formatTime(sessionTime-elapsedTime);
    progressFill.style.width = (elapsedTime/sessionTime*100)+"%";
},1000);

// -----------------------------
// INICIO
// -----------------------------
newChallenge();
