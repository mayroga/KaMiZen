/* =================== VARIABLES Y PERSISTENCIA =================== */
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let bloques = [];
let current = 0;
let isBreathing = false; // Flag para seguridad biológica

let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0, lastDay: null, nivel: 1, disciplina: 40, claridad: 50, calma: 30
};
let completedSessions = JSON.parse(localStorage.getItem("completedSessions")) || [];

/* =================== DICCIONARIO DINÁMICO DE PODER =================== */
const comandos = {
    inhala: ["Absorbe energía", "Inhala poder", "Llénate de vida", "Recibe fuerza", "Toma el control"],
    retiene: ["Sostén tu éxito", "Conserva el enfoque", "Mantén la calma", "Retén la sabiduría", "Congela el momento"],
    exhala: ["Libera tensión", "Suelta el pasado", "Exhala con fuerza", "Despeja tu mente", "Expulsa lo innecesario"]
};

function getComando(tipo) {
    const lista = comandos[tipo];
    return lista[Math.floor(Math.random() * lista.length)];
}

/* =================== SEGURIDAD: ADVERTENCIA DE CIERRE =================== */
window.addEventListener('beforeunload', (e) => {
    if (isBreathing) {
        // Mensaje estándar del navegador (el texto personalizado varía según el browser)
        e.preventDefault();
        e.returnValue = '⚠ ATENCIÓN: Interrumpir el ciclo de respiración puede afectar su estabilidad. Complete el proceso de exhalación antes de salir.';
    }
});

/* =================== MOTOR DE VOZ PROFESIONAL =================== */
function playVoice(text){
    return new Promise(resolve => {
        speechSynthesis.cancel();
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.85; // Un poco más pausado para dar peso a la instrucción
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* =================== RESPIRACIÓN DINÁMICA DE ALTO NIVEL =================== */
async function breathingAnimation(b){
    block.innerHTML = "";
    isBreathing = true;
    
    const container = document.createElement("div");
    container.style.cssText = "display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:400px; width:100%;";

    const uiLabel = document.createElement("div");
    uiLabel.style.cssText = "font-size:2.3em; font-weight:900; color:#ffffff; margin-bottom:15px; text-align:center; text-transform:uppercase; letter-spacing:2px; transition: all 0.5s ease;";
    
    const uiTimer = document.createElement("div");
    uiTimer.style.cssText = "font-size:1.8em; color:#00d2ff; margin-bottom:40px; font-weight:bold; font-family: 'Courier New', monospace;";
    
    const circle = document.createElement("div");
    circle.style.cssText = `
        width: 130px; 
        height: 130px; 
        background: radial-gradient(circle, #00d2ff, #0077ff);
        border-radius: 50%; 
        box-shadow: 0 0 50px rgba(0, 210, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.4);
        transition: transform 4s cubic-bezier(0.4, 0, 0.2, 1);
        transform: scale(1);
    `;

    container.appendChild(uiLabel);
    container.appendChild(uiTimer);
    container.appendChild(circle);
    block.appendChild(container);

    let totalRounds = Math.ceil((b.duracion || 32) / 4);

    for(let i=0; i < totalRounds; i++){
        const faseActual = i % 4;
        let config;

        // Lógica de fases con variaciones de texto
        if(faseActual === 0) config = { t: getComando("inhala"), s: 2.1 };
        else if(faseActual === 1) config = { t: getComando("retiene"), s: 2.1 };
        else if(faseActual === 2) config = { t: getComando("exhala"), s: 1.0 };
        else config = { t: getComando("retiene"), s: 1.0 };

        playVoice(config.t);
        uiLabel.innerText = config.t;
        
        // Ejecución visual inmediata
        setTimeout(() => {
            circle.style.transform = `scale(${config.s})`;
            if(faseActual === 1 || faseActual === 3) circle.style.boxShadow = "0 0 70px rgba(255, 255, 255, 0.8)";
            else circle.style.boxShadow = "0 0 50px rgba(0, 210, 255, 0.6)";
        }, 50);

        for(let s = 4; s > 0; s--){
            uiTimer.innerText = `${s}s`;
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    isBreathing = false;
    uiLabel.innerText = "ENTRENAMIENTO EXITOSO";
    uiTimer.innerText = "";
    nextBtn.style.display = "inline-block";
}

/* =================== LÓGICA DE FLUJO SIN REPETICIÓN =================== */
async function showBlock(b){
    block.innerHTML = "";
    document.body.style.background = b.color || "#070b14";
    nextBtn.style.display = "none";

    if(b.tipo === "respiracion"){
        await breathingAnimation(b);
        return;
    }

    if(b.texto){
        block.innerHTML = `<p style='font-size:1.6em; text-align:center; padding:40px; font-weight:300;'>${b.texto}</p>`;
        await playVoice(b.texto);
    }

    if(["quiz","acertijo","decision"].includes(b.tipo)){
        block.innerHTML = `<h3 style='margin-bottom:30px; text-align:center; font-size:1.8em;'>${b.pregunta}</h3>`;
        b.opciones.forEach((op, i) => {
            let btn = document.createElement("button");
            btn.style.cssText = "display:block; width:80%; margin:10px auto; padding:15px; border-radius:10px; border:1px solid #00d2ff; background:transparent; color:white; cursor:pointer; font-size:1.1em;";
            btn.innerText = op;
            btn.onclick = () => {
                if(i === b.correcta){ userData.disciplina += 5; alert("✅ Sabiduría aplicada."); }
                else { userData.calma += 2; alert(`Reflexión: ${b.explicacion}`); }
                localStorage.setItem("kamizenData", JSON.stringify(userData));
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

/* =================== INICIO DE SESIÓN EXPERTO =================== */
let currentSessionIndex = 0;
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

nextBtn.addEventListener("click", () => {
    current++;
    if(current < bloques.length) showBlock(bloques[current]);
});

restartBtn.addEventListener("click", () => location.reload());
