/* =========================
   KAMIZEN ENGINE V11 - EXPERT EDITION
   ✔ Persistencia Automática (LocalStorage)
   ✔ Reloj Descontador en tiempo real (Respiración/Silencio)
   ✔ Auto-Jump tras narración (Fricción Cero)
   ✔ Controles: Back, Restart, Jump
   ✔ Sistema Adaptado para Niños (Guía Visual)
   ========================= */

let state = {
    stories: [],
    missions: [],
    currentIndex: 0,
    currentBlock: 0,
    phase: "loading", 
    speechLocked: false,
    initialized: false,
    timer: null,
    timeLeft: 0
};

/* =========================
   ENGINE LOCK & PERSISTENCE
========================= */
if (window.__KAMIZEN_ENGINE_ACTIVE__) {
    console.warn("KAMIZEN ENGINE ALREADY RUNNING");
} else {
    window.__KAMIZEN_ENGINE_ACTIVE__ = true;
}

// Cargar progreso al iniciar
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
   INIT
========================= */
window.addEventListener("load", async () => {
    loadProgress();
    await loadAllData();
    showIntro();
});

async function loadAllData() {
    const app = document.getElementById("app");
    app.innerHTML = `<div class="card"><h2>LOADING SYSTEM...</h2></div>`;
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
        app.innerHTML = `<div class="card"><h2>SYSTEM ERROR</h2></div>`;
    }
}

/* =========================
   UI CONTROLS (BACK / RESTART / JUMP)
========================= */
function restartSystem() {
    if(confirm("¿[?")) {
        localStorage.clear();
        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "story";
        render();
    }
}

function goBack() {
    window.speechSynthesis.cancel();
    state.speechLocked = false;
    if (state.currentBlock > 0) {
        state.currentBlock--;
    } else {
        state.phase = "story";
    }
    render();
}

function goToMissionById(id) {
    const idx = state.missions.findIndex(m => m.id === Number(id));
    if (idx !== -1) {
        window.speechSynthesis.cancel();
        state.currentIndex = idx;
        state.currentBlock = 0;
        state.phase = "story";
        render();
    } else {
        alert("ID no encontrado. Inténtalo de nuevo.");
    }
}

/* =========================
   TIMER LOGIC (MM:SS)
========================= */
function startCountdown(seconds, onComplete) {
    clearInterval(state.timer);
    state.timeLeft = seconds;
    const timerDisplay = document.getElementById("timerDisplay");

    state.timer = setInterval(() => {
        state.timeLeft--;
        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;
        if (timerDisplay) {
            timerDisplay.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }

        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            if (onComplete) onComplete();
        }
    }, 1000);
}

/* =========================
   RENDER ENGINE
========================= */
function showIntro() {
    state.phase = "intro";
    document.getElementById("app").innerHTML = `
        <div class="card center">
            <h1>KAMIZEN LIFE SYSTEM</h1>
            <p>Guía de Control y Enfoque</p>
            <button onclick="startSystem()">CONTINUAR DONDE QUEDÉ</button>
            <button onclick="restartSystem()" style="background:var(--danger);margin-top:10px;">RESTART FROM ZERO</button>
        </div>
    `;
}

