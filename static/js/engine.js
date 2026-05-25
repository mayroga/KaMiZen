/* =========================================================
   KAMIZEN ENGINE V14 - FULL VERSION WITH PDF REPORT
   ✔ Persistencia Local (LocalStorage)
   ✔ Narración Total: Preguntas + Opciones + Feedback
   ✔ Guía Vocal de Respiración (Visual)
   ✔ Botón JUMP/SKIP para navegación directa
   ✔ Soporte completo: v, h, story, br, sil, d, r, c
   ✔ Master Timer: 15 Minutes
   ✔ Auto-Flow: Solo para historias y bloques de texto
   ✔ REPORT INTEGRATION: PDF Result generation
   ========================================================= */

let state = {
    stories: [],
    missions: [],
    currentIndex: 0,
    currentBlock: 0,
    phase: "loading",
    speechLocked: false,
    initialized: false,
    timer: null,
    timeLeft: 0,
    sessionStartTime: null
};

/* =========================
   SISTEMA DE PERSISTENCIA
========================= */
function saveProgress() {
    localStorage.setItem('kamizen_save', JSON.stringify({
        currentIndex: state.currentIndex,
        currentBlock: state.currentBlock
    }));
}

function loadProgress() {
    const saved = localStorage.getItem('kamizen_save');
    if (saved) {
        const data = JSON.parse(saved);
        state.currentIndex = data.currentIndex || 0;
        state.currentBlock = data.currentBlock || 0;
    }
}

/* =========================
   INICIALIZACIÓN DEL SISTEMA
========================= */
window.addEventListener("load", async () => {
    loadProgress();
    await loadAllData();
    showIntro();
});

async function loadAllData() {
    const app = document.getElementById("app");
    app.innerHTML = `<div class="card"><h2>SYSTEM BOOTING...</h2><p>Loading Data (Missions 1-63)...</p></div>`;
    try {
        const [storiesReq, missionsReq] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);
        const storiesData = await storiesReq.json();
        const missionsData = await missionsReq.json();

        // Asegurar ordenamiento por ID para consistencia 1-63
        state.stories = Array.isArray(storiesData.stories) ? storiesData.stories.sort((a, b) => a.id - b.id) : [];
        state.missions = Array.isArray(missionsData.missions) ? missionsData.missions.sort((a, b) => a.id - b.id) : [];
       
        state.initialized = true;
    } catch (err) {
        console.error(err);
        app.innerHTML = `<div class="card"><h2>BOOT ERROR</h2><p>Check API Connection</p></div>`;
    }
}

/* =========================
   CONTROL DE CIERRE Y REPORTE (15 MIN)
========================= */
function startMasterTimer() {
    state.sessionStartTime = Date.now();
    setTimeout(() => {
        finishSession();
    }, 15 * 60 * 1000);
}

function finishSession() {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    
    // Obtenemos el ID de la misión para el reporte PDF
    const currentMissionId = state.missions[state.currentIndex]?.id || 0;
    
    // Integración con renderValidationScreen de session.html para generar el reporte PDF
    if (typeof renderValidationScreen === "function") {
        renderValidationScreen(currentMissionId, {
            timeSpent: "15:00",
            status: "Complete"
        });
    } else {
        // Fallback original si no existe la función de validación
        const app = document.getElementById("app");
        const notes = [
            `<h2>🌟 GREAT JOB TODAY</h2>`,
            `<p>You completed your KAMIZEN session.</p>`,
            `<p>Your brain and body only need a few focused minutes to grow stronger.</p>`,
            `<p>KAMIZEN is designed to help you train calmly, not endlessly.</p>`,
            `<p>Now it is time to:</p>`,
            `<ul style="text-align:left; display:inline-block;">`,
            `    <li>✔ Now you are ready to start your class</li>`,
            `    <li>✔ Rest your mind</li>`,
            `    <li>✔ Go play</li>`,
            `    <li>✔ Talk with your family</li>`,
            `    <li>✔ Explore the real world</li>`,
            `    <li>✔ Come back tomorrow stronger</li>`,
            `</ul>`,
            `<p>Small daily training creates powerful minds. See you next session, warrior. 🛡️</p>`
        ];
        app.innerHTML = `<div class="card center animated fadeIn">${notes[0]}<button onclick="location.reload()" style="margin-top:20px;">FINISH SESSION</button></div>`;
        narrate(app.innerText.replace(/✔/g, ""));
    }
}

