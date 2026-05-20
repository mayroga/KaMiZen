/* =========================================================
   KAMIZEN ENGINE V15 - FULL VERSION WITH REPORTE PDF
   ✔ Persistencia Local (LocalStorage)
   ✔ Narración Total: Preguntas + Opciones + Feedback (Bilingüe)
   ✔ Guía Vocal de Respiración (Visual)
   ✔ Botón JUMP/SKIP para navegación directa
   ✔ Soporte completo: v, h, story, br, sil, d, r, c
   ✔ Master Timer Visual: 15 Minutes (Cuenta regresiva global)
   ✔ Sistema de Pausa / Reanudación Automática y Manual
   ✔ Cambio de Idioma Dinámico (EN / ES) sin perder progreso
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
    timer: null,        // Timer del bloque actual (respiración/silencio)
    timeLeft: 0,        // Tiempo restante del bloque actual
    
    // Configuración del Master Timer (15 minutos globales)
    globalTimer: null,
    globalTimeLeft: 15 * 60, 
    isPaused: false,
    lang: "en",         // Idioma por defecto ("en" o "es")
    
    // Guardado de textos para reanudar narración si se pausa
    currentTextToNarrate: ""
};

// Diccionario de Interfaz para traducción en tiempo real
const i18n = {
    en: {
        booting: "SYSTEM BOOTING...",
        loading: "Loading Data (Missions 1-63)...",
        boot_error: "BOOT ERROR",
        check_api: "Check API Connection",
        back: "BACK",
        jump: "JUMP/SKIP",
        reset: "RESET",
        narrating: "NARRATING...",
        ready: "READY",
        inhale: "INHALE",
        exhale: "EXHALE",
        focused: "STAY FOCUSED",
        silence: "Practice silence now.",
        get_ready: "Get ready to breathe.",
        reward: "REWARD",
        xp: "XP",
        excellent: "EXCELLENT!",
        learning: "KEEP LEARNING",
        next_step: "NEXT STEP",
        skip: "SKIP",
        story_title: "STORY",
        jump_prompt: "Enter the MISSION ID to jump to (1-63):",
        jump_error: "Mission ID not found.",
        reset_confirm: "Are you sure you want to RESTART from zero?",
        options_intro: "Your options are: ",
        earned: "You have earned experience points.",
        pause: "PAUSE",
        resume: "RESUME",
        paused_banner: "SYSTEM PAUSED",
        global_time: "TOTAL TIME",
        btn_continue: "CONTINUE MISSION",
        btn_reset_prog: "RESET PROGRESS"
    },
    es: {
        booting: "INICIANDO SISTEMA...",
        loading: "Cargando Datos (Misiones 1-63)...",
        boot_error: "ERROR DE INICIO",
        check_api: "Verifique la Conexión API",
        back: "ATRÁS",
        jump: "SALTAR",
        reset: "REINICIAR",
        narrating: "NARRANDO...",
        ready: "LISTO",
        inhale: "INHALA",
        exhale: "EXHALA",
        focused: "MANTÉN LA CONCENTRACIÓN",
        silence: "Practica el silencio ahora.",
        get_ready: "Prepárate para respirar.",
        reward: "RECOMPENSA",
        xp: "XP",
        excellent: "¡EXCELENTE!",
        learning: "SIGUE APRENDIENDO",
        next_step: "SIGUIENTE PASO",
        skip: "SALTAR",
        story_title: "HISTORIA",
        jump_prompt: "Ingrese el ID de la MISIÓN para saltar (1-63):",
        jump_error: "ID de Misión no encontrado.",
        reset_confirm: "¿Está seguro de que desea REINICIAR desde cero?",
        options_intro: "Sus opciones son: ",
        earned: "Has ganado puntos de experiencia.",
        pause: "PAUSA",
        resume: "REANUDAR",
        paused_banner: "SISTEMA EN PAUSA",
        global_time: "TIEMPO TOTAL",
        btn_continue: "CONTINUAR MISIÓN",
        btn_reset_prog: "REINICIAR PROGRESO"
    }
};

/* =========================
   SISTEMA DE PERSISTENCIA
========================= */
function saveProgress() {
    localStorage.setItem('kamizen_save', JSON.stringify({
        currentIndex: state.currentIndex,
        currentBlock: state.currentBlock,
        lang: state.lang,
        globalTimeLeft: state.globalTimeLeft
    }));
}

