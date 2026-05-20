/* =========================================================
   KAMIZEN ENGINE V14 - MULTILINGUAL & AUTOPAUSE EDITION
   ✔ Persistencia Local (LocalStorage)
   ✔ Narración Total Adaptativa (EN/ES) con control de estado
   ✔ Guía Vocal de Respiración Visual
   ✔ Botón JUMP/SKIP + Cambio de Idioma (Pequeño y Compacto)
   ✔ Sistema de Pausa Inteligente (Automática por llamadas/foco + Manual)
   ✔ Master Timer Global Visible (Esquina Superior, 15 Minutos Estrictos)
   ========================================================= */

let state = {
    stories: [],
    missions: [],
    currentIndex: 0,
    currentBlock: 0,
    phase: "loading",
    speechLocked: false,
    initialized: false,
    
    // Control de Idioma
    language: "en", // "en" o "es"
    
    // Estado de Pausa
    isPaused: false,
    pausedText: "", 
    
    // Timers y Tiempos
    timer: null,             // Timer del bloque actual (br, sil)
    timeLeft: 0,            // Tiempo restante del bloque actual
    
    masterTimer: null,       // Intervalo del tiempo general
    masterTimeLeft: 15 * 60, // 15 minutos en segundos (900s)
    sessionStartTime: null
};

/* =========================
   SISTEMA DE PERSISTENCIA
========================= */
function saveProgress() {
    localStorage.setItem('kamizen_save', JSON.stringify({
        currentIndex: state.currentIndex,
        currentBlock: state.currentBlock,
        language: state.language
    }));
}

function loadProgress() {
    const saved = localStorage.getItem('kamizen_save');
    if (saved) {
        const data = JSON.parse(saved);
        state.currentIndex = data.currentIndex || 0;
        state.currentBlock = data.currentBlock || 0;
        state.language = data.language || "en";
    }
}

/* =========================
   INICIALIZACIÓN DEL SISTEMA
========================= */
window.addEventListener("load", async () => {
    loadProgress();
    setupAutopauseListeners();
    injectGlobalTimerUI();
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

/* =========================
   PAUSA AUTOMÁTICA Y LÓGICA DE FOCO
========================= */
function setupAutopauseListeners() {
    // Si el usuario sale de la app, recibe una llamada o minimiza el navegador en el teléfono
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && !state.isPaused && state.phase !== "intro" && state.phase !== "loading") {
            togglePause(true); 
        }
    });

    window.addEventListener("blur", () => {
        if (!state.isPaused && state.phase !== "intro" && state.phase !== "loading") {
            togglePause(true);
        }
    });
}

function togglePause(forcePause = false) {
    if (state.phase === "intro" || state.phase === "loading") return;

    if (!state.isPaused || forcePause) {
        // ACTIVAR PAUSA
        state.isPaused = true;
        window.speechSynthesis.pause(); // Pausa la voz sin perder la posición
        
        // Detener los intervalos temporalmente
        clearInterval(state.timer);
        clearInterval(state.masterTimer);
        
        // Renderizar inmediatamente la cortina visual de pausa
        renderPauseOverlay();
    } else {
        // REANUDAR
        state.isPaused = false;
        removePauseOverlay();
        
        // Reanudar Master Timer
        startMasterTimer(true);
        
        // Reanudar temporizadores de bloque si aplica
        const mission = state.missions[state.currentIndex];
        const block = mission?.b[state.currentBlock];
        
        if (block && (block.t === "breath_auto" || block.t === "br" || block.t === "sil")) {
            resumeCountdown();
            if (block.t === "breath_auto" || block.t === "br") {
                startGuidedBreathing();
            }
        }
        
        window.speechSynthesis.resume(); // Continúa la narración exactamente donde se quedó
    }
}

