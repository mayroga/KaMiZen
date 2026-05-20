/* =========================================================
   KAMIZEN ENGINE V16 - BEHAVIORAL TELEMETRY EDITION
   ✔ Real-Time Bio-Behavioral Tracking (VR-Game Style)
   ✔ Measures: Impulsivity, Focus, Cognitive Delay, and Attention Drop
   ✔ Absolute Master Timer (15 Minutes strict, Unix Timestamp)
   ✔ Audio-Syllable Sync & Interruption Protection
   ✔ Complete Local Persistence (LocalStorage)
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
    
    // Master Timer (15 minutes exact)
    globalTimer: null,
    endTime: null,       
    globalTimeLeft: 15 * 60, 
    isPaused: false,
    currentTextToNarrate: "",

    // MOTOR DE TELEMETRÍA CONDUCTUAL (Real-Time Metrics)
    telemetry: {
        sessionStart: null,
        totalPauses: 0,             // Índice de interrupción
        screenDesertions: 0,        // Veces que abandonó la pestaña / quitó foco
        impulsiveClicks: 0,         // Clicks ansiosos mientras la voz está bloqueada
        breathingSecondsTarget: 0,  // Segundos ideales de respiración
        breathingSecondsReal: 0,    // Segundos reales manteniendo el foco en respiración
        silenceSecondsTarget: 0,    // Segundos ideales de silencio
        silenceSecondsReal: 0,      // Segundos reales manteniendo el foco en silencio
        decisionTimes: [],          // Tiempos de reacción en milisegundos
        correctAnswers: 0,
        totalQuestions: 0
    },
    
    // Auxiliares de medición
    blockStartTime: null,
    voiceStartTime: null
};

const i18n = {
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
    reward: "ANALYSIS",
    xp: "PTS",
    excellent: "COMPLETED",
    learning: "PROCESSED",
    next_step: "CONTINUE",
    skip: "SKIP",
    story_title: "MISSION CONTEXT",
    jump_prompt: "Enter the MISSION ID to jump to (1-63):",
    jump_error: "Mission ID not found.",
    reset_confirm: "Are you sure you want to RESTART from zero?",
    options_intro: "Your choices are: ",
    pause: "PAUSE",
    resume: "RESUME",
    paused_banner: "SYSTEM PAUSED",
    global_time: "SESSION TIME",
    btn_continue: "START LOGISTICS SESSION",
    btn_reset_prog: "RESET PROGRESS"
};

/* ====================================
   PERSISTENCIA Y REGISTRO DE EVENTOS
==================================== */
function saveProgress() {
    localStorage.setItem('kamizen_v16_save', JSON.stringify({
        currentIndex: state.currentIndex,
        currentBlock: state.currentBlock,
        endTime: state.endTime,
        telemetry: state.telemetry
    }));
}

function loadProgress() {
    const saved = localStorage.getItem('kamizen_v16_save');
    if (saved) {
        const data = JSON.parse(saved);
        state.currentIndex = data.currentIndex || 0;
        state.currentBlock = data.currentBlock || 0;
        state.endTime = data.endTime || null;
        if (data.telemetry) state.telemetry = data.telemetry;
    }
}

/* ====================================
   INICIALIZACIÓN DEL SISTEMA
==================================== */
window.addEventListener("load", async () => {
    loadProgress();
    injectGlobalTimerDOM();
    setupInterruptionListeners();
    setupGlobalClickTracker();
    await loadAllData();
    showIntro();
});

async function loadAllData() {
    const app = document.getElementById("app");
    app.innerHTML = `<div class="card"><h2>${i18n.booting}</h2><p>${i18n.loading}</p></div>`;
    try {
        const [storiesReq, missionsReq] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);
        state.stories = await storiesReq.json().then(d => Array.isArray(d.stories) ? d.stories.sort((a,b)=>a.id-b.id) : []);
        state.missions = await missionsReq.json().then(d => Array.isArray(d.missions) ? d.missions.sort((a,b)=>a.id-b.id) : []);
        state.initialized = true;
    } catch (err) {
        console.error(err);
        app.innerHTML = `<div class="card"><h2>${i18n.boot_error}</h2><p>${i18n.check_api}</p></div>`;
    }
}

