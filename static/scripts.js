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

/* =================== PANEL DE ESTADÍSTICAS =================== */
function updatePanel(){
    document.getElementById("streak").innerHTML = `🔥 Racha: ${userData.streak} días`;
    document.getElementById("level").innerHTML = `Nivel KaMiZen: ${userData.nivel}`;
    document.getElementById("disciplina-bar").style.width = (userData.disciplina || 0) + "%";
    document.getElementById("claridad-bar").style.width = (userData.claridad || 0) + "%";
    document.getElementById("calma-bar").style.width = (userData.calma || 0) + "%";
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}
updatePanel();

/* =================== MOTOR DE VOZ (COACH) =================== */
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

/* =================== RESPIRACIÓN: PROPÓSITO Y VIDA =================== */
async function breathingAnimation(b){
    block.innerHTML = "";
    isBreathing = true;
    
    // Introducción del Coach sobre el POR QUÉ
    const introRespiracion = "Alumno, vamos a reprogramar tu sistema nervioso. Esta respiración limpia toxinas y enfoca tu voluntad. Sigue el globo.";
    block.innerHTML = `<p style='font-size:1.4em; text-align:center; color:#00d2ff; padding:20px;'>${introRespiracion}</p>`;
    await playVoice(introRespiracion);
    block.innerHTML = "";

    const container = document.createElement("div");
    container.style.cssText = "display:flex; flex-direction:column; align-items:center; justify-content:flex-start; min-height:450px; width:100%;";

    const uiLabel = document.createElement("div");
    uiLabel.style.cssText = "font-size:2.2em; font-weight:900; color:#ffffff; height:80px; text-align:center; text-transform:uppercase;";
    
    const uiTimer = document.createElement("div");
    uiTimer.style.cssText = "font-size:2em; color:#00d2ff; font-weight:bold; margin-bottom:10px;";
    
    const circle = document.createElement("div");
    circle.style.cssText = "width:110px; height:110px; background:radial-gradient(circle, #00d2ff, #0077ff); border-radius:50%; box-shadow:0 0 40px #00d2ff; transition:transform 4s ease-in-out; margin-top:30px;";

    container.appendChild(uiLabel);
    container.appendChild(uiTimer);
    container.appendChild(circle);
    block.appendChild(container);

    const durFase = Math.floor(Math.random() * 3) + 4; 
    const fases = [{t:"inhala", s:2.0}, {t:"retiene", s:2.0}, {t:"exhala", s:1.0}, {t:"retiene", s:1.0}];

    const comandos = {
        inhala: ["Absorbe energía", "Inhala poder", "Llénate de vida"],
        retiene: ["Sostén tu éxito", "Conserva el enfoque", "Estabiliza tu ser"],
        exhala: ["Libera tensión", "Suelta el pasado", "Expulsa lo innecesario"]
    };

    for(let f of fases){
        let txt = comandos[f.t][Math.floor(Math.random()*3)];
        uiLabel.innerText = txt;
        playVoice(txt);
        setTimeout(() => { circle.style.transition = `transform ${durFase}s ease-in-out`; circle.style.transform = `scale(${f.s})`; }, 50);
        for(let s = durFase; s > 0; s--){ uiTimer.innerText = `${s}s`; await new Promise(r => setTimeout(r, 1000)); }
    }

    isBreathing = false;
    uiLabel.innerText = "¡PODER ALCANZADO!";
    nextBtn.style.display = "inline-block";
}

/* =================== GESTIÓN DE BLOQUES: EL MODO MENTOR =================== */
async function showBlock(b){
    block.innerHTML = "";
    document.body.style.background = b.color || "#070b14";
    nextBtn.style.display = "none";

    if(b.tipo === "respiracion"){ await breathingAnimation(b); return; }

    const textToShow = b.texto || b.pregunta || "Continúa tu entrenamiento hacia el éxito.";
    block.innerHTML = `<p id='main-text' style='font-size:1.6em; text-align:center; padding:30px;'>${textToShow}</p>`;
    await playVoice(textToShow);

    if(["quiz","acertijo","decision"].includes(b.tipo)){
        const feedbackArea = document.createElement("div");
        feedbackArea.style.cssText = "margin-top:20px; padding:15px; border-radius:10px; background:rgba(255,255,255,0.05); color:#00d2ff; text-align:center; font-style:italic; min-height:60px;";
        feedbackArea.innerText = "Selecciona una opción para aprender...";
        
        b.opciones.forEach((op, i) => {
            let btn = document.createElement("button");
            btn.className = "option-btn";
            btn.style.cssText = "display:block; width:85%; margin:10px auto; padding:15px; border-radius:10px; border:1px solid #00d2ff; background:transparent; color:white; cursor:pointer;";
            btn.innerText = op;
            
            btn.onclick = async () => {
                const esCorrecto = (i === b.correcta);
                const prefijo = esCorrecto ? "✅ ¡EXCELENTE! " : "❌ REFLEXIÓN: ";
                const explicacion = b.explicacion || "Este conocimiento es vital para tu crecimiento.";
                
                feedbackArea.innerText = prefijo + explicacion;
                await playVoice(prefijo + explicacion);

                if(esCorrecto) {
                    userData.disciplina += 5;
                    updatePanel();
                    nextBtn.style.display = "inline-block"; // Solo el éxito permite avanzar
                } else {
                    userData.calma += 2;
                    updatePanel();
                    // No bloqueamos los otros botones; el alumno puede seguir explorando
                }
            };
            block.appendChild(btn);
        });
        block.appendChild(feedbackArea);
    } else if(b.tipo === "cierre"){
        completedSessions.push(currentSessionIndex);
        localStorage.setItem("completedSessions", JSON.stringify(completedSessions));
        restartBtn.style.display = "inline-block";
    } else {
        setTimeout(() => { nextBtn.style.display = "inline-block"; }, 3000);
    }
}

/* =================== INICIO DE SESIÓN PROFESIONAL =================== */
let currentSessionIndex = 0;
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    try {
        const res = await fetch("/session_content");
        const data = await res.json();
        const sesiones = data.sesiones;
        let available = sesiones.map((_,i) => i).filter(i => !completedSessions.includes(i));
        if(available.length === 0) { completedSessions = []; available = sesiones.map((_,i) => i); }
        currentSessionIndex = available[Math.floor(Math.random() * available.length)];
        bloques = sesiones[currentSessionIndex].bloques;
    } catch (e) {
        bloques = [
            { tipo: "info", texto: "Alumno, el sistema se adapta. Iniciando sesión de maestría.", color: "#070b14" },
            { tipo: "respiracion" },
            { tipo: "quiz", pregunta: "¿Qué crea mentalidad fuerte?", opciones: ["Acción", "Queja", "Miedo"], correcta: 0, explicacion: "La acción es el único puente entre el deseo y la realidad. El miedo y la queja solo son anclas." },
            { tipo: "cierre", texto: "Has demostrado voluntad. El éxito te espera." }
        ];
    }
    current = 0;
    showBlock(bloques[0]);
});

nextBtn.addEventListener("click", () => { current++; if(current < bloques.length) showBlock(bloques[current]); });
restartBtn.addEventListener("click", () => location.reload());
