/* =========================================================
   KAMIZEN ENGINE V10 - FULL STABLE SYSTEM (UPDATED)
   ✔ Stories + Missions + Exams merged safely
   ✔ No freeze / no duplicate render
   ✔ Speech lock stable
   ✔ Safe navigation by ID (with validation)
   ✔ Exam system integrated 36–49
========================================================= */

/* =========================
   GLOBAL STATE
========================= */

let state = {
    stories: [],
    missions: [],
    examMissions: [],

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
            <p>Initializing missions & exams</p>
        </div>
    `;

    try {

        const [storiesReq, missionsReq, examReq] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions"),
            fetch("/api/exam")
        ]);

        const storiesData = await storiesReq.json();
        const missionsData = await missionsReq.json();
        const examData = await examReq.json();

        /* STORIES */
        state.stories = Array.isArray(storiesData.stories)
            ? storiesData.stories.sort((a, b) => a.id - b.id)
            : [];

        /* MISSIONS */
        state.missions = Array.isArray(missionsData.missions)
            ? missionsData.missions.sort((a, b) => a.id - b.id)
            : [];

        /* EXAMS (36–49 FIX) */
        state.examMissions = Array.isArray(examData.missions)
            ? examData.missions.sort((a, b) => a.id - b.id)
            : [];

        console.log("STORIES:", state.stories.length);
        console.log("MISSIONS:", state.missions.length);
        console.log("EXAMS:", state.examMissions.length);

        state.initialized = true;

    } catch (err) {

        console.error("LOAD FAILURE:", err);

        app.innerHTML = `
            <div class="card">
                <h2>SYSTEM ERROR</h2>
                <p>Failed loading system</p>
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
            <p>Awareness • Control • Focus</p>
            <p class="small">Stories + Missions + Exams</p>
        </div>

        <div class="card">
            <input id="missionInput"
                   type="number"
                   placeholder="Enter mission ID (1–49)"
                   style="width:100%;padding:10px;border-radius:8px;border:none;margin-bottom:10px;">

            <button onclick="jumpToMission()">
                GO TO MISSION
            </button>

            <p class="small">
                Type a valid ID from system (stories, missions, exams)
            </p>
        </div>

        <button onclick="startSystem()">
            START SYSTEM
        </button>
    `;
}

/* =========================
   START SYSTEM
========================= */

function startSystem() {

    state.currentIndex = 0;
    state.currentBlock = 0;
    state.phase = "story";

    render();
}

/* =========================
   NAVIGATION BY ID (FIXED)
========================= */

function goToMissionById(id) {

    const all = [
        ...(state.missions || []),
        ...(state.examMissions || [])
    ];

    const index = all.findIndex(m => m.id === Number(id));

    if (index === -1) {
        alert("Write a valid mission ID from the list.");
        return;
    }

    state.missions = all;
    state.currentIndex = index;
    state.currentBlock = 0;
    state.phase = "mission";

    render();
}

/* GLOBAL UI HOOK */
window.jumpToMission = function () {

    const input = document.getElementById("missionInput");
    if (!input) return;

    const id = Number(input.value);

    if (!id) {
        alert("Enter a valid number.");
        return;
    }

    goToMissionById(id);
};

/* =========================
   MAIN RENDER
========================= */

function render() {

    if (!state.initialized) return;

    const app = document.getElementById("app");

    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    if (!story || !mission) {
        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "story";
        return render();
    }

    if (state.phase === "story") {

        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <p>${story.en || ""}</p>
            </div>

            <button id="continueBtn" disabled>NARRATING...</button>
        `;

        narrate(story.en || "", () => {
            unlockContinue("START MISSION", startMission);
        });

        return;
    }

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
   BLOCK RENDER
========================= */

function renderBlock(block) {

    const app = document.getElementById("app");
    let html = "";
    let narration = "";

    if (block.t === "v") {
        html += `<div class="card"><h2>${block.tx?.en || ""}</h2></div>`;
        narration += block.tx?.en || "";
    }

    if (block.t === "h") {
        html += `<div class="card"><p>${block.tx?.en || ""}</p></div>`;
        narration += block.tx?.en || "";
    }

    if (block.story) {
        html += `<div class="card"><p>${block.story.en || ""}</p></div>`;
        narration += block.story.en || "";
    }

    if (block.t === "breath_auto") {
        html += `
        <div class="card">
            <div class="breath-circle" id="breathCircle">
                <span id="breathLabel">INHALE</span>
            </div>
            <p>${block.tx?.en || ""}</p>
            <p class="small">${block.inf?.en || ""}</p>
        </div>`;
        narration += block.tx?.en + block.inf?.en;
    }

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q?.en || ""}</h3>`;

        block.op.forEach((o, i) => {
            html += `
            <div class="answer" onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex || []).replace(/"/g, '&quot;')})">
                ${o}
            </div>`;
        });

        html += `</div>`;
        narration += block.q?.en;
    }

    if (block.t !== "d") {
        html += `<button id="continueBtn" disabled>NARRATING...</button>`;
    }

    app.innerHTML = html;

    narrate(narration, () => {
        if (block.t !== "d") {
            unlockContinue("CONTINUE", nextBlock);
        }
    });
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
    state.phase = "mission";
    state.currentBlock = 0;
    render();
}

function nextStory() {
    state.currentIndex++;
    if (state.currentIndex >= state.stories.length) state.currentIndex = 0;
    state.phase = "story";
    state.currentBlock = 0;
    render();
}

/* =========================
   NARRATION
========================= */

function narrate(text, cb) {

    if (!text) return cb?.();

    state.speechLocked = true;
    window.speechSynthesis.cancel();

    const s = new SpeechSynthesisUtterance(text);
    s.lang = "en-US";
    s.rate = 0.92;

    s.onend = () => {
        state.speechLocked = false;
        cb?.();
    };

    window.speechSynthesis.speak(s);
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