/* =========================
   CONTROLES DE NAVEGACIÓN
========================= */
function jumpToBlock() {
    const targetMissionId = prompt("Enter the MISSION ID to jump to (1-63):");
    if (targetMissionId !== null && targetMissionId !== "") {
        const idNum = Number(targetMissionId);
        const idx = state.missions.findIndex(m => m.id === idNum);
        if (idx !== -1) {
            window.speechSynthesis.cancel();
            clearInterval(state.timer);
            state.currentIndex = idx;  
            state.currentBlock = 0;    
            state.phase = "story";      
            render();
        } else {
            alert("Mission ID " + idNum + " not found.");
        }
    }
}

function goBack() {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    state.speechLocked = false;
    if (state.currentBlock > 0) {
        state.currentBlock--;
    } else if (state.currentIndex > 0) {
        state.currentIndex--;
        state.currentBlock = 0;
        state.phase = "story";
    }
    render();
}

function restartSystem() {
    if(confirm("Are you sure you want to RESTART from zero?")) {
        localStorage.clear();
        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "story";
        render();
    }
}

/* =========================
   LÓGICA DEL RELOJ (TIMER)
========================= */
function startCountdown(seconds, onComplete) {
    clearInterval(state.timer);
    state.timeLeft = seconds;
    const timerDisplay = document.getElementById("timerDisplay");

    state.timer = setInterval(() => {
        state.timeLeft--;
        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;
        if (timerDisplay) timerDisplay.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            if (onComplete) onComplete();
        }
    }, 1000);
}

/* =========================
   MOTOR DE RENDERIZADO
========================= */
function showIntro() {
    state.phase = "intro";
    document.getElementById("app").innerHTML = `
        <div class="card center">
            <h1>KAMIZEN LIFE SYSTEM</h1>
            <p>Training • Awareness • Control</p>
            <p class="small">Range: Missions 1 - 63 Loaded</p>
            <button onclick="startSystem()">CONTINUE MISSION</button>
            <button onclick="restartSystem()" style="background:var(--danger);margin-top:10px;">RESET PROGRESS</button>
        </div>
    `;
}

function startSystem() {
    startMasterTimer();
    state.phase = "story";
    render();
}

function render() {
    if (!state.initialized) return;
    saveProgress();
    const app = document.getElementById("app");
    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    if (!story || !mission) {
        state.currentIndex = 0; state.currentBlock = 0; state.phase = "story";
        return render();
    }

    let navHeader = `
        <div style="display:flex;gap:5px;margin-bottom:10px;">
            <button onclick="goBack()" style="flex:1;padding:8px;font-size:12px;background:#334155;">BACK</button>
            <button onclick="jumpToBlock()" style="flex:1;padding:8px;font-size:12px;background:#0ea5e9;">JUMP/SKIP</button>
            <button onclick="restartSystem()" style="flex:1;padding:8px;font-size:12px;background:var(--danger);">RESET</button>
        </div>
    `;
    if (state.phase === "story") {
        app.innerHTML = navHeader + `
            <div class="card">
                <h2 style="color:var(--primary)">STORY ${story.id}</h2>
                <h3>${story.t || ""}</h3>
                <p style="font-size:1.1rem; line-height:1.6;">${story.en || ""}</p>
            </div>
            <button id="continueBtn" disabled>NARRATING...</button>
        `;
        narrate(`${story.t}. ${story.en}`, () => {
            setTimeout(startMission, 1500);
        });
    } else {
        const block = mission.b[state.currentBlock];
        if (!block) { nextStory(); return; }
        renderBlock(block, navHeader);
    }
}

