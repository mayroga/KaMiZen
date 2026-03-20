/* =================== VARIABLES PRINCIPALES =================== */
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");
const forwardBtn = document.getElementById("forward-btn");
const block = document.getElementById("block");

let bloques = [];
let current = 0;
let puntos = 0;
let currentSessionIndex = 0;

/* =================== PERSISTENCIA DE DATOS =================== */
let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0, lastDay: null, nivel: 1, disciplina: 40, claridad: 50, calma: 30
};

// Recuperar sesiones completadas para evitar repeticiones
let completedSessions = JSON.parse(localStorage.getItem("completedSessions")) || [];

function updatePanel(){
    const stats = ["disciplina", "claridad", "calma"];
    stats.forEach(s => { if(userData[s] < 0) userData[s] = 0; });
    
    document.getElementById("streak").innerHTML = `🔥 Racha: ${userData.streak} días`;
    document.getElementById("level").innerHTML = `Nivel KaMiZen: ${userData.nivel}`;
    document.getElementById("disciplina-bar").style.width = userData.disciplina + "%";
    document.getElementById("claridad-bar").style.width = userData.claridad + "%";
    document.getElementById("calma-bar").style.width = userData.calma + "%";
}
updatePanel();

/* =================== LOGICA DE ASESORIA =================== */
function penalizar(){
    userData.disciplina = Math.floor(userData.disciplina * 0.8);
    userData.claridad = Math.floor(userData.claridad * 0.1);
    alert("⚠ Acción no sugerida. Disciplina y claridad reducidas.");
    updatePanel();
}

function updateStreak(){
    let today = new Date().toDateString();
    if(userData.lastDay !== today){
        userData.streak += 1;
        userData.lastDay = today;
    }
}

function playVoice(text){
    return new Promise(resolve => {
        speechSynthesis.cancel();
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.9;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* =================== RESPIRACION EN MOVIMIENTO REAL =================== */
async function breathingAnimation(b){
    block.innerHTML = "";
    
    // UI de Respiración
    let uiLabel = document.createElement("div");
    uiLabel.style.cssText = "font-size:2em; font-weight:bold; margin-bottom:10px; text-align:center;";
    
    let uiTimer = document.createElement("div");
    uiTimer.style.cssText = "font-size:1.5em; color:#60a5fa; margin-bottom:30px; text-align:center;";
    
    let circle = document.createElement("div");
    circle.className = "breath-circle";
    circle.style.cssText = "width:150px; height:150px; background:#60a5fa; border-radius:50%; margin:0 auto; transition: transform 4s ease-in-out; box-shadow: 0 0 50px #60a5fa;";

    block.appendChild(uiLabel);
    block.appendChild(uiTimer);
    block.appendChild(circle);

    const fases = [
        {t:"Inhala", scale:1.8, dur:4},
        {t:"Retiene", scale:1.8, dur:4},
        {t:"Exhala", scale:1, dur:4},
        {t:"Retiene", scale:1, dur:4}
    ];

    let rounds = Math.ceil((b.duracion || 32) / 4);

    for(let i=0; i < rounds; i++){
        let f = fases[i % 4];
        
        // Voz y Animación simultánea
        playVoice(f.t); 
        uiLabel.innerText = f.t;
        circle.style.transition = `transform ${f.dur}s ease-in-out`;
        circle.style.transform = `scale(${f.scale})`;

        // Contador de precisión
        for(let s = f.dur; s > 0; s--){
            uiTimer.innerText = `${s}s`;
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    uiLabel.innerText = "Paz Interior";
    uiTimer.innerText = "";
    nextBtn.style.display = "inline-block";
}

/* =================== GESTION DE BLOQUES =================== */
async function showBlock(b){
    block.innerHTML = "";
    document.body.style.background = b.color || "#0f172a";
    nextBtn.style.display = "none";

    if(b.tipo === "respiracion"){
        await breathingAnimation(b);
        return;
    }

    if(b.texto) {
        block.innerHTML = `<p style='font-size:1.3em; line-height:1.6;'>${b.texto}</p>`;
        await playVoice(b.texto);
    }

    if(["quiz","acertijo","decision"].includes(b.tipo)){
        block.innerHTML = `<h3>${b.pregunta}</h3>`;
        b.opciones.forEach((op, i) => {
            let btn = document.createElement("button");
            btn.innerText = op;
            btn.onclick = () => {
                if(i === b.correcta){
                    userData.disciplina += 2; alert("✅ Correcto");
                } else {
                    userData.calma += 1; alert(`Respuesta: ${b.explicacion}`);
                }
                updatePanel();
                nextBtn.style.display = "inline-block";
            };
            block.appendChild(btn);
        });
        await playVoice(b.pregunta);
    } else if(b.tipo === "cierre"){
        completedSessions.push(currentSessionIndex);
        localStorage.setItem("completedSessions", JSON.stringify(completedSessions));
        updateStreak();
        localStorage.setItem("kamizenData", JSON.stringify(userData));
        restartBtn.style.display = "inline-block";
    } else {
        setTimeout(() => { nextBtn.style.display = "inline-block"; }, 3000);
    }
}

/* =================== CONTROL DE SESIONES (SIN REPETIR) =================== */
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    const res = await fetch("/session_content");
    const data = await res.json();
    const sesiones = data.sesiones;

    let available = sesiones.map((_,i) => i).filter(i => !completedSessions.includes(i));
    
    if(available.length === 0){
        completedSessions = [];
        localStorage.removeItem("completedSessions");
        available = sesiones.map((_,i) => i);
    }

    currentSessionIndex = available[Math.floor(Math.random() * available.length)];
    bloques = sesiones[currentSessionIndex].bloques;
    current = 0;
    showBlock(bloques[0]);
});

/* =================== EVENTOS =================== */
nextBtn.addEventListener("click", () => { current++; if(current < bloques.length) showBlock(bloques[current]); });
backBtn.addEventListener("click", () => { penalizar(); if(current > 0) { current--; showBlock(bloques[current]); } });
forwardBtn.addEventListener("click", () => { penalizar(); if(current < bloques.length - 1) { current++; showBlock(bloques[current]); } });
restartBtn.addEventListener("click", () => location.reload());
