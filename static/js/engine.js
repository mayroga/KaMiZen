/* =========================================================
   KAMIZEN ENGINE V15 - FULL VERSION WITH REPORTE PDF
   ✔ Persistencia Local Real (LocalStorage)
   ✔ Reloj Maestro Absoluto Basado en Tiempo Real (Date.now())
   ✔ Detención Forzada a los 15 Minutos (Sin importar pausa, saltos o foco)
   ✔ Narración Total: Preguntas + Opciones + Feedback (English Only)
   ✔ Guía Vocal de Respiración (Visual)
   ✔ Botón JUMP/SKIP para navegación directa
   ✔ Soporte completo: v, h, story, br, sil, d, r, c
   ✔ Master Timer Visual: 15 Minutes (Cuenta regresiva global)
   ✔ Sistema de Pausa / Reanudación Manual y Automática
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
   
    // Configuración del Master Timer Implacable (15 minutos exactos)
    globalTimer: null,
    endTime: null,       // Marca de tiempo absoluta donde DEBE terminar la app
    globalTimeLeft: 15 * 60,
    isPaused: false,
    // Guardado de textos para reanudar narración si se pausa
    currentTextToNarrate: ""
};
// Diccionario estático de interfaz en inglés americano
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
};
/* =========================
   SISTEMA DE PERSISTENCIA
========================= */
function saveProgress() {
    localStorage.setItem('kamizen_save', JSON.stringify({
        currentIndex: state.currentIndex,
        currentBlock: state.currentBlock,
        endTime: state.endTime
    }));
}
function loadProgress() {
    const saved = localStorage.getItem('kamizen_save');
    if (saved) {
        const data = JSON.parse(saved);
        state.currentIndex = data.currentIndex || 0;
        state.currentBlock = data.currentBlock || 0;
        state.endTime = data.endTime || null;
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
    app.innerHTML = `<div class="card"><h2>${i18n.booting}</h2><p>${i18n.loading}</p></div>`;
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
        app.innerHTML = `<div class="card"><h2>${i18n.boot_error}</h2><p>${i18n.check_api}</p></div>`;
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
    const m = Math.floor(Math.max(0, state.globalTimeLeft) / 60);
    const s = Math.max(0, state.globalTimeLeft) % 60;
    timerDiv.innerHTML = `<div>${i18n.global_time}</div><div style="font-size:14px; font-weight:bold; color:var(--primary, #0ea5e9);">${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}</div>`;
}
/* ====================================
   CONTROL DE CIERRE ABSOLUTO (15 MIN)
==================================== */
function startMasterTimer() {
    clearInterval(state.globalTimer);
    // Si no hay un tiempo de finalización guardado previamente, lo creamos basándonos en la hora actual
    if (!state.endTime) {
        state.endTime = Date.now() + (15 * 60 * 1000);
    }
    state.globalTimer = setInterval(() => {
        // Cálculo basado en tiempo real Unix absoluto (No le afectan las pausas ni la inactividad de la pestaña)
        const totalMsLeft = state.endTime - Date.now();
        state.globalTimeLeft = Math.ceil(totalMsLeft / 1000);
        updateGlobalTimerDisplay();
        saveProgress();
        if (state.globalTimeLeft <= 0) {
            clearInterval(state.globalTimer);
            finishSession();
        }
    }, 250); // Muestreo de alta frecuencia para garantizar precisión de ejecución
    // Ejecución inicial para evitar delay visual de 1 segundo
    const totalMsLeft = state.endTime - Date.now();
    state.globalTimeLeft = Math.ceil(totalMsLeft / 1000);
    updateGlobalTimerDisplay();
}
function finishSession() {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    clearInterval(state.globalTimer);
    localStorage.clear(); // Limpieza absoluta de persistencia al expirar
    const currentMissionId = state.missions[state.currentIndex]?.id || 0;
    if (typeof renderValidationScreen === "function") {
        renderValidationScreen(currentMissionId, {
            timeSpent: "15:00",
            status: "Complete"
        });
    } else {
        const app = document.getElementById("app");
        app.innerHTML = `
            <div class="card center animated fadeIn">
                <h2>🌟 GREAT JOB TODAY</h2>
                <p>You completed your KAMIZEN session.</p>
                <p>Your brain and body only need a few focused minutes to grow stronger.</p>
                <p>KAMIZEN is designed to help you train calmly, not endlessly.</p>
                <button onclick="localStorage.clear(); location.reload();" style="margin-top:20px;">FINISH SESSION</button>
            </div>`;
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
    clearInterval(state.timer); // Detiene únicamente el temporizador del bloque (ej. respiración)
    render();
}
function resumeSystem() {
    state.isPaused = false;
    render();
}
function setupInterruptionListeners() {
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && !state.isPaused && state.phase !== "intro" && state.phase !== "loading") {
            pauseSystem();
        }
    });
    window.addEventListener("blur", () => {
        if (!state.isPaused && state.phase !== "intro" && state.phase !== "loading") {
            pauseSystem();
        }
    });
}
/* =========================
   CONTROLES DE NAVEGACIÓN
========================= */
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
        state.endTime = Date.now() + (15 * 60 * 1000); // Reinicia también el reloj maestro a 15 minutos exactos
        state.globalTimeLeft = 15 * 60;
        state.phase = "story";
        state.isPaused = false;
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
    document.getElementById("app").innerHTML = `
        <div class="card center">
            <h1>KAMIZEN LIFE SYSTEM</h1>
            <p>Training • Awareness • Control</p>
            <p class="small">Range: Missions 1 - 63 Loaded</p>
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
                <p style="font-size:0.9rem; margin-top:10px;">Mission paused. Click RESUME or the yellow button to continue right where you left off.</p>
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
        const storyTitle = `${i18n.story_title} ${story.id}`;
        const storyText = story.en || "";
        const storyHeading = story.t || "";
        app.innerHTML = navHeader + `
            <div class="card">
                <h2 style="color:var(--primary)">${storyTitle}</h2>
                <h3>${storyHeading}</h3>
                <p style="font-size:1.1rem; line-height:1.6;">${storyText}</p>
            </div>
            <button id="continueBtn" disabled>${i18n.narrating}</button>
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
        html += timerUI + `<div class="card center"><div class="breath-circle" id="breathCircle" style="margin: 15px auto;"><span id="breathLabel">${i18n.ready}</span></div><h3>${blockTx}</h3><p style="font-size:0.9rem;">${blockInf}</p></div>`;
        textToRead = `${blockTx}. ${blockInf}. ${i18n.get_ready}`;
    }
    if (block.t === "sil") {
        html += timerUI + `<div class="card"><h3>${blockTx}</h3><p style="font-size:0.9rem;">${blockInf}</p></div>`;
        textToRead = `${blockTx}. ${blockInf}. ${i18n.silence}`;
    }
    if (block.t === "d") {
        html += `<div class="card"><h3>${blockQ}</h3>`;
        const currentOptions = block.op || [];
        currentOptions.forEach((opt, i) => {
            html += `<div class="answer" id="opt-${i}" onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})">${opt}</div>`;
        });
        html += `</div>`;
        textToRead = `${blockQ}. ${i18n.options_intro} ${currentOptions.join(". ")}`;
    }
    if (block.t === "r") {
        html += `<div class="card center"><h2>⭐ ${blockTx || i18n.reward}</h2><p style="font-size:1.5rem; margin:10px 0;">+${block.p || 0} ${i18n.xp}</p></div>`;
        textToRead = `${blockTx || i18n.reward}. ${i18n.earned.replace("experience points", (block.p || 0) + " " + i18n.xp)}`;
    }
    if (block.t === "c") {
        html += `<div class="card"><p>${blockTx}</p></div>`;
        textToRead = blockTx;
    }
    if (block.t !== "d") html += `<button id="continueBtn" disabled>${i18n.narrating}</button>`;
    app.innerHTML = html;
    state.currentTextToNarrate = textToRead;
    narrate(textToRead, () => {
        if (block.t === "breath_auto" || block.t === "br") {
            startCountdown(24, nextBlock);
            startGuidedBreathing();
            unlockContinue(i18n.skip, nextBlock);
        } else if (block.t === "sil") {
            startCountdown(24, nextBlock);
            unlockContinue(i18n.skip, nextBlock);
        } else if (block.t === "d") {
            // Esperar interacción voluntaria
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
    const step = () => {
        if (!document.getElementById("breathCircle") || state.timeLeft <= 0 || state.isPaused) return;
        label.innerText = inhale ? i18n.inhale : i18n.exhale;
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
function selectAnswer(index, correct, explanations) {
    if (state.speechLocked || state.isPaused) return;
    const isCorrect = index === correct;  
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
    state.currentTextToNarrate = explanation;
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

