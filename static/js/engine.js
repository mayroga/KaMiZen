/* =========================================================
   KAMIZEN ENGINE V15 - FULL VERSION WITH STRICTOR CONTROL
   ✔ Límite Absoluto: 10 Minutos exactos sin interrupción
   ✔ Control Estricto: Solo 1 sesión permitida cada 5 minutos
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
   SISTEMA DE SEGURIDAD Y CONTROL DE 5 MINUTOS
   ===================================== */
function verificarAccesoDiario() {
    const ahora = Date.now();
    const ultimaSesionTimestamp = localStorage.getItem('kamizen_ultima_sesion_fecha');
    
    if (ultimaSesionTimestamp) {
        const tiempoTranscurrido = ahora - parseInt(ultimaSesionTimestamp, 10);
        const cincoMinutosEnMs = 5 * 60 * 1000;
        
        if (tiempoTranscurrido < cincoMinutosEnMs) {
            const tiempoRestanteMs = cincoMinutosEnMs - tiempoTranscurrido;
            const minRestantes = Math.floor(tiempoRestanteMs / 60000);
            const segRestantes = Math.floor((tiempoRestanteMs % 60000) / 1000);
            
            bloquearPantallaDiaCompletado(`${minRestantes}:${String(segRestantes).padStart(2, '0')}`);
            return false;
        }
    }
    return true;
}

function marcarDiaComoCompletado() {
    const ahora = Date.now().toString();
    localStorage.setItem('kamizen_ultima_sesion_fecha', ahora);
}

function bloquearPantallaDiaCompletado(tiempoFaltante = "5:00") {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    clearTimeout(state.masterTimer);
    
    const app = document.getElementById("app");
    app.innerHTML = `
        <div class="card center" style="border: 3px solid var(--danger); background: #0f172a; padding: 40px;">
            <h1 style="color:var(--danger); font-size: 2.5rem; margin-bottom: 20px;">🛡️ MISION COMPLETED RECENTLY</h1>
            <p style="font-size: 1.2rem; line-height: 1.6;">You have already completed your training session.</p>
            <p style="color: var(--primary); font-weight: bold; margin-top: 20px;">Please wait ${tiempoFaltante} before starting a new block, warrior.</p>
        </div>
    `;
    
    // Remover panel psicosocial si existe al bloquear por tiempo completado
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
    // Si no han pasado los 5 minutos, se corta el inicio inmediatamente
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
    // 1. Guardar la marca de tiempo actual para bloquear el acceso durante los próximos 5 minutos
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
            `<p>Small training blocks create powerful minds. See you next session, warrior. 🛡️</p>`
        ];
        app.innerHTML = `<div class="card center animated fadeIn">${notes[0]}${notes[1]}${notes[2]}<button onclick="location.reload()" style="margin-top:20px;">CLOSE SESSION</button></div>`;
        narrate("Your ten minutes are up. See you soon.");
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
