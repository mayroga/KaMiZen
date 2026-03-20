/* =================== VARIABLES Y PERSISTENCIA =================== */
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");
const forwardBtn = document.getElementById("forward-btn");
const block = document.getElementById("block");

let bloques = [];
let current = 0;
let breathingInterval = null;

let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0, lastDay: null, nivel: 1, disciplina: 40, claridad: 50, calma: 30
};
let completedSessions = JSON.parse(localStorage.getItem("completedSessions")) || [];

/* =================== ACTUALIZACIÓN DE PANEL Y PENALIZACIÓN =================== */
function updatePanel(){
    document.getElementById("streak").innerHTML = `🔥 Racha: ${userData.streak} días`;
    document.getElementById("level").innerHTML = `Nivel KaMiZen: ${userData.nivel}`;
    document.getElementById("disciplina-bar").style.width = Math.max(0, userData.disciplina) + "%";
    document.getElementById("claridad-bar").style.width = Math.max(0, userData.claridad) + "%";
    document.getElementById("calma-bar").style.width = Math.max(0, userData.calma) + "%";
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}

function aplicarPenalizacion() {
    userData.claridad -= 80; // Castigo drástico a la mente dispersa
    userData.disciplina -= 20; // Castigo a la falta de constancia
    if(userData.claridad < 0) userData.claridad = 0;
    if(userData.disciplina < 0) userData.disciplina = 0;
    updatePanel();
    playVoice("Advertencia: Saltar o retroceder debilita tu claridad y disciplina.");
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

/* =================== RESPIRACIÓN: GLOBO FLUIDO Y TEXTO SEGURO =================== */
async function breathingAnimation(b){
    block.innerHTML = "";
    clearInterval(breathingInterval);
    
    const container = document.createElement("div");
    container.style.cssText = "display:flex; flex-direction:column; align-items:center; justify-content:space-between; min-height:450px; width:100%; position:relative;";

    const uiLabel = document.createElement("div");
    uiLabel.style.cssText = "font-size:1.4em; font-weight:700; color:#ffffff; text-align:center; text-transform:uppercase; padding:10px; z-index:10; height:60px;";
    
    // Cronómetro fuera del cuadro del globo
    const uiTimer = document.createElement("div");
    uiTimer.style.cssText = "position:absolute; bottom:10px; right:10px; font-size:2em; color:rgba(0,210,255,0.5); font-weight:bold; font-family:monospace;";
    
    const circle = document.createElement("div");
    circle.style.cssText = "width:80px; height:80px; background:radial-gradient(circle, #00d2ff, #0077ff); border-radius:50%; box-shadow:0 0 40px #00d2ff; transition:transform 3s ease-in-out; margin:auto;";

    container.appendChild(uiLabel);
    container.appendChild(circle);
    document.body.appendChild(uiTimer); // Fuera del contenedor principal
    block.appendChild(container);

    const instruccion = b.texto || "Inhala y exhala con el ritmo del globo.";
    uiLabel.innerText = instruccion;
    await playVoice(instruccion);

    // Ciclo de respiración constante (Inspiración/Expiración)
    let expandir = true;
    circle.style.transform = "scale(2.5)";
    breathingInterval = setInterval(() => {
        expandir = !expandir;
        circle.style.transform = expandir ? "scale(2.5)" : "scale(1)";
    }, 3000);

    // Conteo regresivo
    for(let s = (b.duracion || 5); s > 0; s--){
        uiTimer.innerText = `${s}s`;
        await new Promise(r => setTimeout(r, 1000));
    }

    uiTimer.remove();
    clearInterval(breathingInterval);
    uiLabel.innerText = "CICLO COMPLETADO. PUEDES CONTINUAR.";
    nextBtn.style.display = "inline-block";
}

/* =================== PROCESADOR DE BLOQUES MULTIFORMATO =================== */
async function showBlock(b){
    block.innerHTML = "";
    clearInterval(breathingInterval);
    document.body.style.background = b.color || "#070b14";
    nextBtn.style.display = "none";

    // 1. Tipos de lectura y recompensas
    if(["voz", "tvid", "inteligencia_social", "estrategia", "historia", "visualizacion", "recompensa"].includes(b.tipo)){
        const titulo = b.titulo ? `<h3 style='color:#00d2ff; font-size:1.2em;'>${b.titulo}</h3>` : "";
        const tecnica = b.tecnica ? `<p style='color:#facc15; font-size:0.9em;'>Técnica: ${b.tecnica}</p>` : "";
        block.innerHTML = `
            <div style='text-align:center; padding:20px;'>
                ${titulo} ${tecnica}
                <p style='font-size:1.4em; line-height:1.4; margin-top:15px;'>${b.texto}</p>
            </div>`;
        if(b.tipo === "recompensa") { userData.disciplina += (b.puntos || 10); updatePanel(); }
        await playVoice(b.texto);
        setTimeout(() => { nextBtn.style.display = "inline-block"; }, 2000);
        return;
    }

    // 2. Respiración
    if(b.tipo === "respiracion") { await breathingAnimation(b); return; }

    // 3. Bloques Interactivos con Exploración Libre
    if(["quiz", "acertijo", "decision", "juego_mental"].includes(b.tipo)){
        block.innerHTML = `<h3 style='font-size:1.5em; text-align:center; padding:15px;'>${b.pregunta}</h3>`;
        await playVoice(b.pregunta);

        const feedback = document.createElement("div");
        feedback.style.cssText = "margin:15px auto; width:85%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.05); color:#00d2ff; text-align:center; min-height:40px; font-size:0.9em;";
        feedback.innerText = "Tu Coach espera tu respuesta...";

        b.opciones.forEach((op, i) => {
            let btn = document.createElement("button");
            btn.style.cssText = "display:block; width:85%; margin:8px auto; padding:12px; border-radius:8px; border:1px solid #00d2ff; background:transparent; color:white; cursor:pointer;";
            btn.innerText = op;
            btn.onclick = async () => {
                const esCorrecto = (i === b.correcta);
                const expl = b.explicacion || b.explanacion || "Continúa.";
                feedback.innerHTML = `<strong>${esCorrecto ? "✅" : "❌"}</strong> ${expl}`;
                await playVoice(esCorrecto ? `Correcto. ${expl}` : `Incorrecto. ${expl}`);
                if(esCorrecto) { 
                    userData.disciplina += (b.recompensa || 5); 
                    updatePanel(); 
                    nextBtn.style.display = "inline-block"; 
                } else { 
                    userData.calma += 1; 
                    updatePanel(); 
                }
            };
            block.appendChild(btn);
        });
        block.appendChild(feedback);
    }

    if(b.tipo === "cierre"){
        block.innerHTML = `<p style='font-size:1.8em; text-align:center; padding:30px;'>${b.texto}</p>`;
        await playVoice(b.texto);
        completedSessions.push(currentSessionIndex);
        localStorage.setItem("completedSessions", JSON.stringify(completedSessions));
        restartBtn.style.display = "inline-block";
    }
}

/* =================== NAVEGACIÓN Y CARGA =================== */
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
        bloques = [{ tipo: "voz", texto: "Iniciando AL CIELO.", color: "#070b14" }, { tipo: "respiracion", texto: "Inhala profundamente.", duracion: 5 }];
    }
    current = 0;
    showBlock(bloques[0]);
});

nextBtn.addEventListener("click", () => { current++; if(current < bloques.length) showBlock(bloques[current]); });

backBtn.addEventListener("click", () => { 
    aplicarPenalizacion(); 
    if(current > 0) { current--; showBlock(bloques[current]); } 
});

forwardBtn.addEventListener("click", () => { 
    aplicarPenalizacion(); 
    if(current < bloques.length - 1) { current++; showBlock(bloques[current]); } 
});

restartBtn.addEventListener("click", () => location.reload());
updatePanel();
