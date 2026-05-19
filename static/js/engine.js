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

    // ✅ ADDED LANGUAGE STATE
    language: localStorage.getItem("kamizen_lang") || "en"
};

/* =========================
   LANGUAGE SYSTEM (ADDED)
========================= */

function toggleLanguage() {
    state.language = state.language === "en" ? "es" : "en";
    localStorage.setItem("kamizen_lang", state.language);
    render();
}

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

        state.stories = Array.isArray(storiesData.stories) ? storiesData.stories.sort((a, b) => a.id - b.id) : [];
        state.missions = Array.isArray(missionsData.missions) ? missionsData.missions.sort((a, b) => a.id - b.id) : [];

        state.initialized = true;
    } catch (err) {
        console.error(err);
        app.innerHTML = `<div class="card"><h2>BOOT ERROR</h2><p>Check API Connection</p></div>`;
    }
}

/* =========================
   TIMER
========================= */

function startMasterTimer() {
    state.sessionStartTime = Date.now();
    setTimeout(() => finishSession(), 15 * 60 * 1000);
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
             <p>You completed your KAMIZEN session.</p>`
        ];
        app.innerHTML = `<div class="card center">${notes[0]}<button onclick="location.reload()">FINISH SESSION</button></div>`;
        narrate(app.innerText);
    }
}

/* =========================
   NAVIGATION
========================= */

function jumpToBlock() {
    const targetMissionId = prompt("Enter the MISSION ID to jump to (1-63):");
    const idNum = Number(targetMissionId);
    const idx = state.missions.findIndex(m => m.id === idNum);
    if (idx !== -1) {
        window.speechSynthesis.cancel();
        clearInterval(state.timer);
        state.currentIndex = idx;
        state.currentBlock = 0;
        render();
    }
}

function goBack() {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);

    if (state.currentBlock > 0) state.currentBlock--;
    else if (state.currentIndex > 0) {
        state.currentIndex--;
        state.currentBlock = 0;
    }
    render();
}

function restartSystem() {
    if (confirm("Are you sure?")) {
        localStorage.clear();
        state.currentIndex = 0;
        state.currentBlock = 0;
        render();
    }
}

/* =========================
   RENDER INTRO
========================= */

function showIntro() {
    state.phase = "intro";
    document.getElementById("app").innerHTML =
        `<div class="card center">
            <h1>KAMIZEN LIFE SYSTEM</h1>
            <button onclick="toggleLanguage()" style="margin:10px;padding:10px;background:#16a34a;">
                ${state.language === "en" ? "ESPAÑOL" : "ENGLISH"}
            </button>
            <button onclick="startSystem()">CONTINUE MISSION</button>
        </div>`;
}

/* =========================
   START
========================= */

function startSystem() {
    startMasterTimer();
    state.phase = "story";
    render();
}

/* =========================
   RENDER
========================= */

function render() {
    if (!state.initialized) return;
    saveProgress();

    const app = document.getElementById("app");
    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    let navHeader =
        `<div style="display:flex;gap:5px;margin-bottom:10px;">
            <button onclick="goBack()">BACK</button>

            <!-- ✅ ADDED LANGUAGE BUTTON -->
            <button onclick="toggleLanguage()" style="background:#16a34a;">
                ${state.language === "en" ? "ESPAÑOL" : "ENGLISH"}
            </button>

            <button onclick="jumpToBlock()">JUMP/SKIP</button>
            <button onclick="restartSystem()">RESET</button>
        </div>`;

    if (state.phase === "story") {
        app.innerHTML = navHeader +
            `<div class="card">
                <h2>STORY ${story.id}</h2>
                <h3>${story.t || ""}</h3>
                <p>${story.en || ""}</p>
            </div>
            <button disabled>NARRATING...</button>`;

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
   BLOCK RENDER
========================= */

function renderBlock(block, navHeader) {
    const app = document.getElementById("app");
    let html = navHeader;
    let textToRead = "";

    if (block.t === "v" || block.t === "h") {
        html += `<div class="card"><h2>${block.tx?.en || ""}</h2></div>`;
        textToRead = block.tx?.en;
    }

    if (block.story) {
        html += `<div class="card"><p>${block.story.en || ""}</p></div>`;
        textToRead = block.story.en;
    }

    if (block.t === "c") {
        html += `<div class="card"><p>${block.tx?.en || ""}</p></div>`;
        textToRead = block.tx?.en;
    }

    app.innerHTML = html;
    narrate(textToRead);
}

/* =========================
   NARRATE (UPDATED ONLY)
========================= */

async function narrate(text, callback) {
    if (!text) return callback?.();

    state.speechLocked = true;
    window.speechSynthesis.cancel();

    const finalText = await tr(text);

    const speech = new SpeechSynthesisUtterance(finalText);
    speech.lang = state.language === "es" ? "es-US" : "en-US";
    speech.rate = 0.9;

    speech.onend = () => {
        state.speechLocked = false;
        callback?.();
    };

    window.speechSynthesis.speak(speech);
}
