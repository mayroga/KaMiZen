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

/* =================== DATOS Y PERSISTENCIA =================== */
let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0, lastDay: null, nivel: 1, disciplina: 40, claridad: 50, calma: 30
};
let completedSessions = JSON.parse(localStorage.getItem("completedSessions")) || [];

function updatePanel(){
    document.getElementById("streak").innerHTML = `🔥 Racha: ${userData.streak} días`;
    document.getElementById("level").innerHTML = `Nivel KaMiZen: ${userData.nivel}`;
    document.getElementById("disciplina-bar").style.width = (userData.disciplina || 0) + "%";
    document.getElementById("claridad-bar").style.width = (userData.claridad || 0) + "%";
    document.getElementById("calma-bar").style.width = (userData.calma || 0) + "%";
}
updatePanel();

/* =================== VOZ =================== */
function playVoice(text){
    return new Promise(resolve => {
        speechSynthesis.cancel();
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.85;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* =================== RESPIRACIÓN PROFESIONAL (CORREGIDA) =================== */
async function breathingAnimation(b){
    block.innerHTML = "";
    
    // Contenedor para que nada se tape
    const container = document.createElement("div");
    container.style.cssText = "display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px;";

    const uiLabel = document.createElement("div");
    uiLabel.style.cssText = "font-size:2.2em; font-weight:bold; color:white; margin-bottom:10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);";
    
    const uiTimer = document.createElement("div");
    uiTimer.style.cssText = "font-size:1.5em; color:#00d2ff; margin-bottom:40px; font-family:monospace;";
    
    // Globo Azul Eléctrico - Tamaño Proporcional
    const circle = document.createElement("div");
    circle.style.cssText = `
        width: 100px; 
        height: 100px; 
        background: radial-gradient(circle, #00d2ff, #3a86ff);
        border-radius: 50%; 
        box-shadow: 0 0 30px rgba(0, 210, 255, 0.8), inset 0 0 15px rgba(255,255,255,0.5);
        transition: transform 4s cubic-bezier(0.42, 0, 0.58, 1);
        transform: scale(1);
    `;

    container.appendChild(uiLabel);
    container.appendChild(uiTimer);
    container.appendChild(circle);
    block.appendChild(container);

    const fases = [
        {t:"Inhala", scale:2.2, dur:4},
        {t:"Retiene", scale:2.2, dur:4},
        {t:"Exhala", scale:1.0, dur:4},
        {t:"Retiene", scale:1.0, dur:4}
    ];

    let totalRounds = Math.ceil((b.duracion || 32) / 4);

    for(let i=0; i < totalRounds; i++){
        let f = fases[i % 4];
        
        // Ejecución inmediata de voz y escala
        playVoice(f.t);
        uiLabel.innerText = f.t;
        
        // Forzar al navegador a procesar la escala
        setTimeout(() => {
            circle.style.transition = `transform ${f.dur}s ease-in-out`;
            circle.style.transform = `scale(${f.scale})`;
        }, 50);

        // Contador visual
        for(let s = f.dur; s > 0; s--){
            uiTimer.innerText = `Sostén: ${s}s`;
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    uiLabel.innerText = "Sesión Completa";
    uiTimer.innerText = "";
    nextBtn.style.display = "inline-block";
}

/* =================== GESTIÓN DE BLOQUES =================== */
async function showBlock(b){
    block.innerHTML = "";
    document.body.style.background = b.color || "#0f172a";
    nextBtn.style.display = "none";

    if(b.tipo === "respiracion"){
        await breathingAnimation(b);
        return;
    }

    if(b.texto){
        block.innerHTML = `<p style='font-size:1.4em; padding:20px; text-align:center;'>${b.texto}</p>`;
        await playVoice(b.texto);
    }

    if(["quiz","acertijo","decision"].includes(b.tipo)){
        block.innerHTML = `<h3 style='margin-bottom:20px;'>${b.pregunta}</h3>`;
        b.opciones.forEach((op, i) => {
            let btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = op;
            btn.onclick = () => {
                if(i === b.correcta){ userData.disciplina += 2; alert("✅ Correcto"); }
                else { userData.calma += 1; alert(`Info: ${b.explicacion}`); }
                updatePanel();
                nextBtn.style.display = "inline-block";
            };
            block.appendChild(btn);
        });
        await playVoice(b.pregunta);
    } else if(b.tipo === "cierre"){
        completedSessions.push(currentSessionIndex);
        localStorage.setItem("completedSessions", JSON.stringify(completedSessions));
        localStorage.setItem("kamizenData", JSON.stringify(userData));
        restartBtn.style.display = "inline-block";
    } else {
        setTimeout(() => { nextBtn.style.display = "inline-block"; }, 3000);
    }
}

/* =================== INICIO SESIÓN =================== */
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    const res = await fetch("/session_content");
    const data = await res.json();
    const sesiones = data.sesiones;

    let available = sesiones.map((_,i) => i).filter(i => !completedSessions.includes(i));
    if(available.length === 0){
        completedSessions = [];
        available = sesiones.map((_,i) => i);
    }

    currentSessionIndex = available[Math.floor(Math.random() * available.length)];
    bloques = sesiones[currentSessionIndex].bloques;
    current = 0;
    showBlock(bloques[0]);
});

/* =================== EVENTOS =================== */
nextBtn.addEventListener("click", () => { current++; if(current < bloques.length) showBlock(bloques[current]); });
restartBtn.addEventListener("click", () => location.reload());
