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
    sessionStartTime: null,

    /* =========================
       🔥 ADDED MULTILANGUAGE STATE
    ========================= */
    language: localStorage.getItem("kamizen_lang") || "en"
};

/* =========================
   🌍 LANGUAGE TOGGLE (NEW - NO BREAK CHANGES)
========================= */

function toggleLanguage() {
    state.language = state.language === "en" ? "es" : "en";
    localStorage.setItem("kamizen_lang", state.language);
    render();
}

/* =========================
   🌍 TRANSLATION ENGINE (NEW ADDITION)
========================= */

async function tr(text) {
    if (!text) return "";
    if (state.language === "en") return text;

    try {
        const res = await fetch(
            "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=" +
            encodeURIComponent(text)
        );

        const data = await res.json();
        return data[0].map(x => x[0]).join("");
    } catch (e) {
        return text;
    }
}

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

        state.stories = Array.isArray(storiesData.stories)
            ? storiesData.stories.sort((a, b) => a.id - b.id)
            : [];

        state.missions = Array.isArray(missionsData.missions)
            ? missionsData.missions.sort((a, b) => a.id - b.id)
            : [];

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

    const currentMissionId = state.missions[state.currentIndex]?.id || 0;

    if (typeof renderValidationScreen === "function") {
        renderValidationScreen(currentMissionId, {
            timeSpent: "15:00",
            status: "Complete"
        });
    } else {
        const app = document.getElementById("app");

        app.innerHTML = `<div class="card center animated fadeIn">
            <h2>🌟 GREAT JOB TODAY</h2>
            <p>You completed your KAMIZEN session.</p>

            <button onclick="location.reload()" style="margin-top:20px;">
                FINISH SESSION
            </button>
        </div>`;

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
    if (confirm("Are you sure you want to RESTART from zero?")) {
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

        if (timerDisplay)
            timerDisplay.innerText =
                `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

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

            <button onclick="startSystem()">CONTINUE MISSION</button>

            <!-- 🔥 ADDED LANGUAGE BUTTON (NO IMPACT ON FLOW) -->
            <button onclick="toggleLanguage()" style="margin-top:10px;background:#16a34a;">
                ${state.language === "en" ? "ESPAÑOL" : "ENGLISH"}
            </button>
        </div>
    `;
}

/* =========================
   START SYSTEM
========================= */
function startSystem() {
    startMasterTimer();
    state.phase = "story";
    render();
}

/* =========================
   RENDER (ONLY ADD TRANSLATION SUPPORT)
========================= */
async function render() {
    if (!state.initialized) return;

    saveProgress();

    const app = document.getElementById("app");

    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    if (!story || !mission) {
        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "story";
        return render();
    }

    let navHeader = `
        <div style="display:flex;gap:5px;margin-bottom:10px;">
            <button onclick="goBack()">BACK</button>
            <button onclick="jumpToBlock()">JUMP</button>

            <!-- 🔥 LANGUAGE BUTTON ADDED HERE -->
            <button onclick="toggleLanguage()" style="background:#16a34a;">
                ${state.language === "en" ? "ESPAÑOL" : "ENGLISH"}
            </button>
        </div>
    `;

    if (state.phase === "story") {
        app.innerHTML = navHeader + `
            <div class="card">
                <h2>STORY ${story.id}</h2>

                <h3>${await tr(story.t || "")}</h3>
                <p>${await tr(story.en || "")}</p>
            </div>

            <button id="continueBtn" disabled>NARRATING...</button>
        `;

        narrate(`${story.t}. ${story.en}`, () => {
            setTimeout(startMission, 1500);
        });

    } else {
        const block = mission.b[state.currentBlock];
        if (!block) return nextStory();

        renderBlock(block, navHeader);
    }
}

/* =========================
   NARRATE (UPDATED ONLY VOICE SUPPORT)
========================= */
async function narrate(text, callback) {
    if (!text) return callback?.();

    window.speechSynthesis.cancel();

    const finalText = await tr(text);

    const speech = new SpeechSynthesisUtterance(finalText);

    speech.lang = state.language === "es" ? "es-US" : "en-US";
    speech.rate = 0.9;

    speech.onend = () => callback?.();

    window.speechSynthesis.speak(speech);
}

/* =========================
   FLOW (UNCHANGED)
========================= */
function nextBlock() {
    clearInterval(state.timer);
    state.currentBlock++;
    render();
}

function startMission() {
    state.phase = "mission";
    state.currentBlock = 0;
    render();
}

function nextStory() {
    state.currentIndex++;
    if (state.currentIndex >= state.missions.length) state.currentIndex = 0;
    state.phase = "story";
    state.currentBlock = 0;
    render();
}

/* =========================
   KEEP ORIGINAL FUNCTION
========================= */
function unlockContinue(label, action) {
    const btn = document.getElementById("continueBtn");
    if (btn) {
        btn.disabled = false;
        btn.innerText = label;
        btn.onclick = action;
    }
}