function renderPauseOverlay() {
    removePauseOverlay(); // Evitar duplicados
    const overlay = document.createElement("div");
    overlay.id = "pauseOverlay";
    overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.95);z-index:9999;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:20px;text-align:center;";
    
    const msg = state.language === "en" ? "SESSION PAUSED" : "SESIÓN EN PAUSA";
    const subMsg = state.language === "en" ? "Tap to resume training" : "Toca para reanudar el entrenamiento";
    const btnText = state.language === "en" ? "RESUME" : "REANUDAR";

    overlay.innerHTML = `
        <h1 style="color:var(--primary);margin-bottom:10px;font-size:2.5rem;">${msg}</h1>
        <p style="color:#94a3b8;margin-bottom:20px;">${subMsg}</p>
        <button onclick="togglePause()" style="background:#22c55e;padding:15px 40px;font-size:1.2rem;font-weight:bold;">${btnText}</button>
    `;
    document.body.appendChild(overlay);
}

function removePauseOverlay() {
    const overlay = document.getElementById("pauseOverlay");
    if (overlay) overlay.remove();
}

/* =========================
   CONTROL DE CIERRE Y REPORTE (15 MIN ESTRUCTOS)
========================= */
function injectGlobalTimerUI() {
    let globalUI = document.getElementById("globalTimerWidget");
    if (!globalUI) {
        globalUI = document.createElement("div");
        globalUI.id = "globalTimerWidget";
        // Estilo discreto e inmune a scrolls en la esquina superior derecha
        globalUI.style = "position:fixed;top:10px;right:10px;background:#1e293b;border:1px solid #334155;border-radius:6px;padding:4px 8px;font-family:monospace;font-size:12px;color:#e2e8f0;z-index:999;box-shadow:0 2px 8px rgba(0,0,0,0.5);display:none;align-items:center;gap:5px;";
        document.body.appendChild(globalUI);
    }
}