function loadProgress() {
    const saved = localStorage.getItem('kamizen_save');
    if (saved) {
        const data = JSON.parse(saved);
        state.currentIndex = data.currentIndex || 0;
        state.currentBlock = data.currentBlock || 0;
        state.lang = data.lang || "en";
        state.globalTimeLeft = data.globalTimeLeft !== undefined ? data.globalTimeLeft : 15 * 60;
    }
}

/* =========================
   INICIALIZACIÓN DEL SISTEMA
========================= */
window.addEventListener("load", async () => {
    loadProgress();
    injectGlobalTimerDOM();
    setupInterruptionListeners();
    await loadAllData();
    showIntro();
});

async function loadAllData() {
    const app = document.getElementById("app");
    const t = i18n[state.lang];
    app.innerHTML = `<div class="card"><h2>${t.booting}</h2><p>${t.loading}</p></div>`;
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
        app.innerHTML = `<div class="card"><h2>${t.boot_error}</h2><p>${t.check_api}</p></div>`;
    }
}

/* =========================
   INYECTAR RELOJ GLOBAL (DOM)
========================= */
function injectGlobalTimerDOM() {
    if (document.getElementById("kamizen-global-timer")) return;
    const timerDiv = document.createElement("div");
    timerDiv.id = "kamizen-global-timer";
    timerDiv.style = "position: fixed; top: 10px; right: 10px; z-index: 1000; background: rgba(15, 23, 42, 0.85); border: 1px solid var(--primary, #0ea5e9); padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 11px; color: #fff; display: none; text-align: right;";
    document.body.appendChild(timerDiv);
}

function updateGlobalTimerDisplay() {
    const timerDiv = document.getElementById("kamizen-global-timer");
    if (!timerDiv) return;
    if (state.phase === "intro" || state.phase === "loading") {
        timerDiv.style.display = "none";
        return;
    }
    timerDiv.style.display = "block";
    const m = Math.floor(state.globalTimeLeft / 60);
    const s = state.globalTimeLeft % 60;
    const t = i18n[state.lang];
    timerDiv.innerHTML = `<div>${t.global_time}</div><div style="font-size:14px; font-weight:bold; color:var(--primary, #0ea5e9);">${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}</div>`;
}

/* =========================
   CONTROL DE CIERRE Y REPORTE (15 MIN)
========================= */
function startMasterTimer() {
    clearInterval(state.globalTimer);
    state.globalTimer = setInterval(() => {
        if (!state.isPaused) {
            state.globalTimeLeft--;
            updateGlobalTimerDisplay();
            saveProgress();

            if (state.globalTimeLeft <= 0) {
                clearInterval(state.globalTimer);
                finishSession();
            }
        }
    }, 1000);
    updateGlobalTimerDisplay();
}

function finishSession() {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    clearInterval(state.globalTimer);
    
    const currentMissionId = state.missions[state.currentIndex]?.id || 0;
    
    if (typeof renderValidationScreen === "function") {
        renderValidationScreen(currentMissionId, {
            timeSpent: "15:00",
            status: "Complete"
        });
    } else {
        const app = document.getElementById("app");
        if (state.lang === "es") {
            app.innerHTML = `
                <div class="card center animated fadeIn">
                    <h2>🌟 EXCELENTE TRABAJO HOY</h2>
                    <p>Has completado tu sesión de KAMIZEN.</p>
                    <p>Tu cerebro y tu cuerpo solo necesitan unos minutos enfocados para fortalecerse.</p>
                    <p>KAMIZEN está diseñado para entrenar con calma, no sin fin.</p>
                    <button onclick="localStorage.clear(); location.reload();" style="margin-top:20px;">FINALIZAR SESIÓN</button>
                </div>`;
        } else {
            app.innerHTML = `
                <div class="card center animated fadeIn">
                    <h2>🌟 GREAT JOB TODAY</h2>
                    <p>You completed your KAMIZEN session.</p>
                    <p>You brain and body only need a few focused minutes to grow stronger.</p>
                    <p>KAMIZEN is designed to help you train calmly, not endlessly.</p>
                    <button onclick="localStorage.clear(); location.reload();" style="margin-top:20px;">FINISH SESSION</button>
                </div>`;
        }
        const textToRead = app.innerText;
        narrate(textToRead);
    }
}

