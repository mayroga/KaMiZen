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
    retiene: ["Sostén tu éxito", "Conserva el enfoque", "Mantén la calma", "Retén la sabiduría", "Estabiliza tu ser"],
    exhala: ["Libera tensión", "Suelta el pasado", "Exhala con fuerza", "Despeja tu mente", "Expulsa lo innecesario", "Vacía tus dudas"]
};

function getComando(tipo) {
    const lista = comandos[tipo];
    return lista[Math.floor(Math.random() * lista.length)];
}

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

/* =================== RESPIRACIÓN: CICLO COMPLETO E INVISIBLE AL TEXTO =================== */
async function breathingAnimation(b){
    block.innerHTML = "";
    isBreathing = true;
    
    // Contenedor con scroll bloqueado y espacio superior para el texto
    const container = document.createElement("div");
    container.style.cssText = "display:flex; flex-direction:column; align-items:center; justify-content:flex-start; min-height:450px; width:100%; padding-top:20px;";

    const uiLabel = document.createElement("div");
    uiLabel.style.cssText = "font-size:2.3em; font-weight:900; color:#ffffff; height:80px; text-align:center; text-transform:uppercase; margin-bottom:10px;";
    
    const uiTimer = document.createElement("div");
    uiTimer.style.cssText = "font-size:2em; color:#00d2ff; font-weight:bold; margin-bottom:20px; font-family: monospace;";
    
    // Globo Azul: Tamaño máximo controlado para no tapar el texto superior
    const circle = document.createElement("div");
    circle.style.cssText = `
        width: 100px; height: 100px; 
        background: radial-gradient(circle, #00d2ff, #0077ff);
        border-radius: 50%; 
        box-shadow: 0 0 50px rgba(0, 210, 255, 0.6);
        transition: transform 4s cubic-bezier(0.4, 0, 0.2, 1);
        transform: scale(1);
        margin-top: 20px;
    `;

    container.appendChild(uiLabel);
    container.appendChild(uiTimer);
    container.appendChild(circle);
    block.appendChild(container);

    const durFase = Math.floor(Math.random() * (6 - 4 + 1)) + 4; // Entre 4 y 6 segundos
    const fases = [
        { tipo: "inhala", s: 2.0 },
        { tipo: "retiene", s: 2.0 },
        { tipo: "exhala", s: 1.0 },
        { tipo: "retiene", s: 1.0 }
    ];

    for(let f of fases){
        let txt = getComando(f.tipo);
        uiLabel.innerText = txt;
        playVoice(txt);
        
        setTimeout(() => {
            circle.style.transition = `transform ${durFase}s ease-in-out`;
            circle.style.transform = `scale(${f.s})`;
            circle.style.boxShadow = (f.tipo === "retiene") ? "0 0 80px white" : "0 0 50px #00d2ff";
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

/* =================== GESTIÓN DE BLOQUES CON VALIDACIÓN Y EXPLICACIÓN =================== */
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
    const textToShow = b.texto || b.pregunta || defaultMsg;
    block.innerHTML = `<p style='font-size:1.6em; text-align:center; padding:30px; font-weight:300;'>${textToShow}</p>`;
    await playVoice(textToShow);

    // Lógica de Validación Detallada
    if(["quiz","acertijo","decision"].includes(b.tipo)){
        const opciones = b.opciones || ["Continuar"];
        opciones.forEach((op, i) => {
            let btn = document.createElement("button");
            btn.style.cssText = "display:block; width:85%; margin:12px auto; padding:18px; border-radius:12px; border:1px solid #00d2ff; background:rgba(0, 210, 255, 0.1); color:white; font-size:1.1em; cursor:pointer;";
            btn.innerText = op;
            
            btn.onclick = () => {
                const explicacion = b.explicacion || defaultMsg;
                
                if(i === b.correcta){
                    userData.disciplina += 5;
                    alert(`✅ CORRECTO\n\n${explicacion}`);
                } else {
                    userData.calma += 2;
                    alert(`❌ INCORRECTO\n\nReflexión: ${explicacion}`);
                }
                
                localStorage.setItem("kamizenData", JSON.stringify(userData));
                nextBtn.style.display = "inline-block";
                
                // Deshabilitar botones para forzar el avance
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
        setTimeout(() => { nextBtn.style.display = "inline-block"; }, 3000);
    }
}

/* =================== FLUJO DE SESIÓN Y CARGA SEGURA =================== */
let currentSessionIndex = 0;
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    try {
        const res = await fetch("/session_content");
        if(!res.ok) throw new Error();
        const data = await res.json();
        const sesiones = data.sesiones;

        let available = sesiones.map((_,i) => i).filter(i => !completedSessions.includes(i));
        if(available.length === 0){
            completedSessions = [];
            available = sesiones.map((_,i) => i);
        }

        currentSessionIndex = available[Math.floor(Math.random() * available.length)];
        bloques = sesiones[currentSessionIndex].bloques;
    } catch (e) {
        // Sesión de Respaldo Inmediata
        bloques = [
            { tipo: "info", texto: "Protocolo de Poder AL CIELO Activado.", color: "#070b14" },
            { tipo: "respiracion", duracion: 30 },
            { tipo: "quiz", pregunta: "¿Es la disciplina la base del éxito?", opciones: ["Sí", "No"], correcta: 0, explicacion: "La disciplina vence al talento cuando el talento no se disciplina." },
            { tipo: "cierre", texto: "Sesión completada con éxito." }
        ];
    }
    current = 0;
    showBlock(bloques[0]);
});

nextBtn.addEventListener("click", () => {
    current++;
    if(current < bloques.length) showBlock(bloques[current]);
});

restartBtn.addEventListener("click", () => location.reload());
