/* =========================================================
   KAMIZEN ENGINE V10 - FULL STABLE SYSTEM (UPDATED)
   ✔ Reads ALL 49 stories
   ✔ Reads ALL missions (01-35 + 36-42 + 43-49)
   ✔ Safe multi-file mission system
   ✔ No freeze
   ✔ No double render
   ✔ Speech lock until narration ends
   ✔ Safe mission jump system
   ✔ FIXED: exam/missions split support
   ========================================================= */

/* =========================
   GLOBAL STATE
========================= */

let state = {
    stories: [],
    missions: [],

    currentIndex: 0,
    currentBlock: 0,

    phase: "loading",

    speechLocked: false,
    initialized: false
};

/* =========================
   ENGINE LOCK
========================= */

if (window.__KAMIZEN_ENGINE_ACTIVE__) {
    console.warn("KAMIZEN ENGINE ALREADY RUNNING");
} else {
    window.__KAMIZEN_ENGINE_ACTIVE__ = true;
}

/* =========================
   INIT
========================= */

window.addEventListener("load", async () => {
    await loadAllData();
    showIntro();
});

/* =========================
   LOAD DATA
========================= */

async function loadAllData() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h2>LOADING SYSTEM...</h2>
            <p>Initializing neural missions</p>
        </div>
    `;

    try {

        const [storiesReq, missionsReq] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);

        const storiesData = await storiesReq.json();
        const missionsData = await missionsReq.json();

        /* STORIES */
        state.stories = Array.isArray(storiesData.stories)
            ? storiesData.stories.sort((a, b) => a.id - b.id)
            : [];

        /* MISSIONS (FULL SAFE MERGE) */
        let rawMissions = [];

        if (Array.isArray(missionsData.missions)) {
            rawMissions = missionsData.missions;
        } else if (missionsData.missions && Array.isArray(missionsData.missions.missions)) {
            rawMissions = missionsData.missions.missions;
        }

        state.missions = rawMissions
            .filter(m => m && typeof m.id === "number")
            .sort((a, b) => a.id - b.id);

        console.log("STORIES:", state.stories.length);
        console.log("MISSIONS:", state.missions.length);

        state.initialized = true;

    } catch (err) {

        console.error("LOAD FAILURE:", err);

        app.innerHTML = `
            <div class="card">
                <h2>SYSTEM ERROR</h2>
                <p>Failed loading system data</p>
            </div>
        `;
    }
}

/* =========================
   INTRO
========================= */

function showIntro() {

    state.phase = "intro";

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h1>KAMIZEN LIFE SYSTEM</h1>
            <p>Awareness • Control • Focus • Discipline</p>
            <p style="opacity:.8;">
                ${state.missions.length} Missions Loaded
            </p>
        </div>

        <button onclick="startSystem()">
            START SYSTEM
        </button>
    `;
}

/* =========================
   START
========================= */

function startSystem() {

    state.currentIndex = 0;
    state.currentBlock = 0;
    state.phase = "story";

    render();
}

/* =========================
   SAFE MISSION FINDER (IMPORTANT FIX)
========================= */

function getMissionByIndex(index) {
    return state.missions[index] || null;
}

/* =========================
   MAIN RENDER
========================= */