/* =========================
   SISTEMA DE PAUSA MANUAL Y AUTOMÁTICA
========================= */
function togglePause() {
    if (state.isPaused) {
        resumeSystem();
    } else {
        pauseSystem();
    }
}

function pauseSystem() {
    if (state.phase === "intro" || state.phase === "loading") return;
    state.isPaused = true;
    window.speechSynthesis.cancel(); 
    clearInterval(state.timer);
    render(); 
}

function resumeSystem() {
    state.isPaused = false;
    render(); 
}

function setupInterruptionListeners() {
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && !state.isPaused) {
            pauseSystem();
        }
    });
    window.addEventListener("blur", () => {
        if (!state.isPaused) {
            pauseSystem();
        }
    });
}

/* =========================
   CAMBIO DE IDIOMA DINÁMICO
========================= */
function toggleLanguage() {
    state.lang = state.lang === "en" ? "es" : "en";
    
    // CORRECCIÓN CLAVE: Forzar la cancelación absoluta de la síntesis y liberar candados de voz
    window.speechSynthesis.cancel();
    state.speechLocked = false; 
    
    saveProgress();
    updateGlobalTimerDisplay();
    
    // Si hay un timer corriendo de un bloque, se limpia para evitar duplicidad al re-renderizar
    clearInterval(state.timer); 
    
    render();
}

/* =========================
   CONTROLES DE NAVEGACIÓN
========================= */
function jumpToBlock() {
    const t = i18n[state.lang];
    const targetMissionId = prompt(t.jump_prompt);
    if (targetMissionId !== null && targetMissionId !== "") {
        const idNum = Number(targetMissionId);
        const idx = state.missions.findIndex(m => m.id === idNum);
        if (idx !== -1) {
            window.speechSynthesis.cancel();
            state.speechLocked = false;
            clearInterval(state.timer);
            state.currentIndex = idx;  
            state.currentBlock = 0;    
            state.phase = "story";      
            state.isPaused = false;
            render();
        } else {
            alert(t.jump_error + " (" + idNum + ")");
        }
    }
}

function goBack() {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    state.speechLocked = false;
    state.isPaused = false;
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
    const t = i18n[state.lang];
    if(confirm(t.reset_confirm)) {
        localStorage.clear();
        state.currentIndex = 0;
        state.currentBlock = 0;
        state.globalTimeLeft = 15 * 60;
        state.phase = "story";
        state.isPaused = false;
        window.speechSynthesis.cancel();
        state.speechLocked = false;
        render();
    }
}

/* =========================
   LÓGICA DEL RELOJ DE BLOQUE
========================= */
function startCountdown(seconds, onComplete) {
    clearInterval(state.timer);
    state.timeLeft = seconds;
    const timerDisplay = document.getElementById("timerDisplay");

    state.timer = setInterval(() => {
        if (!state.isPaused) {
            state.timeLeft--;
            const m = Math.floor(state.timeLeft / 60);
            const s = state.timeLeft % 60;
            if (timerDisplay) timerDisplay.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            if (state.timeLeft <= 0) {
                clearInterval(state.timer);
                if (onComplete) onComplete();
            }
        }
    }, 1000);
}

/* =========================
   MOTOR DE RENDERIZADO
========================= */
function showIntro() {
    state.phase = "intro";
    updateGlobalTimerDisplay();
    const t = i18n[state.lang];
    
    document.getElementById("app").innerHTML = `
        <div style="text-align:right; margin-bottom: 10px;">
            <button onclick="toggleLanguage()" style="padding:4px 8px; font-size:11px; background:#475569;">🌐 ${state.lang.toUpperCase()}</button>
        </div>
        <div class="card center">
            <h1>KAMIZEN LIFE SYSTEM</h1>
            <p>Training • Awareness • Control</p>
            <p class="small">Range: Missions 1 - 63 Loaded</p>
            <button onclick="startSystem()">${t.btn_continue}</button>
            <button onclick="restartSystem()" style="background:var(--danger);margin-top:10px;">${t.btn_reset_prog}</button>
        </div>
    `;
}

