/* =========================================================
   KAMIZEN ENGINE V14 - ALL PRO DAD EDITION (1-63)
   ✔ Persistencia Local (LocalStorage)
   ✔ Narración Total: Preguntas + Opciones + Feedback
   ✔ Guía Vocal de Respiración (Visual)
   ✔ Conexión con Pantalla de Validación para Padres
   ✔ Auto-Flow y Master Timer (15 Minutes)
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
    masterTimerActive: false
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
    app.innerHTML = `<div class="card"><h3>SYSTEM BOOTING...</h3><p>Loading Data (Missions 1-63)...</p></div>`;
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
        app.innerHTML = `<div class="card"><h3>BOOT ERROR</h3><p>Check API Connection</p></div>`;
    }
}

/* =========================
   CONTROL DE CIERRE Y VALIDACIÓN
========================= */
function startMasterTimer() {
    if (state.masterTimerActive) return;
    state.masterTimerActive = true;
    state.sessionStartTime = Date.now();
    
    // Al cumplirse los 15 minutos, se dispara la validación
    setTimeout(() => {
        finishSession();
    }, 15 * 60 * 1000);
}

function finishSession() {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    
    const missionId = state.missions[state.currentIndex]?.id || 0;
    
    // Comunicación directa con static/session.html
    if (typeof renderValidationScreen === "function") {
        renderValidationScreen(missionId, {
            timeSpent: "15:00",
            status: "Complete"
        });
    } else {
        // Fallback en caso de que la función no esté cargada
        document.getElementById("app").innerHTML = `
            <div class="card center">
                <h2>SESSION COMPLETE</h2>
                <button onclick="location.reload()">RESTART</button>
            </div>`;
    }
}

/* =========================
   CONTROLES DE NAVEGACIÓN
========================= */
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
    if(confirm("Are you sure you want to RESTART progress?")) {
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
            <h1 style="color:var(--primary);">KAMIZEN</h1>
            <p>Training • Awareness • Control</p>
            <p class="small">Missions 1 - 63 Synchronized</p>
            <button onclick="startSystem()">START MISSION</button>
            <button onclick="restartSystem()" style="background:var(--danger);margin-top:10px; font-size:12px;">RESET ALL</button>
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
            <button onclick="showAdmin()" style="flex:1;padding:8px;font-size:12px;background:#0ea5e9;">ADMIN</button>
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
        <div class="card center" style="border: 2px solid var(--primary); background: #0f172a;">
            <h1 id="timerDisplay" style="font-size:3rem;margin:0; font-family: monospace;">00:00</h1>
        </div>
    `;

    if (block.t === "v" || block.t === "h") { html += `<div class="card"><h2>${block.tx?.en || ""}</h2></div>`; textToRead = block.tx?.en; }
    if (block.story) { html += `<div class="card"><p>${block.story.en || ""}</p></div>`; textToRead = block.story.en; }
    if (block.t === "br") {
        html += timerUI + `<div class="card center"><div class="breath-circle" id="breathCircle"><span id="breathLabel">...</span></div><h3>${block.tx?.en || ""}</h3></div>`;
        textToRead = block.tx?.en;
    }
    if (block.t === "sil") {
        html += timerUI + `<div class="card center"><h3>SILENCE PRACTICE</h3><p>${block.tx?.en || ""}</p></div>`;
        textToRead = block.tx?.en;
    }
    if (block.t === "d") {
        html += `<div class="card"><h3>${block.q?.en || ""}</h3>`;
        block.op?.forEach((opt, i) => {
            html += `<div class="answer" onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})">${opt}</div>`;
        });
        html += `</div>`;
        textToRead = block.q?.en;
    }
    if (block.t === "r") { html += `<div class="card center"><h2>⭐ REWARD</h2><p>+${block.p || 0} XP</p></div>`; textToRead = "Mission progress updated. You earned experience points."; }
    if (block.t === "c") { html += `<div class="card"><p>${block.tx?.en || ""}</p></div>`; textToRead = block.tx?.en; }

    if (block.t !== "d") html += `<button id="continueBtn" disabled>NARRATING...</button>`;
    app.innerHTML = html;

    narrate(textToRead, () => {
        if (block.t === "br" || block.t === "sil") {
            startCountdown(24, nextBlock);
            if(block.t === "br") startGuidedBreathing();
            unlockContinue("SKIP", nextBlock);
        } else if (block.t === "d") {
            // Espera interacción
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
    speech.rate = 0.95;
    speech.onend = () => { state.speechLocked = false; if (callback) callback(); };
    window.speechSynthesis.speak(speech);
}

function startGuidedBreathing() {
    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");
    if (!circle || !label) return;
    let inhale = true;
    const step = () => {
        if (!document.getElementById("breathCircle") || state.timeLeft <= 0) return;
        label.innerText = inhale ? "INHALE" : "EXHALE";
        circle.style.transform = inhale ? "scale(1.3)" : "scale(0.8)";
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
    feedbackWrap.innerHTML = `
        <div class="card" style="border:1px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}">
            <h3 style="color:${isCorrect ? 'var(--success)' : 'var(--danger)'}">${isCorrect ? "CORRECT" : "LOGIC FEEDBACK"}</h3>
            <p>${explanation}</p>
        </div>
        <button id="continueBtn" disabled>NARRATING...</button>`;
    document.getElementById("app").appendChild(feedbackWrap);
    narrate(explanation, () => {
        unlockContinue("CONTINUE", nextBlock);
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
