/* =========================================================
   KAMIZEN ENGINE V11 - PRO & PERSISTENT SYSTEM
   ✔ Auto-Save & Auto-Resume (Reconocimiento de progreso)
   ✔ Countdown Timer (Reloj fijo para respiración/silencio)
   ✔ Flow Control: Back, Restart & Auto-Advance
   ✔ Speech Sync & Safety Lock
   ========================================================= */

let state = {
    stories: [],
    missions: [],
    currentIndex: 0,
    currentBlock: 0,
    phase: "loading",
    speechLocked: false,
    initialized: false,
    timerInterval: null // Control del reloj
};

/* =========================
   INIT & AUTO-RESUME
========================= */
window.addEventListener("load", async () => {
    await loadAllData();
    
    // Cargar progreso guardado
    const saved = localStorage.getItem('kamizen_progress');
    if (saved) {
        const parsed = JSON.parse(saved);
        state.currentIndex = parsed.index || 0;
        state.currentBlock = parsed.block || 0;
        state.phase = parsed.phase || "intro";
        console.log("♻️ Progress Resumed:", state.currentIndex);
    }
    
    showIntro();
});

// Función para guardar progreso automáticamente
function saveProgress() {
    localStorage.setItem('kamizen_progress', JSON.stringify({
        index: state.currentIndex,
        block: state.currentBlock,
        phase: state.phase
    }));
}

/* =========================
   LOAD DATA (Manteniendo tu lógica original)
========================= */
async function loadAllData() {
    const app = document.getElementById("app");
    app.innerHTML = `<div class="card"><h2>LOADING...</h2></div>`;
    try {
        const [storiesReq, missionsReq] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);
        const storiesData = await storiesReq.json();
        const missionsData = await missionsReq.json();

        state.stories = Array.isArray(storiesData.stories) ? storiesData.stories.sort((a,b)=>a.id-b.id) : [];
        state.missions = Array.isArray(missionsData.missions) ? missionsData.missions.sort((a,b)=>a.id-b.id) : [];
        state.initialized = true;
    } catch (err) {
        console.error("LOAD FAILURE:", err);
    }
}

/* =========================
   TIMER SYSTEM (Reloj descontador)
========================= */
function startTimer(seconds, onComplete) {
    clearInterval(state.timerInterval);
    const display = document.getElementById("timerDisplay");
    let remaining = seconds;

    const updateDisplay = () => {
        const h = Math.floor(remaining / 3600);
        const m = Math.floor((remaining % 3600) / 60);
        const s = remaining % 60;
        if(display) display.innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    };

    updateDisplay();

    state.timerInterval = setInterval(() => {
        remaining--;
        updateDisplay();
        if (remaining <= 0) {
            clearInterval(state.timerInterval);
            if (onComplete) onComplete();
        }
    }, 1000);
}

/* =========================
   UI CONTROLS (Back & Restart)
========================= */
function restartSystem() {
    if(confirm("¿Reiniciar todo el sistema desde cero?")) {
        localStorage.clear();
        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "intro";
        window.location.reload();
    }
}

function goBack() {
    window.speechSynthesis.cancel();
    clearInterval(state.timerInterval);
    state.speechLocked = false;
    render(); // Repite la escena actual
}

/* =========================
   RENDER ENGINE
========================= */
function render() {
    if (!state.initialized) return;
    saveProgress();
    
    const app = document.getElementById("app");
    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    // Barra de navegación fija
    const navBar = `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; opacity:0.6;">
            <span onclick="goBack()" style="cursor:pointer;">⬅️ REPEAT</span>
            <span onclick="restartSystem()" style="cursor:pointer;">🔄 RESTART</span>
        </div>
    `;

    if (state.phase === "story") {
        app.innerHTML = navBar + `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <h3>${story.t || ""}</h3>
                <p>${story.en || ""}</p>
            </div>
            <button id="continueBtn" disabled>NARRATING...</button>
        `;
        narrate(`${story.t}. ${story.en}`, () => {
            // AUTO-ADVANCE: En historias largas, podrías dejar el botón, 
            // pero para niños es mejor desbloquear y dejar que ellos den el paso.
            unlockContinue("START MISSION", startMission);
        });
        return;
    }

    if (state.phase === "mission") {
        const block = mission.b[state.currentBlock];
        if (!block) { nextStory(); return; }
        renderBlock(block, navBar);
    }
}

function renderBlock(block, navBar) {
    const app = document.getElementById("app");
    let html = navBar;
    let narration = "";

    // Casos de Silencio o Respiración (Con Reloj)
    if (["br", "breath_auto", "sil"].includes(block.t)) {
        const timeLimit = block.time || 10; // 10 segundos por defecto si no viene en el JSON
        html += `
            <div class="card" style="text-align:center;">
                <h1 id="timerDisplay" style="font-family:monospace; color:var(--primary); font-size:3rem;">00:00:00</h1>
                <div class="${block.t !== 'sil' ? 'breath-circle' : ''}" id="breathCircle">
                    <span id="breathLabel">${block.t === 'sil' ? 'SILENCE' : 'WAIT'}</span>
                </div>
                <h3>${block.tx?.en || ""}</h3>
                <p>${block.inf?.en || ""}</p>
            </div>
        `;
        app.innerHTML = html;
        if(block.t !== 'sil') startBreathingAnimation();
        
        narrate(`${block.tx?.en}. ${block.inf?.en}`, () => {
            // El reloj comienza DESPUÉS de la narración para que el niño se concentre
            startTimer(timeLimit, () => {
                // AUTO-ADVANCE al terminar el tiempo
                nextBlock();
            });
        });
    } else {
        // ... (Aquí va tu lógica de renderizado original para 'v', 'h', 'd', 'r', 'c')
        // Al final de cada renderizado de bloque normal, llamar a:
        // narrate(narration, () => { if(block.t !== 'd') unlockContinue("CONTINUE", nextBlock); });
    }
}

/* =========================
   NARRATOR & TOOLS
========================= */
function narrate(text, callback) {
    if (!text) { if(callback) callback(); return; }
    state.speechLocked = true;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 0.9;
    speech.onend = () => { state.speechLocked = false; if(callback) callback(); };
    window.speechSynthesis.speak(speech);
}

function unlockContinue(label, action) {
    const btn = document.getElementById("continueBtn");
    if (!btn) return;
    btn.disabled = false;
    btn.innerText = label;
    btn.onclick = action;
}

// Las funciones startMission, nextBlock, nextStory y startBreathingAnimation 
// se mantienen igual, asegurando que llamen a render() para activar el saveProgress.