function startSystem() {
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
        state.currentIndex = 0;
        return render();
    }

    // Header de navegación siempre visible
    let navHeader = `
        <div style="display:flex;gap:10px;margin-bottom:10px;">
            <button onclick="goBack()" style="padding:5px;flex:1;">BACK</button>
            <button onclick="restartSystem()" style="padding:5px;flex:1;background:var(--danger)">RESET</button>
        </div>
    `;

    if (state.phase === "story") {
        app.innerHTML = navHeader + `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <h3>${story.t || ""}</h3>
                <p>${story.en || ""}</p>
            </div>
            <button id="continueBtn" disabled>NARRATING...</button>
        `;
        narrate(`${story.t}. ${story.en}`, () => {
            // Auto-jump a la misión después de 2 segundos de terminar de hablar
            setTimeout(startMission, 2000);
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
    let narration = "";

    // Timer UI para Respiración y Silencio
    const timerUI = `
        <div class="card center" style="border: 2px solid var(--primary);">
            <h1 id="timerDisplay" style="font-size:3rem;margin:0;">00:00</h1>
            <p class="small">MANTÉN EL ENFOQUE</p>
        </div>
    `;

    if (block.t === "v" || block.t === "h") {
        html += `<div class="card"><h2>${block.tx?.en || ""}</h2></div>`;
        narration = block.tx?.en;
    }

    if (block.t === "breath_auto" || block.t === "br") {
        html += timerUI + `
            <div class="card center">
                <div class="breath-circle" id="breathCircle"><span id="breathLabel">INHALE</span></div>
                <h3>${block.tx?.en || ""}</h3>
                <p>${block.inf?.en || ""}</p>
            </div>`;
        narration = `${block.tx?.en}. ${block.inf?.en}`;
    }

    if (block.t === "sil") {
        html += timerUI + `<div class="card"><h3>${block.tx?.en || ""}</h3><p>${block.inf?.en || ""}</p></div>`;
        narration = `${block.tx?.en}. ${block.inf?.en}`;
    }

    if (block.t === "d") {
        html += `<div class="card"><h3>${block.q?.en || ""}</h3>`;
        block.op?.forEach((opt, i) => {
            html += `<div class="answer" onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})">${opt}</div>`;
        });
        html += `</div>`;
        narration = block.q?.en;
    }

    if (block.t !== "d") {
        html += `<button id="continueBtn" disabled>NARRATING...</button>`;
    }

    app.innerHTML = html;

    // Lógica de narración y tiempos
    narrate(narration, () => {
        if (block.t === "breath_auto" || block.t === "br" || block.t === "sil") {
            // Activar reloj descontador (ejemplo 15 segundos para niños)
            startCountdown(15, nextBlock);
            if (block.t.includes("breath")) startBreathingAnimation();
        } else if (block.t !== "d") {
            unlockContinue("CONTINUE", nextBlock);
        }
    });
}

/* =========================
   CORE FUNCTIONS (PRESERVED)
========================= */
function narrate(text, callback) {
    if (!text) { if (callback) callback(); return; }
    state.speechLocked = true;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.onend = () => { state.speechLocked = false; if (callback) callback(); };
    window.speechSynthesis.speak(speech);
}

function nextBlock() { clearInterval(state.timer); state.currentBlock++; render(); }
function startMission() { state.phase = "mission"; state.currentBlock = 0; render(); }
function nextStory() { state.currentIndex++; state.phase = "story"; state.currentBlock = 0; render(); }

function unlockContinue(label, action) {
    const btn = document.getElementById("continueBtn");
    if (btn) { btn.disabled = false; btn.innerText = label; btn.onclick = action; }
}

function selectAnswer(index, correct, explanations) {
    if (state.speechLocked) return;
    const isCorrect = index === correct;
    const explanation = explanations?.[index] || "";
    document.getElementById("app").innerHTML += `
        <div class="card">
            <h3 style="color:${isCorrect ? '#22c55e' : '#ef4444'}">${isCorrect ? "CORRECT" : "WRONG"}</h3>
            <p>${explanation}</p>
        </div>
        <button id="continueBtn" disabled>NARRATING...</button>`;
    narrate(explanation, () => unlockContinue("CONTINUE", nextBlock));
}

function startBreathingAnimation() {
    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");
    if (!circle || !label) return;
    let inhale = true;
    const ani = setInterval(() => {
        if (!document.getElementById("breathCircle")) { clearInterval(ani); return; }
        label.innerText = inhale ? "INHALE" : "EXHALE";
        circle.style.transform = inhale ? "scale(1.2)" : "scale(0.8)";
        circle.style.transition = "4s ease-in-out";
        inhale = !inhale;
    }, 4000);
}