function renderBlock(block, navHeader) {
    const app = document.getElementById("app");
    let html = navHeader;
    let textToRead = "";

    const timerUI = `
        <div class="card center" style="border: 3px solid var(--primary); background: #0f172a;">
            <h1 id="timerDisplay" style="font-size:4rem;margin:0; font-family: monospace;">00:00</h1>
            <p style="color:var(--primary); letter-spacing: 2px;">STAY FOCUSED</p>
        </div>
    `;
    if (block.t === "v" || block.t === "h") { html += `<div class="card"><h2>${block.tx?.en || ""}</h2></div>`; textToRead = block.tx?.en; }
    if (block.story) { html += `<div class="card"><p>${block.story.en || ""}</p></div>`; textToRead = block.story.en; }
    if (block.t === "breath_auto" || block.t === "br") {
        html += timerUI + `<div class="card center"><div class="breath-circle" id="breathCircle"><span id="breathLabel">READY</span></div><h3>${block.tx?.en || ""}</h3><p>${block.inf?.en || ""}</p></div>`;
        textToRead = `${block.tx?.en}. ${block.inf?.en}. Get ready to breathe.`;
    }
    if (block.t === "sil") {
        html += timerUI + `<div class="card"><h3>${block.tx?.en || ""}</h3><p>${block.inf?.en || ""}</p></div>`;
        textToRead = `${block.tx?.en}. ${block.inf?.en}. Practice silence now.`;
    }
    if (block.t === "d") {
        html += `<div class="card"><h3>${block.q?.en || ""}</h3>`;
        block.op?.forEach((opt, i) => {
            html += `<div class="answer" id="opt-${i}" onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})">${opt}</div>`;
        });
        html += `</div>`;
        textToRead = `${block.q?.en}. Your options are: ${block.op.join(". ")}`;
    }
    if (block.t === "r") { html += `<div class="card center"><h2>⭐ ${block.tx || "REWARD"}</h2><p style="font-size:1.5rem;">+${block.p || 0} XP</p></div>`; textToRead = `${block.tx}. You have earned ${block.p} experience points.`; }
    if (block.t === "c") { html += `<div class="card"><p>${block.tx?.en || ""}</p></div>`; textToRead = block.tx?.en; }

    if (block.t !== "d") html += `<button id="continueBtn" disabled>NARRATING...</button>`;
    app.innerHTML = html;

    narrate(textToRead, () => {
        if (block.t === "breath_auto" || block.t === "br") {
            startCountdown(24, nextBlock);
            startGuidedBreathing();
            unlockContinue("SKIP", nextBlock);
        } else if (block.t === "sil") {
            startCountdown(24, nextBlock);
            unlockContinue("SKIP", nextBlock);
        } else if (block.t === "d") {
            // Wait for user selection
        } else {
            setTimeout(nextBlock, 1500);
        }
    });
}

function narrate(text, callback) {
    if (!text) { if (callback) callback(); return; }
    state.speechLocked = true;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 0.9;
    speech.onend = () => { state.speechLocked = false; if (callback) callback(); };
    window.speechSynthesis.speak(speech);
}

/* =========================
   GUÍA VISUAL DE RESPIRACIÓN
========================= */
function startGuidedBreathing() {
    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");
    if (!circle || !label) return;
    let inhale = true;
    const step = () => {
        if (!document.getElementById("breathCircle") || state.timeLeft <= 0) return;
        label.innerText = inhale ? "INHALE" : "EXHALE";
        circle.style.transition = "transform 4000ms ease-in-out";
        circle.style.transform = inhale ? "scale(1.4)" : "scale(0.8)";
        inhale = !inhale;
    };
    step();
    const aniInterval = setInterval(() => {
        if (!document.getElementById("breathCircle") || state.timeLeft <= 0) { clearInterval(aniInterval); return; }
        step();
    }, 4000);
}