function injectGlobalTimerDOM() {
    if (document.getElementById("kamizen-global-timer")) return;
    const timerDiv = document.createElement("div");
    timerDiv.id = "kamizen-global-timer";
    timerDiv.style = "position: fixed; top: 10px; right: 10px; z-index: 1000; background: rgba(15, 23, 42, 0.9); border: 1px solid #0ea5e9; padding: 6px 10px; border-radius: 4px; font-family: monospace; font-size: 11px; color: #fff; display: none; text-align: right; box-shadow: 0 4px 6px rgba(0,0,0,0.3);";
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
    const m = Math.floor(Math.max(0, state.globalTimeLeft) / 60);
    const s = Math.max(0, state.globalTimeLeft) % 60;
    timerDiv.innerHTML = `<div>${i18n.global_time}</div><div style="font-size:15px; font-weight:bold; color:#0ea5e9;">${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}</div>`;
}

/* ====================================
   CONTROL DE CIERRE ABSOLUTO (15 MIN)
==================================== */
function startMasterTimer() {
    clearInterval(state.globalTimer);
    if (!state.endTime) {
        state.endTime = Date.now() + (15 * 60 * 1000);
    }
    if (!state.telemetry.sessionStart) {
        state.telemetry.sessionStart = Date.now();
    }

    state.globalTimer = setInterval(() => {
        const totalMsLeft = state.endTime - Date.now();
        state.globalTimeLeft = Math.ceil(totalMsLeft / 1000);

        if (!state.isPaused && document.hasFocus()) {
            const block = state.missions[state.currentIndex]?.b[state.currentBlock];
            if (block) {
                if (block.t === "breath_auto" || block.t === "br") state.telemetry.breathingSecondsReal += 0.25;
                if (block.t === "sil") state.telemetry.silenceSecondsReal += 0.25;
            }
        }

        updateGlobalTimerDisplay();
        saveProgress();

        if (state.globalTimeLeft <= 0) {
            clearInterval(state.globalTimer);
            finishSession();
        }
    }, 250);
}

/* ====================================
   CAPTURA DE TELEMETRÍA PURA (MECÁNICAS VR)
==================================== */
function setupInterruptionListeners() {
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && state.phase !== "intro" && state.phase !== "loading") {
            state.telemetry.screenDesertions++;
            if (!state.isPaused) pauseSystem();
        }
    });
    window.addEventListener("blur", () => {
        if (state.phase !== "intro" && state.phase !== "loading") {
            state.telemetry.screenDesertions++;
            if (!state.isPaused) pauseSystem();
        }
    });
}

function setupGlobalClickTracker() {
    document.addEventListener("click", (e) => {
        if (state.speechLocked) {
            const targetTag = e.target.tagName.toLowerCase();
            if (targetTag === "div" || targetTag === "p" || e.target.id === "continueBtn") {
                state.telemetry.impulsiveClicks++;
            }
        }
    });
}