function startSystem() {
    state.phase = "story";
    startMasterTimer();
    render();
}

function render() {
    if (!state.initialized) return;
    saveProgress();
    updateGlobalTimerDisplay();
    
    const app = document.getElementById("app");
    const t = i18n[state.lang];
    
    let navHeader = `
        <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px; align-items:center;">
            <button onclick="goBack()" style="flex:1; min-width:60px; padding:8px; font-size:11px; background:#334155;">${t.back}</button>
            <button onclick="togglePause()" style="flex:1; min-width:70px; padding:8px; font-size:11px; background:#eab308; color:#0f172a; font-weight:bold;">${state.isPaused ? t.resume : t.pause}</button>
            <button onclick="jumpToBlock()" style="flex:1; min-width:80px; padding:8px; font-size:11px; background:#0ea5e9;">${t.jump}</button>
            <button onclick="restartSystem()" style="flex:1; min-width:60px; padding:8px; font-size:11px; background:var(--danger);">${t.reset}</button>
            <button onclick="toggleLanguage()" style="padding:8px; font-size:11px; background:#475569; min-width:40px;">🌐 ${state.lang.toUpperCase()}</button>
        </div>
    `;

    if (state.isPaused) {
        app.innerHTML = navHeader + `
            <div class="card center" style="border: 2px dashed #eab308;">
                <h2 style="color:#eab308; margin:0;">⏸ ${t.paused_banner}</h2>
                <p style="font-size:0.9rem; margin-top:10px;">${state.lang === "es" ? "Misión pausada. Haz clic en REANUDAR para continuar donde quedaste." : "Mission paused. Click RESUME to continue right where you left off."}</p>
                <button onclick="resumeSystem()" style="background:#eab308; color:#0f172a; margin-top:15px; width:100%;">${t.resume}</button>
            </div>
        `;
        return;
    }

    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    if (!story || !mission) {
        state.currentIndex = 0; state.currentBlock = 0; state.phase = "story";
        return render();
    }

    if (state.phase === "story") {
        const storyTitle = `${t.story_title} ${story.id}`;
        const storyText = state.lang === "es" && story.es ? story.es : story.en;
        const storyHeading = state.lang === "es" && story.t_es ? story.t_es : story.t;

        app.innerHTML = navHeader + `
            <div class="card">
                <h2 style="color:var(--primary)">${storyTitle}</h2>
                <h3>${storyHeading || ""}</h3>
                <p style="font-size:1.1rem; line-height:1.6;">${storyText || ""}</p>
            </div>
            <button id="continueBtn" disabled>${t.narrating}</button>
        `;
        
        state.currentTextToNarrate = `${storyHeading}. ${storyText}`;
        narrate(state.currentTextToNarrate, () => {
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
    const t = i18n[state.lang];
    let html = navHeader;
    let textToRead = "";

    const timerUI = `
        <div class="card center" style="border: 3px solid var(--primary); background: #0f172a; padding: 15px 10px;">
            <h1 id="timerDisplay" style="font-size:3.5rem; margin:0; font-family: monospace;">00:00</h1>
            <p style="color:var(--primary); letter-spacing: 2px; margin:5px 0 0 0; font-size:0.8rem;">${t.focused}</p>
        </div>
    `;

    const blockTx = state.lang === "es" && block.tx?.es ? block.tx.es : (block.tx?.en || block.tx || "");
    const blockInf = state.lang === "es" && block.inf?.es ? block.inf.es : (block.inf?.en || block.inf || "");
    const blockStory = state.lang === "es" && block.story?.es ? block.story.es : (block.story?.en || "");
    const blockQ = state.lang === "es" && block.q?.es ? block.q.es : (block.q?.en || "");

    if (block.t === "v" || block.t === "h") { 
        html += `<div class="card"><h2>${blockTx}</h2></div>`; 
        textToRead = blockTx; 
    }
    if (block.story) { 
        html += `<div class="card"><p>${blockStory}</p></div>`; 
        textToRead = blockStory; 
    }
    if (block.t === "breath_auto" || block.t === "br") {
        html += timerUI + `<div class="card center"><div class="breath-circle" id="breathCircle" style="margin: 15px auto;"><span id="breathLabel">${t.ready}</span></div><h3>${blockTx}</h3><p style="font-size:0.9rem;">${blockInf}</p></div>`;
        textToRead = `${blockTx}. ${blockInf}. ${t.get_ready}`;
    }
    if (block.t === "sil") {
        html += timerUI + `<div class="card"><h3>${blockTx}</h3><p style="font-size:0.9rem;">${blockInf}</p></div>`;
        textToRead = `${blockTx}. ${blockInf}. ${t.silence}`;
    }
    if (block.t === "d") {
        html += `<div class="card"><h3>${blockQ}</h3>`;
        const currentOptions = state.lang === "es" && block.op_es ? block.op_es : block.op;
        currentOptions?.forEach((opt, i) => {
            html += `<div class="answer" id="opt-${i}" onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')}, ${JSON.stringify(block.ex_es).replace(/"/g, '&quot;')})">${opt}</div>`;
        });
        html += `</div>`;
        textToRead = `${blockQ}. ${t.options_intro} ${currentOptions.join(". ")}`;
    }
    if (block.t === "r") { 
        html += `<div class="card center"><h2>⭐ ${blockTx || t.reward}</h2><p style="font-size:1.5rem; margin:10px 0;">+${block.p || 0} ${t.xp}</p></div>`; 
        textToRead = `${blockTx || t.reward}. ${t.earned.replace("experience points", (block.p || 0) + " " + t.xp)}`; 
    }
    if (block.t === "c") { 
        html += `<div class="card"><p>${blockTx}</p></div>`; 
        textToRead = blockTx; 
    }

    if (block.t !== "d") html += `<button id="continueBtn" disabled>${t.narrating}</button>`;
    app.innerHTML = html;

    state.currentTextToNarrate = textToRead;
    
    // CORRECCIÓN CLAVE: Al entrar en modos automáticos temporizados, aseguramos el refresco del layout.
    narrate(textToRead, () => {
        if (block.t === "breath_auto" || block.t === "br") {
            startCountdown(24, nextBlock);
            startGuidedBreathing();
            unlockContinue(t.skip, nextBlock);
        } else if (block.t === "sil") {
            startCountdown(24, nextBlock);
            unlockContinue(t.skip, nextBlock);
        } else if (block.t === "d") {
            // Espera acción
        } else {
            setTimeout(nextBlock, 1500);
        }
    });
}

function narrate(text, callback) {
    if (!text || state.isPaused) { if (callback) callback(); return; }
    state.speechLocked = true;
    window.speechSynthesis.cancel();
    
    const speech = new SpeechSynthesisUtterance(text);
    
    // CORRECCIÓN EN LA ASIGNACIÓN DETALLADA DEL IDIOMA
    speech.lang = state.lang === "es" ? "es-ES" : "en-US";
    speech.rate = 0.95;
    
    speech.onend = () => { 
        state.speechLocked = false; 
        if (callback && !state.isPaused) callback(); 
    };
    
    speech.onerror = () => {
        state.speechLocked = false;
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
    const t = i18n[state.lang];
    
    const step = () => {
        if (!document.getElementById("breathCircle") || state.timeLeft <= 0 || state.isPaused) return;
        label.innerText = inhale ? t.inhale : t.exhale;
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

function selectAnswer(index, correct, explanations, explanationsEs) {
    if (state.speechLocked || state.isPaused) return;
    const isCorrect = index === correct;
    const t = i18n[state.lang];
    
    let explanation = "";
    if (state.lang === "es") {
        explanation = explanationsEs?.[index] || explanations?.[index] || "";
    } else {
        explanation = explanations?.[index] || "";
    }

    const feedbackWrap = document.createElement("div");
    feedbackWrap.innerHTML = `
        <div class="card" style="margin-top:10px; border-left: 5px solid ${isCorrect ? '#22c55e' : '#ef4444'}">
            <h3 style="color:${isCorrect ? '#22c55e' : '#ef4444'}">${isCorrect ? t.excellent : t.learning}</h3>
            <p style="font-size:0.95rem;">${explanation}</p>
        </div>
        <button id="continueBtn" disabled>${t.narrating}</button>
    `;
    document.getElementById("app").appendChild(feedbackWrap);
    
    state.currentTextToNarrate = explanation;
    narrate(explanation, () => {
        unlockContinue(t.next_step, nextBlock);
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
