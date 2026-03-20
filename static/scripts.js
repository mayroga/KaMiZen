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

/* =================== ACTUALIZACIÓN DE PANEL =================== */
function updatePanel(){
    document.getElementById("streak").innerHTML = `🔥 Racha: ${userData.streak} días`;
    document.getElementById("level").innerHTML = `Nivel KaMiZen: ${userData.nivel}`;
    document.getElementById("disciplina-bar").style.width = (userData.disciplina || 0) + "%";
    document.getElementById("claridad-bar").style.width = (userData.claridad || 0) + "%";
    document.getElementById("calma-bar").style.width = (userData.calma || 0) + "%";
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}
updatePanel();

/* =================== MOTOR DE VOZ (COACH MENTOR) =================== */
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

/* =================== RESPIRACIÓN DINÁMICA SEGÚN JSON =================== */
async function breathingAnimation(b){
    block.innerHTML = "";
    isBreathing = true;
    
    const container = document.createElement("div");
    container.style.cssText = "display:flex; flex-direction:column; align-items:center; justify-content:flex-start; min-height:450px; width:100%;";

    const uiLabel = document.createElement("div");
    uiLabel.style.cssText = "font-size:2em; font-weight:900; color:#ffffff; height:100px; text-align:center; text-transform:uppercase; padding:0 20px;";
    
    const uiTimer = document.createElement("div");
    uiTimer.style.cssText = "font-size:2.5em; color:#00d2ff; font-weight:bold; margin-bottom:10px;";
    
    const circle = document.createElement("div");
    circle.style.cssText = "width:110px; height:110px; background:radial-gradient(circle, #00d2ff, #0077ff); border-radius:50%; box-shadow:0 0 40px #00d2ff; transition:transform 1s linear; margin-top:30px;";

    container.appendChild(uiLabel);
    container.appendChild(uiTimer);
    container.appendChild(circle);
    block.appendChild(container);

    const duracion = b.duracion || 5; 
    const instruccion = b.texto || "Sigue el ciclo de respiración.";
    
    uiLabel.innerText = instruccion;
    await playVoice(instruccion);

    // Animación fluida basada en el tiempo del JSON
    circle.style.transition = `transform ${duracion}s ease-in-out`;
    // Si el texto sugiere inhalar, el globo crece; si sugiere exhalar, encoge.
    const escala = (instruccion.toLowerCase().includes("inhala") || instruccion.toLowerCase().includes("mantén")) ? 2.2 : 1.0;
    
    setTimeout(() => { circle.style.transform = `scale(${escala})`; }, 50);

    for(let s = duracion; s > 0; s--){
        uiTimer.innerText = `${s}s`;
        await new Promise(r => setTimeout(r, 1000));
    }

    isBreathing = false;
    nextBtn.style.display = "inline-block";
}

/* =================== PROCESADOR DE BLOQUES MULTIFORMATO =================== */
async function showBlock(b){
    block.innerHTML = "";
    document.body.style.background = b.color || "#070b14";
    nextBtn.style.display = "none";

    // 1. Tipos de bloques de lectura/voz
    if(["voz", "tvid", "inteligencia_social", "estrategia", "historia", "visualizacion", "recompensa"].includes(b.tipo)){
        const titulo = b.titulo ? `<h2 style='color:#00d2ff; margin-bottom:10px;'>${b.titulo}</h2>` : "";
        const tecnica = b.tecnica ? `<p style='font-weight:bold; color:#facc15;'>Técnica: ${b.tecnica}</p>` : "";
        const texto = b.texto || "Continúa con tu entrenamiento.";
        
        block.innerHTML = `
            <div style='text-align:center; padding:30px;'>
                ${titulo}
                ${tecnica}
                <p style='font-size:1.6em; font-weight:300; line-height:1.4;'>${texto}</p>
            </div>`;
        
        if(b.tipo === "recompensa") { userData.disciplina += (b.puntos || 10); updatePanel(); }
        
        await playVoice(texto);
        setTimeout(() => { nextBtn.style.display = "inline-block"; }, 2000);
        return;
    }

    // 2. Respiración
    if(b.tipo === "respiracion"){
        await breathingAnimation(b);
        return;
    }

    // 3. Bloques Interactivos (Quiz, Acertijo, Decisión, Juego Mental)
    if(["quiz", "acertijo", "decision", "juego_mental"].includes(b.tipo)){
        const pregunta = b.pregunta || "¿Qué decides?";
        block.innerHTML = `<h3 style='font-size:1.8em; text-align:center; padding:20px; color:#ffffff;'>${pregunta}</h3>`;
        await playVoice(pregunta);

        const feedbackArea = document.createElement("div");
        feedbackArea.style.cssText = "margin:20px auto; width:85%; padding:15px; border-radius:10px; background:rgba(255,255,255,0.05); color:#00d2ff; text-align:center; font-style:italic; min-height:50px;";
        feedbackArea.innerText = "Explora las opciones para aprender...";

        const opciones = b.opciones || [];
        opciones.forEach((op, i) => {
            let btn = document.createElement("button");
            btn.style.cssText = "display:block; width:85%; margin:10px auto; padding:15px; border-radius:10px; border:1px solid #00d2ff; background:transparent; color:white; cursor:pointer; font-size:1.1em;";
            btn.innerText = op;
            
            btn.onclick = async () => {
                const esCorrecto = (i === b.correcta);
                const explicacion = b.explicacion || b.explanacion || "Sigue adelante.";
                const respuestaVoz = esCorrecto ? `Correcto. ${explicacion}` : `Incorrecto. ${explicacion}`;
                
                feedbackArea.innerHTML = `<strong>${esCorrecto ? "✅" : "❌"}</strong> ${explicacion}`;
                await playVoice(respuestaVoz);

                if(esCorrecto){
                    userData.disciplina += (b.recompensa || 5);
                    updatePanel();
                    nextBtn.style.display = "inline-block"; // El éxito abre el camino
                } else {
                    userData.calma += 1;
                    updatePanel();
                }
            };
            block.appendChild(btn);
        });
        block.appendChild(feedbackArea);
    } 

    if(b.tipo === "cierre"){
        block.innerHTML = `<p style='font-size:2em; text-align:center; padding:40px;'>${b.texto}</p>`;
        await playVoice(b.texto);
        completedSessions.push(currentSessionIndex);
        localStorage.setItem("completedSessions", JSON.stringify(completedSessions));
        restartBtn.style.display = "inline-block";
    }
}

/* =================== MOTOR DE CARGA DE SESIÓN =================== */
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
        // Fallback dinámico si falla el servidor
        bloques = [
            { tipo: "voz", texto: "Iniciando sistema AL CIELO. Prepárate.", color: "#070b14" },
            { tipo: "respiracion", texto: "Inhala disciplina profundamente.", duracion: 5 },
            { tipo: "quiz", pregunta: "¿Qué crea disciplina?", opciones: ["Motivación","Repetición","Suerte"], correcta: 1, explicacion: "La repetición crea hábitos.", recompensa: 10 }
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
