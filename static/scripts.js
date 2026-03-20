/* =================== VARIABLES Y PERSISTENCIA =================== */
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let bloques = [];
let current = 0;
let isBreathing = false; 

let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0, lastDay: null, nivel: 1, disciplina: 40, claridad: 50, calma: 30
};
let completedSessions = JSON.parse(localStorage.getItem("completedSessions")) || [];

/* =================== DICCIONARIO DINÁMICO DE PODER =================== */
const comandos = {
    inhala: ["Absorbe energía", "Inhala poder", "Llénate de vida", "Recibe fuerza", "Toma el control", "Oxigena tu mente"],
    retiene: ["Sostén tu éxito", "Conserva el enfoque", "Mantén la calma", "Retén la sabiduría", "Congela el momento", "Estabiliza tu ser"],
    exhala: ["Libera tensión", "Suelta el pasado", "Exhala con fuerza", "Despeja tu mente", "Expulsa lo innecesario", "Vacía tus dudas"]
};

function getComando(tipo) {
    const lista = comandos[tipo];
    return lista[Math.floor(Math.random() * lista.length)];
}

/* =================== SEGURIDAD: ADVERTENCIA DE CIERRE =================== */
window.addEventListener('beforeunload', (e) => {
    if (isBreathing) {
        e.preventDefault();
        e.returnValue = '⚠ ATENCIÓN: Interrumpir el ciclo de respiración puede afectar su estabilidad biológica. Complete el proceso antes de salir.';
    }
});

/* =================== MOTOR DE VOZ PROFESIONAL =================== */
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

/* =================== RESPIRACIÓN DINÁMICA OBLIGATORIA =================== */
async function breathingAnimation(b){
    block.innerHTML = "";
    isBreathing = true;
    
    const container = document.createElement("div");
    container.style.cssText = "display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:400px; width:100%;";

    const uiLabel = document.createElement("div");
    uiLabel.style.cssText = "font-size:2.3em; font-weight:900; color:#ffffff; margin-bottom:15px; text-align:center; text-transform:uppercase; letter-spacing:2px;";
    
    const uiTimer = document.createElement("div");
    uiTimer.style.cssText = "font-size:1.8em; color:#00d2ff; margin-bottom:40px; font-weight:bold; font-family: monospace;";
    
    const circle = document.createElement("div");
    circle.style.cssText = `
        width: 130px; height: 130px; 
        background: radial-gradient(circle, #00d2ff, #0077ff);
        border-radius: 50%; 
        box-shadow: 0 0 50px rgba(0, 210, 255, 0.6);
        transition: transform 4s cubic-bezier(0.4, 0, 0.2, 1);
        transform: scale(1);
    `;

    container.appendChild(uiLabel);
    container.appendChild(uiTimer);
    container.appendChild(circle);
    block.appendChild(container);

    // Variabilidad de tiempo: Entre 3 y 6 segundos por fase
    const durFase = Math.floor(Math.random() * (6 - 3 + 1)) + 3;
    const fases = [
        { tipo: "inhala", s: 2.2 },
        { tipo: "retiene", s: 2.2 },
        { tipo: "exhala", s: 1.0 },
        { tipo: "retiene", s: 1.0 }
    ];

    for(let f de fases){
        let txt = getComando(f.tipo);
        playVoice(txt);
        uiLabel.innerText = txt;
        
        setTimeout(() => {
            circle.style.transition = `transform ${durFase}s ease-in-out`;
            circle.style.transform = `scale(${f.s})`;
            // Cambio de brillo en retención
            circle.style.boxShadow = (f.tipo === "retiene") ? "0 0 70px rgba(255, 255, 255, 0.8)" : "0 0 50px rgba(0, 210, 255, 0.6)";
        }, 50);

        for(let s = durFase; s > 0; s--){
            uiTimer.innerText = `${s}s`;
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    isBreathing = false;
    uiLabel.innerText = "ENTRENAMIENTO EXITOSO";
    uiTimer.innerText = "";
    nextBtn.style.display = "inline-block";
}

/* =================== GESTIÓN DE BLOQUES E INTERACTIVIDAD =================== */
async function showBlock(b){
    block.innerHTML = "";
    document.body.style.background = b.color || "#070b14";
    nextBtn.style.display = "none";

    const defaultMsg = "En la siguiente sesión lo harás mejor. Siente poder, éxito y bienestar.";

    if(b.tipo === "respiracion"){
        await breathingAnimation(b);
        return;
    }

    // Texto o Pregunta Principal
    const msgPrincipal = b.texto || b.pregunta || defaultMsg;
    block.innerHTML = `<p style='font-size:1.6em; text-align:center; padding:40px; font-weight:300;'>${msgPrincipal}</p>`;
    await playVoice(msgPrincipal);

    // Lógica de Validación para Quizzes / Decisiones
    if(["quiz","acertijo","decision"].includes(b.tipo)){
        const opciones = b.opciones || ["Continuar con éxito"];
        opciones.forEach((op, i) => {
            let btn = document.createElement("button");
            btn.style.cssText = "display:block; width:85%; margin:12px auto; padding:18px; border-radius:12px; border:1px solid #00d2ff; background:rgba(0, 210, 255, 0.05); color:white; cursor:pointer; font-size:1.1em; transition: 0.3s;";
            btn.innerText = op;
            
            btn.onclick = () => {
                // Validación estricta
                if(i === b.correcta){
                    userData.disciplina += 5;
                    alert("✅ Sabiduría aplicada.");
                } else {
                    userData.calma += 2;
                    // Si no hay explicación, usamos el mensaje por defecto concordante
                    alert(`Reflexión: ${b.explicacion || defaultMsg}`);
                }
                localStorage.setItem("kamizenData", JSON.stringify(userData));
                nextBtn.style.display = "inline-block";
                
                // Deshabilitar botones para evitar multi-clic
                Array.from(block.getElementsByTagName('button')).forEach(b => b.disabled = true);
            };
            block.appendChild(btn);
        });
    } else if(b.tipo === "cierre"){
        completedSessions.push(currentSessionIndex);
        localStorage.setItem("completedSessions", JSON.stringify(completedSessions));
        localStorage.setItem("kamizenData", JSON.stringify(userData));
        restartBtn.style.display = "inline-block";
    } else {
        // Bloque informativo simple
        setTimeout(() => { nextBtn.style.display = "inline-block"; }, 3000);
    }
}

/* =================== FLUJO DE SESIONES EXPERTO =================== */
let currentSessionIndex = 0;
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    try {
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
    } catch (e) {
        console.error("Error cargando sesión:", e);
    }
});

nextBtn.addEventListener("click", () => {
    current++;
    if(current < bloques.length) showBlock(bloques[current]);
});

restartBtn.addEventListener("click", () => location.reload());