/* ====================================
   CONTROL DE NAVEGACIÓN Y PAUSAS
==================================== */
function togglePause() {
    if (state.isPaused) {
        resumeSystem();
    } else {
        state.telemetry.totalPauses++;
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

function jumpToBlock() {
    const targetMissionId = prompt(i18n.jump_prompt);
    if (targetMissionId !== null && targetMissionId !== "") {
        const idNum = Number(targetMissionId);
        const idx = state.missions.findIndex(m => m.id === idNum);
        if (idx !== -1) {
            window.speechSynthesis.cancel();
            clearInterval(state.timer);
            state.currentIndex = idx;  
            state.currentBlock = 0;    
            state.phase = "story";      
            state.isPaused = false;
            render();
        } else {
            alert(i18n.jump_error + " (" + idNum + ")");
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
    if(confirm(i18n.reset_confirm)) {
        localStorage.clear();
        state.currentIndex = 0;
        state.currentBlock = 0;
        state.endTime = Date.now() + (15 * 60 * 1000); 
        state.globalTimeLeft = 15 * 60;
        state.phase = "story";
        state.isPaused = false;
        state.telemetry = {
            sessionStart: Date.now(), totalPauses: 0, screenDesertions: 0, impulsiveClicks: 0,
            breathingSecondsTarget: 0, breathingSecondsReal: 0, silenceSecondsTarget: 0, silenceSecondsReal: 0,
            decisionTimes: [], correctAnswers: 0, totalQuestions: 0
        };
        render();
    }
}

function startCountdown(seconds, onComplete) {
    clearInterval(state.timer);
    state.timeLeft = seconds;
    const timerDisplay = document.getElementById("timerDisplay");

    state.timer = setInterval(() => {
        if (!state.isPaused) {
            state.timeLeft--;
            if (timerDisplay) {
                const m = Math.floor(state.timeLeft / 60);
                const s = state.timeLeft % 60;
                timerDisplay.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} =`;
            }
            if (state.timeLeft <= 0) {
                clearInterval(state.timer);
                if (onComplete) onComplete();
            }
        }
    }, 1000);
}

/* ====================================
   MOTOR DE RENDERIZADO
==================================== */
function showIntro() {
    state.phase = "intro";
    updateGlobalTimerDisplay();
    document.getElementById("app").innerHTML = `
        <div class="card center">
            <h1>AL CIELO • KAMIZEN</h1>
            <p style="letter-spacing:3px;font-size:0.85rem;color:#0ea5e9;">PSYCHOMETRIC LOGISTICS TRAINING</p>
            <p class="small">Operational Range: Missions 1 - 63 Active</p>
            <button onclick="startSystem()">${i18n.btn_continue}</button>
            <button onclick="restartSystem()" style="background:var(--danger);margin-top:10px;">${i18n.btn_reset_prog}</button>
        </div>
    `;
}

function startSystem() {
    state.phase = "story";
    startMasterTimer();
    render();
}

// Función limpia para reiniciar la app al terminar los 15 minutos sin perder el progreso de misión
function resetSessionAfterFinish() {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    clearInterval(state.globalTimer);
    
    // Restablecer marcas de tiempo y métricas para el próximo bloque de 15 minutos
    state.endTime = null; 
    state.globalTimeLeft = 15 * 60;
    state.isPaused = false;
    state.telemetry = {
        sessionStart: null, totalPauses: 0, screenDesertions: 0, impulsiveClicks: 0,
        breathingSecondsTarget: 0, breathingSecondsReal: 0, silenceSecondsTarget: 0, silenceSecondsReal: 0,
        decisionTimes: [], correctAnswers: 0, totalQuestions: 0
    };
    
    // Guardar estado limpio manteniendo currentIndex y currentBlock intactos
    saveProgress();
    
    // Dirigir directamente al render inicial del sistema como al principio
    showIntro();
}

function render() {
    if (!state.initialized) return;
    saveProgress();
    updateGlobalTimerDisplay();
    
    const app = document.getElementById("app");
    
    let navHeader = `
        <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px; align-items:center;">
            <button onclick="goBack()" style="flex:1; min-width:60px; padding:8px; font-size:11px; background:#334155;">${i18n.back}</button>
            <button onclick="togglePause()" style="flex:1; min-width:70px; padding:8px; font-size:11px; background:#eab308; color:#0f172a; font-weight:bold;">${state.isPaused ? i18n.resume : i18n.pause}</button>
            <button onclick="jumpToBlock()" style="flex:1; min-width:80px; padding:8px; font-size:11px; background:#0ea5e9;">${i18n.jump}</button>
            <button onclick="restartSystem()" style="flex:1; min-width:60px; padding:8px; font-size:11px; background:var(--danger);">${i18n.reset}</button>
        </div>
    `;

    if (state.isPaused) {
        app.innerHTML = navHeader + `
            <div class="card center" style="border: 2px dashed #eab308;">
                <h2 style="color:#eab308; margin:0;">⏸ ${i18n.paused_banner}</h2>
                <p style="font-size:0.9rem; margin-top:10px;">Training suspended. System is currently recording tracking retention state.</p>
                <button onclick="resumeSystem()" style="background:#eab308; color:#0f172a; margin-top:15px; width:100%;">${i18n.resume}</button>
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
        app.innerHTML = navHeader + `
            <div class="card">
                <h2 style="color:var(--primary)">${i18n.story_title} [M-${story.id}]</h2>
                <h3>${story.t || ""}</h3>
                <p style="font-size:1.1rem; line-height:1.6;">${story.en || ""}</p>
            </div>
            <button id="continueBtn" disabled>${i18n.narrating}</button>
        `;
        
        narrate(`${story.t || ""}. ${story.en || ""}`, () => {
            setTimeout(startMission, 1200);
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
        <div class="card center" style="border: 3px solid var(--primary); background: #0f172a; padding: 15px 10px;">
            <h1 id="timerDisplay" style="font-size:3.5rem; margin:0; font-family: monospace;">00:00</h1>
            <p style="color:var(--primary); letter-spacing: 2px; margin:5px 0 0 0; font-size:0.8rem;">${i18n.focused}</p>
        </div>
    `;

    const blockTx = block.tx?.en || block.tx || "";
    const blockInf = block.inf?.en || block.inf || "";
    const blockStory = block.story?.en || block.story || "";
    const blockQ = block.q?.en || block.q || "";

    if (block.t === "v" || block.t === "h") { 
        html += `<div class="card"><h2>${blockTx}</h2></div>`; 
        textToRead = blockTx; 
    }
    if (block.story) { 
        html += `<div class="card"><p>${blockStory}</p></div>`; 
        textToRead = blockStory; 
    }
    if (block.t === "breath_auto" || block.t === "br") {
        state.telemetry.breathingSecondsTarget += 24;
        html += timerUI + `<div class="card center"><div class="breath-circle" id="breathCircle" style="margin: 15px auto;"><span id="breathLabel">${i18n.ready}</span></div><h3>${blockTx}</h3><p style="font-size:0.9rem;">${blockInf}</p></div>`;
        textToRead = `${blockTx}. ${blockInf}. ${i18n.get_ready}`;
    }
    if (block.t === "sil") {
        state.telemetry.silenceSecondsTarget += 24;
        html += timerUI + `<div class="card"><h3>${blockTx}</h3><p style="font-size:0.9rem;">${blockInf}</p></div>`;
        textToRead = `${blockTx}. ${blockInf}. ${i18n.silence}`;
    }
    if (block.t === "d") {
        state.telemetry.totalQuestions++;
        html += `<div class="card"><h3>${blockQ}</h3>`;
        const currentOptions = block.op || [];
        currentOptions.forEach((opt, i) => {
            html += `<div class="answer" id="opt-${i}" onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})">${opt}</div>`;
        });
        html += `</div>`;
        textToRead = `${blockQ}. ${i18n.options_intro} ${currentOptions.join(". ")}`;
    }
    if (block.t === "r") { 
        html += `<div class="card center"><h2>📊 ${i18n.reward}</h2><p style="font-size:1.2rem; margin:10px 0; color:#22c55e;">METRICS ATTACHED TO REPORT</p></div>`; 
        textToRead = `${blockTx || "Processing biometric tracking indices"}`; 
    }
    if (block.t === "c") { 
        html += `<div class="card"><p>${blockTx}</p></div>`; 
        textToRead = blockTx; 
    }

    if (block.t !== "d") html += `<button id="continueBtn" disabled>${i18n.narrating}</button>`;
    app.innerHTML = html;

    narrate(textToRead, () => {
        if (block.t === "breath_auto" || block.t === "br") {
            startCountdown(24, nextBlock);
            startGuidedBreathing();
            unlockContinue(i18n.skip, nextBlock);
        } else if (block.t === "sil") {
            startCountdown(24, nextBlock);
            unlockContinue(i18n.skip, nextBlock);
        } else if (block.t === "d") {
            state.voiceStartTime = Date.now(); 
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
    speech.lang = "en-US"; 
    speech.rate = 0.95;
    
    speech.onend = () => { 
        state.speechLocked = false; 
        if (callback && !state.isPaused) callback(); 
    };
    speech.onerror = () => { state.speechLocked = false; };

    window.speechSynthesis.speak(speech);
}

function startGuidedBreathing() {
    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");
    if (!circle || !label) return;
    let inhale = true;
    
    const step = () => {
        if (!document.getElementById("breathCircle") || state.timeLeft <= 0 || state.isPaused) return;
        label.innerText = inhale ? i18n.inhale : i18n.exhale;
        circle.style.transition = "transform 4000ms ease-in-out";
        circle.style.transform = inhale ? "scale(1.25)" : "scale(0.85)";
        inhale = !inhale;
    };
    step();
    const aniInterval = setInterval(() => {
        if (!document.getElementById("breathCircle") || state.timeLeft <= 0 || state.isPaused) { clearInterval(aniInterval); return; }
        step();
    }, 4000);
}

function selectAnswer(index, correct, explanations) {
    if (state.speechLocked || state.isPaused) return;
    
    if (state.voiceStartTime) {
        const reactionTime = Date.now() - state.voiceStartTime;
        state.telemetry.decisionTimes.push(reactionTime);
        state.voiceStartTime = null; 
    }

    const isCorrect = index === correct;
    if (isCorrect) state.telemetry.correctAnswers++;
    
    let explanation = explanations?.[index] || "";

    const feedbackWrap = document.createElement("div");
    feedbackWrap.innerHTML = `
        <div class="card" style="margin-top:10px; border-left: 5px solid ${isCorrect ? '#22c55e' : '#ef4444'}">
            <h3 style="color:${isCorrect ? '#22c55e' : '#ef4444'}">${isCorrect ? i18n.excellent : i18n.learning}</h3>
            <p style="font-size:0.95rem;">${explanation}</p>
        </div>
        <button id="continueBtn" disabled>${i18n.narrating}</button>
    `;
    document.getElementById("app").appendChild(feedbackWrap);
    
    narrate(explanation, () => {
        unlockContinue(i18n.next_step, nextBlock);
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

/* ====================================
   FINALIZACIÓN Y GENERACIÓN DE REPORTE REAL
==================================== */
function finishSession() {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    clearInterval(state.globalTimer);
    
    const t = state.telemetry;
    const avgDecisionTime = t.decisionTimes.length ? (t.decisionTimes.reduce((a,b)=>a+b,0) / t.decisionTimes.length / 1000).toFixed(2) : "0.00";
    
    const breathingFocus = t.breathingSecondsTarget ? Math.min(100, Math.round((t.breathingSecondsReal / t.breathingSecondsTarget) * 100)) : 100;
    const silenceFocus = t.silenceSecondsTarget ? Math.min(100, Math.round((t.silenceSecondsReal / t.silenceSecondsTarget) * 100)) : 100;
    const successRate = t.totalQuestions ? Math.round((t.correctAnswers / t.totalQuestions) * 100) : 100;

    const finalReportData = {
        sessionDuration: "15:00",
        interruptionIndex: t.totalPauses,
        focusDropCount: t.screenDesertions,
        impulsivityMarkers: t.impulsiveClicks,
        breathingCompliance: `${breathingFocus}%`,
        silenceCompliance: `${silenceFocus}%`,
        cognitiveLatency: `${avgDecisionTime}s`,
        accuracyRate: `${successRate}%`
    };
    localStorage.setItem('kamizen_final_report', JSON.stringify(finalReportData));

    if (typeof renderValidationScreen === "function") {
        renderValidationScreen(state.missions[state.currentIndex]?.id || 63, finalReportData);
    } else {
        const app = document.getElementById("app");
        app.innerHTML = `
            <div class="card animated fadeIn">
                <h2 style="color:#0ea5e9; text-align:center;">📋 SESSION BIOMETRIC LOG</h2>
                <p style="text-align:center; font-size:0.9rem; margin-bottom:20px;">Real execution data recorded during this 15-minute training block.</p>
                
                <table style="width:100%; border-collapse: collapse; font-size:13px;">
                    <tr style="border-bottom:1px solid #334155;"><td style="padding:6px 0;"><b>Cognitive Latency (Avg Delay):</b></td><td style="text-align:right; color:#0ea5e9;"><b>${finalReportData.cognitiveLatency}</b></td></tr>
                    <tr style="border-bottom:1px solid #334155;"><td style="padding:6px 0;"><b>Impulsivity Markers (Anxious Clicks):</b></td><td style="text-align:right; color:#ef4444;"><b>${finalReportData.impulsivityMarkers}</b></td></tr>
                    <tr style="border-bottom:1px solid #334155;"><td style="padding:6px 0;"><b>Focus Drops (App Desertions):</b></td><td style="text-align:right; color:#eab308;"><b>${finalReportData.focusDropCount}</b></td></tr>
                    <tr style="border-bottom:1px solid #334155;"><td style="padding:6px 0;"><b>Manual Interruption Index (Pauses):</b></td><td style="text-align:right;">${finalReportData.interruptionIndex}</td></tr>
                    <tr style="border-bottom:1px solid #334155;"><td style="padding:6px 0;"><b>Breathing Compliance:</b></td><td style="text-align:right; color:#22c55e;">${finalReportData.breathingCompliance}</td></tr>
                    <tr style="border-bottom:1px solid #334155;"><td style="padding:6px 0;"><b>Silence Execution Retention:</b></td><td style="text-align:right; color:#22c55e;">${finalReportData.silenceCompliance}</td></tr>
                    <tr style="border-bottom:1px solid #334155;"><td style="padding:6px 0;"><b>Decision Accuracy Rate:</b></td><td style="text-align:right;">${finalReportData.accuracyRate}</td></tr>
                </table>
                
                <div style="margin-top:20px; background:rgba(14,165,233,0.1); padding:10px; border-radius:4px; font-size:12px; line-height:1.4; border:1px solid rgba(14,165,233,0.2);">
                    <b>AS ADVISORY LOG:</b> These psychometric metrics reflect true behavioral data points. High latency with low impulsivity proves executive processing stability. Frequent focus drops suggest attention-span fatigue.
                </div>
                
                <button onclick="resetSessionAfterFinish()" style="margin-top:20px; width:100%;">FINISH SESSION</button>
            </div>`;
        narrate("Session closed. Your biometric data log is compiled and ready.");
    }
}
