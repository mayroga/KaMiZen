/* =========================================================
   KAMIZEN ENGINE V15 - FULL VERSION WITH STRICTOR CONTROL
   ✔ Límite Absoluto: 10 Minutos exactos sin interrupción
   ✔ Control Diario Estricto: Solo 1 sesión permitida por día
   ✔ Persistencia Local (LocalStorage)
   ✔ Narración Total + Aleatorización de Respuestas Real
   ✔ Tabla de Revisión Psicosocial Persistente Fuera de App
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
    sessionStartTime: null,
    masterTimer: null // Controlador del bloqueo de 10 minutos
};

/* =====================================
   SISTEMA DE SEGURIDAD Y CONTROL DIARIO
   ===================================== */
function verificarAccesoDiario() {
    const hoy = new Date().toDateString(); // Formato "Mon May 25 2026"
    const ultimaSesion = localStorage.getItem('kamizen_ultima_sesion_fecha');
    
    if (ultimaSesion === hoy) {
        bloquearPantallaDiaCompletado();
        return false;
    }
    return true;
}

function marcarDiaComoCompletado() {
    const hoy = new Date().toDateString();
    localStorage.setItem('kamizen_ultima_sesion_fecha', hoy);
}

function bloquearPantallaDiaCompletado() {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    clearTimeout(state.masterTimer);
    
    const app = document.getElementById("app");
    app.innerHTML = `
        <div class="card center" style="border: 3px solid var(--danger); background: #0f172a; padding: 40px;">
            <h1 style="color:var(--danger); font-size: 2.5rem; margin-bottom: 20px;">🛡️ MISION COMPLETED TODAY</h1>
            <p style="font-size: 1.2rem; line-height: 1.6;">You have already completed your daily training session.</p>
            <p style="color: var(--primary); font-weight: bold; margin-top: 20px;">Come back tomorrow stronger, warrior.</p>
        </div>
    `;
    
    // Remover panel psicosocial si existe al bloquear por día completado
    const panel = document.getElementById('panel-evaluacion-estudiante');
    if (panel) panel.remove();
}

/* =========================
   PERSISTENCIA DE PROGRESO
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
    // Si ya completó su sesión de hoy, se corta el inicio inmediatamente
    if (!verificarAccesoDiario()) return;
    
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

        state.stories = Array.isArray(storiesData.stories) ? storiesData.stories.sort((a, b) => a.id - b.id) : [];
        state.missions = Array.isArray(missionsData.missions) ? missionsData.missions.sort((a, b) => a.id - b.id) : [];
       
        state.initialized = true;
    } catch (err) {
        console.error(err);
        app.innerHTML = `<div class="card"><h2>BOOT ERROR</h2><p>Check API Connection</p></div>`;
    }
}

/* ==============================================
   CONTROL DE CIERRE INMUTABLE (10 MINUTOS EXACTOS)
   ============================================== */
function startMasterTimer() {
    state.sessionStartTime = Date.now();
    
    // Temporizador de 10 minutos exactos (10 * 60 * 1000 ms)
    state.masterTimer = setTimeout(() => {
        finishSession();
    }, 10 * 60 * 1000);
}

function finishSession() {
    // 1. Guardar la fecha actual para bloquear futuros accesos hoy
    marcarDiaComoCompletado();
    
    // 2. Cancelar absolutamente todos los procesos y audios activos
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    
    const currentMissionId = state.missions[state.currentIndex]?.id || 0;
    
    // 3. Renderizar pantalla de finalización forzada
    if (typeof renderValidationScreen === "function") {
        renderValidationScreen(currentMissionId, {
            timeSpent: "10:00",
            status: "Complete"
        });
    } else {
        const app = document.getElementById("app");
        const notes = [
            `<h2>🌟 10 MINUTES COMPLETED</h2>`,
            `<p>Your time for today is up. The system has paused to protect your focus.</p>`,
            `<p>Small daily training creates powerful minds. See you next session, warrior. 🛡️</p>`
        ];
        app.innerHTML = `<div class="card center animated fadeIn">${notes[0]}${notes[1]}${notes[2]}<button onclick="location.reload()" style="margin-top:20px;">CLOSE SESSION</button></div>`;
        narrate("Your ten minutes are up. See you tomorrow.");
    }
    
    // Remover la tabla de evaluación para obligar al cierre total de la interfaz
    const panel = document.getElementById('panel-evaluacion-estudiante');
    if (panel) panel.remove();
}

/* =========================
   CONTROLES DE NAVEGACIÓN
========================= */
function jumpToBlock() {
    if (!verificarAccesoDiario()) return;
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
    if (!verificarAccesoDiario()) return;
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
        localStorage.removeItem('kamizen_save');
        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "story";
        render();
    }
}

