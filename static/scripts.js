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
    inhala: ["Absorbe energía", "Inhala poder", "Llénate de vida", "Recibe fuerza", "Toma el control"],
    retiene: ["Sostén tu éxito", "Conserva el enfoque", "Mantén la calma", "Retén la sabiduría", "Estabiliza tu ser"],
    exhala: ["Libera tensión", "Suelta el pasado", "Exhala con fuerza", "Despeja tu mente", "Expulsa lo innecesario"]
};

function getComando(tipo) {
    const lista = comandos[tipo];
    return lista[Math.floor(Math.random() * lista.length)];
}

/* =================== MOTOR DE VOZ =================== */
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

/* =================== RESPIRACIÓN OBLIGATORIA Y DINÁMICA =================== */
async function breathingAnimation(b){
    block.innerHTML = "";
    isBreathing = true;
    
    const container = document.createElement("div");
    container.style.cssText = "display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:400px; width:100%;";

    const uiLabel = document.createElement("div");
    uiLabel.style.cssText = "font-size:2.2em; font-weight:900; color:#ffffff; margin-bottom:15px; text-align:center; text-transform:uppercase;";
    
    const uiTimer = document.createElement("div");
    uiTimer.style.cssText = "font-size:1.8em; color:#00d2ff; margin-bottom:40px; font-weight:bold;";
    
    const circle = document.createElement("div");
    circle.style.cssText = "width:120px; height:120px; background:radial-gradient(circle, #00d2ff, #0077ff); border-radius:50%; box-shadow:0 0 40px rgba(0,210,255,0.6); transition:transform 4s ease-in-out; transform:scale(1);";

    container.appendChild(uiLabel);
    container.appendChild(uiTimer);
    container.appendChild(circle);
    block.appendChild(container);

    const durFase = Math.floor(Math.random() * 3) + 4; // Entre 4 y 6 segundos
    const fases = [
        { tipo: "inhala", s: 2.2 },
        { tipo: "retiene", s: 2.2 },
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
        }, 50);

        for(let s = durFase; s > 0; s--){
            uiTimer.innerText = `${s}s`;
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    isBreathing = false;
    uiLabel.innerText = "CICLO COMPLETADO";
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

    const contenido = b.texto || b.pregunta || defaultMsg;
    block.innerHTML = `<p style='font-size:1.6em; text-align:center; padding:30px;'>${contenido}</p>`;
    await playVoice(contenido);

    if(["quiz","acertijo","decision"].includes(b.tipo)){
        const opciones = b.opciones || ["Continuar"];
        opciones.forEach((op, i) => {
            let btn = document.createElement("button");
            btn.style.cssText = "display:block; width:85%; margin:15px auto; padding:18px; border-radius:12px; border:1px solid #00d2ff; background:rgba(0,210,255,0.1); color:white; font-size:1.1em; cursor:pointer;";
            btn.innerText = op;
            btn.onclick = () => {
                if(i === b.correcta){
                    userData.disciplina += 5;
                    alert("✅ Sabiduría aplicada.");
                } else {
                    userData.calma += 2;
                    alert(`Reflexión: ${b.explicacion || defaultMsg}`);
                }
                localStorage.setItem("kamizenData", JSON.stringify(userData));
                nextBtn.style.display = "inline-block";
                Array.from(block.getElementsByTagName('button')).forEach(b => b.disabled = true);
            };
            block.appendChild(btn);
        });
    } else if(b.tipo === "cierre"){
        completedSessions.push(currentSessionIndex);
        localStorage.setItem("completedSessions", JSON.stringify(completedSessions));
        restartBtn.style.display = "inline-block";
    } else {
        setTimeout(() => { nextBtn.style.display = "inline-block"; }, 3000);
    }
}

/* =================== INICIO DE SESIÓN SEGURO =================== */
let currentSessionIndex = 0;
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    try {
        const res = await fetch("/session_content");
        if(!res.ok) throw new Error();
        const data = await res.json();
        const sesiones = data.sesiones;

        let available = sesiones.map((_,i) => i).filter(i => !completedSessions.includes(i));
        if(available.length === 0) {
            completedSessions = [];
            available = sesiones.map((_,i) => i);
        }
        currentSessionIndex = available[Math.floor(Math.random() * available.length)];
        bloques = sesiones[currentSessionIndex].bloques;
    } catch (e) {
        // SESIÓN DE EMERGENCIA SI EL FETCH FALLA (EVITA CONGELAMIENTO)
        bloques = [
            { tipo: "info", texto: "Iniciando protocolo de respaldo AL CIELO.", color: "#070b14" },
            { tipo: "respiracion", duracion: 30 },
            { tipo: "quiz", pregunta: "¿El control reside en tu mente?", opciones: ["Sí", "No"], correcta: 0, explicacion: "El poder es tuyo." },
            { tipo: "cierre", texto: "Sesión de respaldo finalizada." }
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
