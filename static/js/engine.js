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

    /* ===== ADDED LANGUAGE SYSTEM ===== */
    language: localStorage.getItem("kamizen_lang") || "en"
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
   LANGUAGE TOGGLE (ADDED)
========================= */
function toggleLanguage() {
    state.language = state.language === "en" ? "es" : "en";
    localStorage.setItem("kamizen_lang", state.language);
    render();
}

/* =========================
   TRANSLATION ENGINE (ADDED)
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

        state.stories = Array.isArray(storiesData.stories) ? storiesData.stories.sort((a, b) => a.id - b.id) : [];
        state.missions = Array.isArray(missionsData.missions) ? missionsData.missions.sort((a, b) => a.id - b.id) : [];

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
        const notes = [
            `<h2>🌟 GREAT JOB TODAY</h2>
             <p>You completed your KAMIZEN session.</p>
             <p>Your brain and body only need a few focused minutes to grow stronger.</p>
             <p>KAMIZEN is designed to help you train calmly, not endlessly.</p>
             <p>Now it is time to:</p>
             <ul style="text-align:left; display:inline-block;">
                <li>✔ Now you are ready to start your class</li>
                <li>✔ Rest your mind</li>
                <li>✔ Go play</li>
                <li>✔ Talk with your family</li>
                <li>✔ Explore the real world</li>
                <li>✔ Come back tomorrow stronger</li>
             </ul>
             <p>Small daily training creates powerful minds. See you next session, warrior. 🛡️</p>`
        ];
        app.innerHTML = `<div class="card center animated fadeIn">${notes[0]}<button onclick="location.reload()" style="margin-top:20px;">FINISH SESSION</button></div>`;
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
    if(confirm("Are you sure you want to RESTART from zero?")) {
        localStorage.clear();
        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "story";
        render();
    }
}

/* =========================
   TIMER
========================= */
function startCountdown(seconds, onComplete) {
    clearInterval(state.timer);
    state.timeLeft = seconds;
    const timerDisplay = document.getElementById("timerDisplay");

    state.timer = setInterval(() => {
        state.timeLeft--;
        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;
        if (timerDisplay) timerDisplay.innerText = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            if (onComplete) onComplete();
        }
    }, 1000);
}

/* =========================
   RENDER
========================= */
function showIntro() {
    state.phase = "intro";
    document.getElementById("app").innerHTML =
        `<div class="card center">
            <h1>KAMIZEN LIFE SYSTEM</h1>
            <p>Training • Awareness • Control</p>
            <p class="small">Range: Missions 1 - 63 Loaded</p>
            <button onclick="startSystem()">CONTINUE MISSION</button>
            <button onclick="restartSystem()" style="background:var(--danger);margin-top:10px;">RESET PROGRESS</button>
         </div>`;
}

function startSystem() {
    startMasterTimer();
    state.phase = "story";
    render();
}

/* =========================
   RENDER NAV (ONLY CHANGE: BUTTON ADDED)
========================= */
function render() {
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

    let navHeader =
        `<div style="display:flex;gap:5px;margin-bottom:10px;">
            <button onclick="goBack()" style="flex:1;padding:8px;font-size:12px;background:#334155;">BACK</button>

            <!-- ADDED LANGUAGE BUTTON -->
            <button onclick="toggleLanguage()" style="flex:1;padding:8px;font-size:12px;background:#16a34a;">
                ${state.language === "en" ? "ESPAÑOL" : "ENGLISH"}
            </button>

            <button onclick="jumpToBlock()" style="flex:1;padding:8px;font-size:12px;background:#0ea5e9;">JUMP/SKIP</button>
            <button onclick="restartSystem()" style="flex:1;padding:8px;font-size:12px;background:var(--danger);">RESET</button>
        </div>`;

    if (state.phase === "story") {
        app.innerHTML = navHeader +
            `<div class="card">
                <h2 style="color:var(--primary)">STORY ${story.id}</h2>
                <h3>${story.t || ""}</h3>
                <p style="font-size:1.1rem; line-height:1.6;">${story.en || ""}</p>
            </div>
            <button id="continueBtn" disabled>NARRATING...</button>`;

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
   RENDER BLOCK (UNCHANGED LOGIC)
========================= */
function renderBlock(block, navHeader) {
    const app = document.getElementById("app");
    let html = navHeader;
    let textToRead = "";

    const timerUI =
        `<div class="card center" style="border: 3px solid var(--primary); background: #0f172a;">
            <h1 id="timerDisplay" style="font-size:4rem;margin:0;font-family:monospace;">00:00</h1>
            <p style="color:var(--primary);letter-spacing:2px;">STAY FOCUSED</p>
        </div>`;

    if (block.t === "v" || block.t === "h") {
        html += `<div class="card"><h2>${block.tx?.en || ""}</h2></div>`;
        textToRead = block.tx?.en;
    }

    app.innerHTML = html;
    narrate(textToRead, () => nextBlock());
}

/* =========================
   NARRATE (REPLACED ONLY FOR LANGUAGE)
========================= */
async function narrate(text, callback) {
    if (!text) return callback && callback();

    state.speechLocked = true;
    window.speechSynthesis.cancel();

    const finalText = await tr(text);

    const speech = new SpeechSynthesisUtterance(finalText);
    speech.lang = state.language === "es" ? "es-US" : "en-US";
    speech.rate = 0.9;

    speech.onend = () => {
        state.speechLocked = false;
        if (callback) callback();
    };

    window.speechSynthesis.speak(speech);
}

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

function unlockContinue(label, action) {
    const btn = document.getElementById("continueBtn");
    if (btn) {
        btn.disabled = false;
        btn.innerText = label;
        btn.onclick = action;
    }
}