/* =========================
   LÓGICA DEL RELOJ INTERNO (BLOQUE)
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
            <button onclick="startSystem()">START DAILY MISSION (10 MIN)</button>
        </div>
    `;
    inyectarPanelPsicosocialEstatico();
}

function startSystem() {
    if (!verificarAccesoDiario()) return;
    startMasterTimer();
    state.phase = "story";
    render();
}

function render() {
    if (!state.initialized || !verificarAccesoDiario()) return;
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
        inyectarPanelPsicosocialEstatico();
        
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
    if (!verificarAccesoDiario()) return;
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
    
    // =================================================================
    // ROTACIÓN IMPLACABLE Y REAL DE RESPUESTAS (TIPO D)
    // =================================================================
    if (block.t === "d") {
        html += `<div class="card"><h3>${block.q?.en || ""}</h3>`;
        
        // Mapeo estructurado para resguardar la validez de los índices de la base de datos
        let opcionesMapeadas = block.op.map((textoOpcion, indiceOriginal) => {
            return { texto: textoOpcion, idx: indiceOriginal };
        });

        // Mezcla aleatoria garantizada
        for (let i = opcionesMapeadas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [opcionesMapeadas[i], opcionesMapeadas[j]] = [opcionesMapeadas[j], opcionesMapeadas[i]];
        }

        // Imprimir las opciones en su nueva ubicación alterada al azar
        opcionesMapeadas.forEach((opcion, posicionVisual) => {
            html += `<div class="answer" id="opt-${posicionVisual}" onclick="selectAnswer(${opcion.idx}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})">${opcion.texto}</div>`;
        });
        
        html += `</div>`;
        
        let opcionesTextoLectura = opcionesMapeadas.map(o => o.texto).join(". ");
        textToRead = `${block.q?.en}. Your options are: ${opcionesTextoLectura}`;
    }
    
    if (block.t !== "d") html += `<button id="continueBtn" disabled>NARRATING...</button>`;
    app.innerHTML = html;

    inyectarPanelPsicosocialEstatico();

    narrate(textToRead, () => {
        if (block.t === "breath_auto" || block.t === "br") {
            startCountdown(24, nextBlock);
            startGuidedBreathing();
            unlockContinue("SKIP", nextBlock);
        } else if (block.t === "sil") {
            startCountdown(24, nextBlock);
            unlockContinue("SKIP", nextBlock);
        } else if (block.t === "d") {
            // Espera activa del click
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
    if (state.speechLocked || !verificarAccesoDiario()) return;
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
// ESTRUCTURA DE REVISIÓN PSICOSOCIAL REUBICADA DE FORMA PERSISTENTE
// =================================================================
function inyectarPanelPsicosocialEstatico() {
    if (document.getElementById('panel-evaluacion-estudiante')) return;

    const criteriosEvaluacion = [
        { id: 'p1', area: 'Psychological', aspect: 'Managing Academic Stress', suggestion: 'Does he/she demonstrate stability when faced with complex tasks or time pressure?' },
        { id: 'p2', area: 'Psychological', aspect: 'Motivation and Focus', suggestion: 'Does he/she maintain attention consistently during activities?' },
        { id: 's1', area: 'Social', aspect: 'Communication and Focus', suggestion: 'Do you express your ideas clearly and seek support when needed?' },
        { id: 's2', area: 'Social', aspect: 'Adaptation to the Method', suggestion: 'Does he/she demonstrate an open attitude toward the proposed dynamics?' }
    ];

    const panelHTML = document.createElement('div');
    panelHTML.id = 'Student-Evaluation-Panel';
    panelHTML.style.margin = '20px auto';
    panelHTML.style.maxWidth = '600px';
    panelHTML.style.padding = '15px';
    panelHTML.style.border = '1px solid #ccc';
    panelHTML.style.borderRadius = '8px';
    panelHTML.style.backgroundColor = '#f9f9f9';
    panelHTML.style.color = '#333';

    let tablaHTML = `
        <h3 style="margin-top:0; color:#1e293b;">Psychosocial Profile Review</h3>
        <p style="font-size:14px; color:#555;">Select the observed status for each of the key aspects:</p>
        <table style="width:100%; border-collapse: collapse; margin-bottom: 15px; text-align: left;">
            <thead>
                <tr style="background-color: #eaeaea; color:#333;">
                    <th style="padding: 8px; border-bottom: 2px solid #ddd;">Area</th>
                    <th style="padding: 8px; border-bottom: 2px solid #ddd;">Key Aspect</th>
                    <th style="padding: 8px; border-bottom: 2px solid #ddd;">Analysis Suggestion</th>
                    <th style="padding: 8px; border-bottom: 2px solid #ddd;">Assessment</th>
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
                    <select id="eval_${item.id}" style="padding: 4px; border-radius: 4px; border: 1px solid #bbb; background: #fff; color: #000;">
                        <option value="Under_observation">Under Observation</option>
                        <option value="favorable">Favorable</option>
                        <option value="requieres_attention">Requires Attention</option>
                    </select>
                </td>
            </tr>
        `;
    });

    tablaHTML += `
            </tbody>
        </table>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="btn-borrar-eval" style="padding: 8px 12px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Borrar Selección</button>
            <button id="btn-guardar-eval" style="padding: 8px 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Rectificar y Guardar</button>
        </div>
    `;

    panelHTML.innerHTML = tablaHTML;
    
    const appWrapper = document.getElementById("app");
    appWrapper.parentNode.insertBefore(panelHTML, appWrapper.nextSibling);

    document.getElementById('btn-borrar-eval').addEventListener('click', () => {
        criteriosEvaluacion.forEach(item => {
            document.getElementById(`eval_${item.id}`).value = 'under_observation';
        });
    });

    document.getElementById('btn-guardar-eval').addEventListener('click', () => {
        const resultados = {};
        criteriosEvaluacion.forEach(item => {
            resultados[item.id] = document.getElementById(`eval_${item.id}`).value;
        });
        console.log("Psychosocial review data ready for processing:", results);
        alert("The review data has been successfully recorded for future consultation.");
    });
}