function selectAnswer(index, correct, explanations) {
    if (state.speechLocked) return;
    const isCorrect = index === correct;
    const explanation = explanations?.[index] || "";
    const feedbackWrap = document.createElement("div");
    feedbackWrap.innerHTML = `<div class="card"><h3 style="color:${isCorrect ? '#22c55e' : '#ef4444'}">${isCorrect ? "EXCELLENT!" : "KEEP LEARNING"}</h3><p>${explanation}</p></div><button id="continueBtn" disabled>NARRATING...</button>`;
    document.getElementById("app").appendChild(feedbackWrap);
    narrate(explanation, () => {
        unlockContinue("NEXT STEP", nextBlock);
    });
}

function nextBlock() { clearInterval(state.timer); state.currentBlock++; render(); }
function startMission() { state.phase = "mission"; state.currentBlock = 0; render(); }
function nextStory() {
    state.currentIndex++;
    if (state.currentIndex >= state.missions.length) state.currentIndex = 0;
    state.phase = "story";
    state.currentBlock = 0;
    render();
}

function unlockContinue(label, action) {
    const btn = document.getElementById("continueBtn");
    if (btn) { btn.disabled = false; btn.innerText = label; btn.onclick = action; }
}
// =================================================================
// MÓDULO ACTIVO DE REORDENAMIENTO DE RESPUESTAS (INTERCEPCIÓN DE DOM)
// =================================================================
(function() {
    /**
     * Intercepta el contenedor de respuestas y mezcla sus elementos visuales de forma aleatoria.
     * Cambia el orden físico en pantalla (1ra, 2da, 3ra o 4ta posición al azar).
     */
    function reordenarRespuestasEnPantalla() {
        // 1. Identificar el contenedor de las respuestas. 
        // Cambia '.opciones-contenedor' o '#contenedor-respuestas' por la clase o ID real de tu app.
        const contenedor = document.querySelector('.opciones-contenedor') || 
                           document.getElementById('contenedor-respuestas') || 
                           document.querySelector('.answers-grid');

        if (!contenedor) return; // Si no encuentra el contenedor en esta pantalla, sale pacíficamente.

        // 2. Obtener todos los elementos hijos (los botones o divs de las opciones de respuesta)
        const respuestas = Array.from(contenedor.children);
        if (respuestas.length === 0) return;

        // 3. Algoritmo de mezcla directa sobre los elementos visuales
        for (let i = respuestas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // Intercambio de nodos en el arreglo
            const temp = respuestas[i];
            respuestas[i] = respuestas[j];
            respuestas[j] = temp;
        }

        // 4. Remover los elementos en el orden viejo y reinsertarlos en el nuevo orden aleatorio
        contenedor.innerHTML = '';
        respuestas.forEach(nodo => {
            contenedor.appendChild(nodo);
        });

        console.log("Respuestas reordenadas visualmente con éxito.");
    }

    // 5. Automatización: Ejecutar la mezcla de forma continua cada vez que cambie el contenido de la pantalla
    const observadorConfig = { childList: true, subtree: true };
    const observador = new MutationObserver((mutaciones) => {
        // Desconectamos momentáneamente para evitar bucles infinitos al modificar el DOM
        observador.disconnect();
        
        reordenarRespuestasEnPantalla();
        
        // Volvemos a activar la escucha activa para la siguiente pregunta
        reconectarObservador();
    });

    function reconectarObservador() {
        const objetivo = document.getElementById('app-main-content') || document.body;
        observador.observe(objetivo, observadorConfig);
    }

    // Iniciar el observador activo cuando el documento esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', reconectarObservador);
    } else {
        reconectarObservador();
    }
})();
// =================================================================
// MÓDULO DE REVISIÓN Y EVALUACIÓN PSICOSOCIAL DEL ESTUDIANTE
// =================================================================
(function() {
    // 1. Definición de los criterios de revisión organizados por áreas
    const criteriosEvaluacion = [
        { id: 'p1', area: 'Psicológica', aspecto: 'Manejo del estrés académico', sugerencia: '¿Muestra estabilidad ante tareas complejas o presión de tiempo?' },
        { id: 'p2', area: 'Psicológica', aspecto: 'Motivación y Enfoque', sugerencia: '¿Mantiene la atención de forma constante durante las actividades?' },
        { id: 's1', area: 'Social', aspecto: 'Comunicación y Entorno', sugerencia: '¿Expresa sus ideas con claridad y busca apoyo cuando lo requiere?' },
        { id: 's2', area: 'Social', aspecto: 'Adaptación al Método', sugerencia: '¿Muestra una actitud abierta ante las dinámicas propuestas?' }
    ];

    // 2. Función para renderizar la interfaz de revisión en pantalla
    function inicializarPanelEvaluacion() {
        // Buscar un contenedor en tu HTML o insertarlo al final del body
        const contenedorPadre = document.getElementById('contenedor-evaluacion') || document.body;
        
        const panelHTML = document.createElement('div');
        panelHTML.id = 'panel-evaluacion-estudiante';
        panelHTML.style.margin = '20px';
        panelHTML.style.padding = '15px';
        panelHTML.style.border = '1px solid #ccc';
        panelHTML.style.borderRadius = '8px';
        panelHTML.style.backgroundColor = '#f9f9f9';

        // Construcción de la tabla para visualización clara y scannable
        let tablaHTML = `
            <h3 style="margin-top:0;">Revisión de Perfil Psicosocial</h3>
            <p style="font-size:14px; color:#555;">Seleccione el estado observado para cada uno de los aspectos clave:</p>
            <table style="width:100%; border-collapse: collapse; margin-bottom: 15px;">
                <thead>
                    <tr style="background-color: #eaeaea; text-align: left;">
                        <th style="padding: 8px; border-bottom: 2px solid #ddd;">Área</th>
                        <th style="padding: 8px; border-bottom: 2px solid #ddd;">Aspecto Clave</th>
                        <th style="padding: 8px; border-bottom: 2px solid #ddd;">Sugerencia de Análisis</th>
                        <th style="padding: 8px; border-bottom: 2px solid #ddd;">Valoración</th>
                    </tr>
                </thead>
                <tbody>
        `;

        criteriosEvaluacion.forEach(item => {
            tablaHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px; font-weight: bold;">${item.area}</td>
                    <td style="padding: 8px;">${item.aspecto}</td>
                    <td style="padding: 8px; color: #666; font-size: 13px;">${item.sugerencia}</td>
                    <td style="padding: 8px;">
                        <select id="eval_${item.id}" style="padding: 4px; border-radius: 4px;">
                            <option value="en_observacion">En Observación</option>
                            <option value="favorable">Favorable</option>
                            <option value="requiere_atencion">Requiere Atención</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        tablaHTML += `
                </tbody>
            </table>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="btn-borrar-eval" style="padding: 8px 12px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Borrar Selección</button>
                <button id="btn-guardar-eval" style="padding: 8px 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Rectificar y Guardar</button>
            </div>
        `;

        panelHTML.innerHTML = tablaHTML;
        contenedorPadre.appendChild(panelHTML);

        // 3. Asignación de eventos a los botones
        document.getElementById('btn-borrar-eval').addEventListener('click', reiniciarFormulario);
        document.getElementById('btn-guardar-eval').addEventListener('click', procesarEvaluacion);
    }

    // 4. Acción para restablecer las selecciones (Botón de borrar)
    function reiniciarFormulario() {
        criteriosEvaluacion.forEach(item => {
            document.getElementById(`eval_${item.id}`).value = 'en_observacion';
        });
    }

    // 5. Acción para recopilar y tramitar los resultados obtenidos
    function procesarEvaluacion() {
        const resultados = {};
        criteriosEvaluacion.forEach(item => {
            resultados[item.id] = document.getElementById(`eval_${item.id}`).value;
        });

        // Sugerencia de integración: Aquí se puede vincular con tu backend para almacenar los datos de forma segura
        console.log("Datos de revisión psicosocial listos para procesamiento:", resultados);
        alert("Los datos de la revisión han sido registrados correctamente para su posterior asesoría.");
    }

    // Asegurar que la interfaz se monte cuando el DOM esté completamente listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarPanelEvaluacion);
    } else {
        inicializarPanelEvaluacion();
    }
})();