function startMasterTimer(isResuming = false) {
    if (!isResuming) {
        state.sessionStartTime = Date.now();
    }
    
    const globalUI = document.getElementById("globalTimerWidget");
    if (globalUI) globalUI.style.display = "flex";

    clearInterval(state.masterTimer);
    state.masterTimer = setInterval(() => {
        state.masterTimeLeft--;
        
        // Actualizar UI discreta
        const m = Math.floor(state.masterTimeLeft / 60);
        const s = state.masterTimeLeft % 60;
        if (globalUI) {
            globalUI.innerHTML = `<span style="color:#ef4444;font-weight:bold;">⏱</span> ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }

        // Al completarse los 15 minutos exactos se fuerza el cierre
        if (state.masterTimeLeft <= 0) {
            clearInterval(state.masterTimer);
            clearInterval(state.timer);
            finishSession();
        }
    }, 1000);
}

function finishSession() {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    clearInterval(state.masterTimer);
    
    const globalUI = document.getElementById("globalTimerWidget");
    if (globalUI) globalUI.remove();

    const currentMissionId = state.missions[state.currentIndex]?.id || 0;
    
    if (typeof renderValidationScreen === "function") {
        renderValidationScreen(currentMissionId, {
            timeSpent: "15:00",
            status: "Complete"
        });
    } else {
        const app = document.getElementById("app");
        const title = state.language === "en" ? "🌟 GREAT JOB TODAY" : "🌟 EXCELENTE TRABAJO HOY";
        const bodyText = state.language === "en" 
            ? "<p>You completed your KAMIZEN session.</p><p>Small daily training creates powerful minds. See you next session, warrior. 🛡️</p>"
            : "<p>Has completado tu sesión de KAMIZEN.</p><p>El pequeño entrenamiento diario crea mentes poderosas. Nos vemos en la próxima sesión, guerrero. 🛡️</p>";
        const btnLabel = state.language === "en" ? "FINISH SESSION" : "FINALIZAR SESIÓN";

        app.innerHTML = `
            <div class="card center animated fadeIn">
                <h2>${title}</h2>
                ${bodyText}
                <button onclick="location.reload()" style="margin-top:20px;">${btnLabel}</button>
            </div>
        `;
        narrate(app.innerText);
    }
}

/* =========================
   CONTROLES DE NAVEGACIÓN Y CONFIGURACIÓN
========================= */
function toggleLanguage() {
    window.speechSynthesis.cancel();
    state.language = state.language === "en" ? "es" : "en";
    saveProgress();
    render();
}

function jumpToBlock() {
    const promptMsg = state.language === "en" 
        ? "Enter the MISSION ID to jump to (1-63):" 
        : "Introduce el ID de la MISIÓN a la que deseas saltar (1-63):";
    const notFoundMsg = state.language === "en" ? "Mission ID not found." : "ID de Misión no encontrado.";

    const targetMissionId = prompt(promptMsg);
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
            alert(notFoundMsg);
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
    const confirmMsg = state.language === "en"
        ? "Are you sure you want to RESTART from zero?"
        : "¿Estás seguro de que deseas REINICIAR desde cero?";

    if(confirm(confirmMsg)) {
        localStorage.clear();
        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "story";
        render();
    }
}

/* =========================
   LÓGICA DEL RELOJ (INTERNO DE BLOQUES)
========================= */
function startCountdown(seconds, onComplete) {
    clearInterval(state.timer);
    state.timeLeft = seconds;
    state.onCountdownComplete = onComplete;
    resumeCountdown();
}

function resumeCountdown() {
    const timerDisplay = document.getElementById("timerDisplay");
    clearInterval(state.timer);

    state.timer = setInterval(() => {
        state.timeLeft--;
        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;
        if (timerDisplay) timerDisplay.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        
        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            if (state.onCountdownComplete) state.onCountdownComplete();
        }
    }, 1000);
}

/* =========================
   MOTOR DE RENDERIZADO
========================= */
function showIntro() {
    state.phase = "intro";
    
    const labelRange = state.language === "en" ? "Range: Missions 1 - 63 Loaded" : "Rango: Misiones 1 - 63 Cargadas";
    const btnContinue = state.language === "en" ? "CONTINUE MISSION" : "CONTINUAR MISIÓN";
    const btnReset = state.language === "en" ? "RESET PROGRESS" : "REINICIAR PROGRESO";
    const btnLang = state.language === "en" ? "Español 🇪🇸" : "English 🇺🇸";

    document.getElementById("app").innerHTML = `
        <div class="card center" style="position:relative; width:100%; max-width:500px; margin:auto;">
            <button onclick="toggleLanguage()" style="position:absolute; top:10px; right:10px; padding:4px 8px; font-size:11px; background:#475569; width:auto; display:inline-block;">${btnLang}</button>
            <h1 style="font-size:1.8rem; margin-top:20px;">KAMIZEN LIFE SYSTEM</h1>
            <p>Training • Awareness • Control</p>
            <p class="small">${labelRange}</p>
            <button onclick="startSystem()" style="margin-top:15px;">${btnContinue}</button>
            <button onclick="restartSystem()" style="background:var(--danger);margin-top:10px;">${btnReset}</button>
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

    // Configuración responsiva y compacta de la cabecera
    const labelBack = state.language === "en" ? "BACK" : "ATRÁS";
    const labelJump = state.language === "en" ? "JUMP/SKIP" : "SALTAR";
    const labelReset = state.language === "en" ? "RESET" : "REINICIAR";
    const labelPause = state.language === "en" ? "PAUSE" : "PAUSA";
    const labelLang = state.language === "en" ? "ES 🇪🇸" : "EN 🇺🇸";

    let navHeader = `
        <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:4px; margin-bottom:12px; width:100%;">
            <button onclick="goBack()" style="padding:6px 2px; font-size:11px; background:#334155;">${labelBack}</button>
            <button onclick="togglePause()" style="padding:6px 2px; font-size:11px; background:#eab308; color:#0f172a; font-weight:bold;">${labelPause}</button>
            <button onclick="jumpToBlock()" style="padding:6px 2px; font-size:11px; background:#0ea5e9;">${labelJump}</button>
            <button onclick="toggleLanguage()" style="padding:6px 2px; font-size:11px; background:#475569;">${labelLang}</button>
            <button onclick="restartSystem()" style="padding:6px 2px; font-size:11px; background:var(--danger);">${labelReset}</button>
        </div>
    `;

    if (state.phase === "story") {
        const title = state.language === "en" ? `STORY ${story.id}` : `HISTORIA ${story.id}`;
        const currentTitleText = state.language === "en" ? (story.t_en || story.t || "") : (story.t_es || story.t || "");
        const currentBodyText = state.language === "en" ? (story.en || "") : (story.es || story.en || "");
        const labelNarrating = state.language === "en" ? "NARRATING..." : "NARRANDO...";

        app.innerHTML = navHeader + `
            <div class="card">
                <h2 style="color:var(--primary); font-size:1.5rem;">${title}</h2>
                <h3 style="font-size:1.2rem;">${currentTitleText}</h3>
                <p style="font-size:1.05rem; line-height:1.5; margin-top:10px;">${currentBodyText}</p>
            </div>
            <button id="continueBtn" disabled style="width:100%; padding:12px;">${labelNarrating}</button>
        `;
        
        narrate(`${currentTitleText}. ${currentBodyText}`, () => {
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

    const labelStayFocused = state.language === "en" ? "STAY FOCUSED" : "MANTÉN EL ENFOQUE";
    const labelNarrating = state.language === "en" ? "NARRATING..." : "NARRANDO...";

    const timerUI = `
        <div class="card center" style="border: 2px solid var(--primary); background: #0f172a; padding: 15px 10px; margin-bottom:10px;">
            <h1 id="timerDisplay" style="font-size:2.8rem; margin:0; font-family: monospace;">00:00</h1>
            <p style="color:var(--primary); letter-spacing: 1px; font-size:12px; margin:5px 0 0 0;">${labelStayFocused}</p>
        </div>
    `;

    // Extracción limpia de textos según el idioma configurado
    const blockTx = state.language === "en" ? (block.tx?.en || block.tx || "") : (block.tx?.es || block.tx?.en || block.tx || "");
    const blockStory = state.language === "en" ? (block.story?.en || "") : (block.story?.es || block.story?.en || "");
    const blockInf = state.language === "en" ? (block.inf?.en || "") : (block.inf?.es || block.inf?.en || "");
    const blockQ = state.language === "en" ? (block.q?.en || "") : (block.q?.es || block.q?.en || "");

    if (block.t === "v" || block.t === "h") { 
        html += `<div class="card"><h2 style="font-size:1.3rem;">${blockTx}</h2></div>`; 
        textToRead = blockTx; 
    }
    if (block.story) { 
        html += `<div class="card"><p style="font-size:1.05rem; line-height:1.5;">${blockStory}</p></div>`; 
        textToRead = blockStory; 
    }
    if (block.t === "breath_auto" || block.t === "br") {
        const labelReady = state.language === "en" ? "READY" : "LISTO";
        html += timerUI + `
            <div class="card center" style="padding:15px;">
                <div class="breath-circle" id="breathCircle" style="margin:10px auto; width:100px; height:100px;"><span id="breathLabel" style="font-size:14px;">${labelReady}</span></div>
                <h3 style="font-size:1.2rem; margin:10px 0;">${blockTx}</h3>
                <p class="small">${blockInf}</p>
            </div>`;
        textToRead = state.language === "en" 
            ? `${blockTx}. ${blockInf}. Get ready to breathe.` 
            : `${blockTx}. ${blockInf}. Prepárate para respirar.`;
    }
    if (block.t === "sil") {
        html += timerUI + `<div class="card"><h3 style="font-size:1.2rem;">${blockTx}</h3><p class="small">${blockInf}</p></div>`;
        textToRead = state.language === "en" 
            ? `${blockTx}. ${blockInf}. Practice silence now.` 
            : `${blockTx}. ${blockInf}. Practica el silencio ahora.`;
    }
    if (block.t === "d") {
        html += `<div class="card"><h3 style="font-size:1.2rem; margin-bottom:15px;">${blockQ}</h3>`;
        
        // Manejo de opciones localizadas si existen
        const optionsArray = state.language === "en" 
            ? (block.op_en || block.op || []) 
            : (block.op_es || block.op || []);

        optionsArray.forEach((opt, i) => {
            html += `<div class="answer" id="opt-${i}" style="padding:10px; margin-bottom:8px; border-radius:6px; background:#1e293b; cursor:pointer;" onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})">${opt}</div>`;
        });
        html += `</div>`;
        textToRead = `${blockQ}.`;
    }
    if (block.t === "r") { 
        const labelReward = state.language === "en" ? "REWARD" : "RECOMPENSA";
        html += `<div class="card center" style="padding:20px;"><h2>⭐ ${blockTx || labelReward}</h2><p style="font-size:1.8rem; font-weight:bold; color:var(--primary);">+${block.p || 0} XP</p></div>`; 
        textToRead = state.language === "en" ? `Reward. You earned ${block.p} experience points.` : `Recompensa. Has ganado ${block.p} puntos de experiencia.`; 
    }
    if (block.t === "c") { 
        html += `<div class="card"><p style="font-size:1.05rem;">${blockTx}</p></div>`; 
        textToRead = blockTx; 
    }

    if (block.t !== "d") html += `<button id="continueBtn" disabled style="width:100%; padding:12px;">${labelNarrating}</button>`;
    app.innerHTML = html;

    narrate(textToRead, () => {
        const labelSkip = state.language === "en" ? "SKIP" : "SALTAR";
        if (block.t === "breath_auto" || block.t === "br") {
            startCountdown(24, nextBlock);
            startGuidedBreathing();
            unlockContinue(labelSkip, nextBlock);
        } else if (block.t === "sil") {
            startCountdown(24, nextBlock);
            unlockContinue(labelSkip, nextBlock);
        } else if (block.t === "d") {
            // Esperar interacción
        } else {
            setTimeout(nextBlock, 1500);
        }
    });
}

function narrate(text, callback) {
    if (!text) { if (callback) callback(); return; }
    if (state.isPaused) return; // Salvaguarda anti-ejecución en pausa

    state.speechLocked = true;
    window.speechSynthesis.cancel();
    
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = state.language === "en" ? "en-US" : "es-ES";
    speech.rate = 0.95;
    
    speech.onend = () => { 
        state.speechLocked = false; 
        if (callback && !state.isPaused) callback(); 
    };
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
        if (!document.getElementById("breathCircle") || state.timeLeft <= 0 || state.isPaused) return;
        
        if (state.language === "en") {
            label.innerText = inhale ? "INHALE" : "EXHALE";
        } else {
            label.innerText = inhale ? "INHALA" : "EXHALA";
        }
        
        circle.style.transition = "transform 4000ms ease-in-out";
        circle.style.transform = inhale ? "scale(1.3)" : "scale(0.85)";
        inhale = !inhale;
    };
    
    step();
    const aniInterval = setInterval(() => {
        if (!document.getElementById("breathCircle") || state.timeLeft <= 0 || state.isPaused) { 
            clearInterval(aniInterval); 
            return; 
        }
        step();
    }, 4000);
}

/* =========================
   PROCESAMIENTO DE RESPUESTAS
========================= */
function selectAnswer(index, correct, explanations) {
    if (state.speechLocked || state.isPaused) return;
    
    const isCorrect = index === correct;
    
    // Obtener la explicación correcta según idioma
    let explanation = "";
    if (explanations) {
        if (state.language === "en") {
            explanation = explanations.en?.[index] || explanations[index] || "";
        } else {
            explanation = explanations.es?.[index] || explanations.en?.[index] || explanations[index] || "";
        }
    }

    const titleText = isCorrect 
        ? (state.language === "en" ? "EXCELLENT!" : "¡EXCELENTE!") 
        : (state.language === "en" ? "KEEP LEARNING" : "SIGUE APRENDIENDO");
        
    const btnLabel = state.language === "en" ? "NEXT STEP" : "SIGUIENTE PASO";
    const labelNarrating = state.language === "en" ? "NARRATING..." : "NARRANDO...";

    const feedbackWrap = document.createElement("div");
    feedbackWrap.innerHTML = `
        <div class="card" style="margin-top:10px; border-left: 4px solid ${isCorrect ? '#22c55e' : '#ef4444'}">
            <h3 style="color:${isCorrect ? '#22c55e' : '#ef4444'}; font-size:1.2rem;">${titleText}</h3>
            <p class="small" style="margin-top:5px;">${explanation}</p>
        </div>
        <button id="continueBtn" disabled style="width:100%; padding:12px; margin-top:5px;">${labelNarrating}</button>
    `;
    
    document.getElementById("app").appendChild(feedbackWrap);
    
    narrate(explanation, () => {
        unlockContinue(btnLabel, nextBlock);
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
