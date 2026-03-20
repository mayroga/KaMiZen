/* =================== NÚCLEO DE DATOS Y ESTADÍSTICAS =================== */
const block = document.getElementById("block");
const nextBtn = document.getElementById("next-btn");
const startBtn = document.getElementById("start-btn");

let bloques = [];
let current = 0;
let isBreathing = false;

let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0, nivel: 1, disciplina: 40, claridad: 50, calma: 30
};

function updateStats(puntos = 0, tipo = "disciplina") {
    if(userData[tipo] !== undefined) userData[tipo] = Math.min(100, userData[tipo] + puntos);
    localStorage.setItem("kamizenData", JSON.stringify(userData));
    // Aquí conectarías con tus barras visuales del DOM
}

/* =================== MOTOR DE VOZ MENTOR =================== */
function coachVoice(text) {
    return new Promise(resolve => {
        speechSynthesis.cancel();
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.9;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* =================== RENDERIZADOR UNIVERSAL DE BLOQUES =================== */
async function renderBloque(b) {
    block.innerHTML = "";
    document.body.style.background = b.color || "#070b14";
    nextBtn.style.display = "none";

    // 1. GESTIÓN DE TIPOS DE CONTENIDO (VOZ, TVID, SOCIAL, ETC.)
    if (["voz", "tvid", "inteligencia_social", "estrategia", "historia", "visualizacion", "recompensa", "cierre", "info"].includes(b.tipo)) {
        let titulo = b.titulo ? `<h2 style='color:#fff; text-transform:uppercase;'>${b.titulo}</h2>` : "";
        let tecnica = b.tecnica ? `<small style='color:#00d2ff;'>${b.tecnica}</small>` : "";
        let contenido = b.texto || "";
        
        block.innerHTML = `
            <div style='text-align:center; padding:30px;'>
                ${tecnica} ${titulo}
                <p style='font-size:1.6em; font-weight:300; margin-top:20px;'>${contenido}</p>
            </div>`;
        
        await coachVoice(contenido);
        setTimeout(() => { nextBtn.style.display = "inline-block"; }, 2000);
    }

    // 2. GESTIÓN DE INTERACCIÓN (QUIZ, ACERTIJO, DECISIÓN, JUEGO MENTAL)
    else if (["quiz", "acertijo", "decision", "juego_mental"].includes(b.tipo)) {
        block.innerHTML = `<h3 style='text-align:center; font-size:1.8em; margin-bottom:20px;'>${b.pregunta}</h3>`;
        
        const feedback = document.createElement("div");
        feedback.style.cssText = "margin:15px; padding:15px; border-radius:10px; background:rgba(255,255,255,0.05); text-align:center; min-height:50px; color:#00d2ff;";
        feedback.innerText = "Analiza y selecciona tu respuesta...";

        b.opciones.forEach((op, i) => {
            let btn = document.createElement("button");
            btn.style.cssText = "display:block; width:85%; margin:10px auto; padding:15px; border-radius:10px; border:1px solid #00d2ff; background:transparent; color:white; cursor:pointer;";
            btn.innerText = op;

            btn.onclick = async () => {
                const esCorrecto = (i === b.correcta);
                const explicacion = b.explicacion || b.explanacion || "Respuesta procesada.";
                
                if (esCorrecto) {
                    feedback.innerHTML = `<b style='color:#22c55e;'>✅ CORRECTO:</b> ${explicacion}`;
                    updateStats(b.recompensa || 5, "disciplina");
                    nextBtn.style.display = "inline-block"; // El éxito permite avanzar
                } else {
                    feedback.innerHTML = `<b style='color:#f87171;'>❌ REFLEXIÓN:</b> ${explicacion}`;
                    updateStats(2, "calma"); // El error da calma por reflexión
                }
                await coachVoice(feedback.innerText);
            };
            block.appendChild(btn);
        });
        block.appendChild(feedback);
        await coachVoice(b.pregunta);
    }

    // 3. GESTIÓN DE RESPIRACIÓN DINÁMICA
    else if (b.tipo === "respiracion") {
        isBreathing = true;
        block.innerHTML = `
            <div style='display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:400px;'>
                <div id='res-label' style='font-size:2em; font-weight:900; text-align:center; height:80px;'>${b.texto}</div>
                <div id='res-timer' style='font-size:2.5em; color:#00d2ff; margin:20px;'></div>
                <div id='res-circle' style='width:100px; height:100px; background:radial-gradient(circle, #00d2ff, #0077ff); border-radius:50%; box-shadow:0 0 50px #00d2ff; transition: transform ${b.duracion}s ease-in-out;'></div>
            </div>`;
        
        const label = document.getElementById("res-label");
        const timer = document.getElementById("res-timer");
        const circle = document.getElementById("res-circle");

        await coachVoice(b.texto);
        
        // Animación de expansión/contracción automática según el texto del JSON
        const esInhalar = b.texto.toLowerCase().includes("inhala");
        const esExhalar = b.texto.toLowerCase().includes("exhala");
        
        setTimeout(() => {
            if(esInhalar) circle.style.transform = "scale(2.2)";
            if(esExhalar) circle.style.transform = "scale(1)";
        }, 50);

        for (let s = b.duracion; s > 0; s--) {
            timer.innerText = `${s}s`;
            await new Promise(r => setTimeout(r, 1000));
        }

        isBreathing = false;
        nextBtn.style.display = "inline-block";
    }
}

/* =================== CONTROL DE FLUJO =================== */
async function startSession() {
    startBtn.style.display = "none";
    try {
        const res = await fetch("/session_content"); // O el origen de tus 100+ JSONs
        const data = await res.json();
        // Filtrar sesiones por ID o aleatorio según tu lógica
        bloques = data.sesiones[0].bloques; 
        current = 0;
        renderBloque(bloques[current]);
    } catch (e) {
        console.error("Error cargando JSON. Usando estructura de respaldo.");
    }
}

nextBtn.addEventListener("click", () => {
    current++;
    if (current < bloques.length) {
        renderBloque(bloques[current]);
    } else {
        block.innerHTML = "<h2>Sesión Maestra Completada</h2>";
        nextBtn.style.display = "none";
    }
});

// Advertencia de cierre durante respiración
window.onbeforeunload = () => isBreathing ? "No interrumpas tu ciclo vital." : null;