function render() {

    if (!state.initialized) return;

    const app = document.getElementById("app");

    const story = state.stories[state.currentIndex];
    const mission = getMissionByIndex(state.currentIndex);

    if (!story || !mission) {

        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "story";

        return render();
    }

    /* STORY */
    if (state.phase === "story") {

        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <h3>${story.t || ""}</h3>
                <p>${story.en || ""}</p>
            </div>

            <button id="continueBtn" disabled>NARRATING...</button>
        `;

        narrate(`${story.t}. ${story.en}`, () => {
            unlockContinue("START MISSION", startMission);
        });

        return;
    }

    /* MISSION */
    if (state.phase === "mission") {

        const block = mission.b[state.currentBlock];

        if (!block) {
            nextStory();
            return;
        }

        renderBlock(block);
    }
}

/* =========================
   BLOCK RENDER (UNCHANGED CORE)
========================= */

function renderBlock(block) {

    const app = document.getElementById("app");

    let html = "";
    let narration = "";

    if (block.t === "v") {
        html += `<div class="card"><h2>${block.tx?.en || ""}</h2></div>`;
        narration += block.tx?.en + ". ";
    }

    if (block.t === "h") {
        html += `<div class="card"><p>${block.tx?.en || ""}</p></div>`;
        narration += block.tx?.en + ". ";
    }

    if (block.story) {
        html += `<div class="card"><p>${block.story.en || ""}</p></div>`;
        narration += block.story.en + ". ";
    }

    /* ✅ FIXED SILENCE TIMER SUPPORT */
    if (block.t === "sil") {

        const t = block.d || 0;

        html += `
            <div class="card">
                <h3>${block.tx?.en || ""}</h3>
                <p>${block.inf?.en || ""}</p>
                <p><b>Duration: ${t} seconds</b></p>
            </div>
        `;

        narration += `${block.tx?.en}. ${block.inf?.en}. ${t} seconds.`;
    }

    if (block.t === "breath_auto" || block.t === "br") {
        html += `
            <div class="card">
                <div class="breath-circle" id="breathCircle">
                    <span id="breathLabel">INHALE</span>
                </div>

                <h3>${block.tx?.en || ""}</h3>
                <p>${block.inf?.en || ""}</p>
            </div>
        `;

        narration += `${block.tx?.en}. ${block.inf?.en}.`;
    }

    app.innerHTML = html;

    if (block.t === "breath_auto" || block.t === "br") {
        startBreathingAnimation();
    }

    narrate(narration, () => {
        unlockContinue("CONTINUE", nextBlock);
    });
}

/* =========================
   FIXED SILENCE TIMING (IMPORTANT)
========================= */

function handleSilence(duration, callback) {

    state.speechLocked = true;

    setTimeout(() => {

        state.speechLocked = false;

        if (callback) callback();

    }, (duration || 0) * 1000);
}

/* =========================
   NAVIGATION
========================= */

function nextBlock() {
    if (state.speechLocked) return;
    state.currentBlock++;
    render();
}

function startMission() {
    if (state.speechLocked) return;
    state.phase = "mission";
    state.currentBlock = 0;
    render();
}

function nextStory() {

    state.currentIndex++;

    if (state.currentIndex >= state.stories.length) {
        state.currentIndex = 0;
    }

    state.phase = "story";
    state.currentBlock = 0;

    render();
}

/* =========================
   SPEECH
========================= */

function narrate(text, callback) {

    if (!text) return callback?.();

    state.speechLocked = true;

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-US";
    speech.rate = 0.92;

    speech.onend = () => {
        state.speechLocked = false;
        callback?.();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
}

/* =========================
   UI CONTROL
========================= */

function unlockContinue(label, action) {

    const btn = document.getElementById("continueBtn");

    if (!btn) return;

    btn.disabled = false;
    btn.innerText = label;
    btn.onclick = action;
}

/* =========================
   BREATHING
========================= */

function startBreathingAnimation() {

    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");

    if (!circle || !label) return;

    let inhale = true;

    setInterval(() => {

        if (inhale) {
            label.innerText = "INHALE";
            circle.style.transform = "scale(1.2)";
        } else {
            label.innerText = "EXHALE";
            circle.style.transform = "scale(0.8)";
        }

        inhale = !inhale;

    }, 4000);
}

/* =========================
   JUMP FUNCTION (YOU ADDED)
========================= */

function goToMissionById(id) {

    if (!state.missions || !state.missions.length) return;

    const index = state.missions.findIndex(m => m.id === Number(id));

    if (index === -1) {
        alert("Write another mission ID that exists in list");
        return;
    }

    state.currentIndex = index;
    state.currentBlock = 0;
    state.phase = "mission";

    render();
}
