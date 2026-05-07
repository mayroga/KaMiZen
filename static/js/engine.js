/* =========================================================
   KAMIZEN ENGINE V11 - FULL STABLE + EXAM MODE
   ✔ Core 1–35 SYSTEM UNCHANGED
   ✔ Optional EXAM MODE (36–49)
   ✔ No conflicts / no overrides
   ✔ Safe modular architecture
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
    initialized: false,

    /* EXAM MODE */
    examMode: false,
    examData: null,
    examIndex: 0,
    examBlock: 0
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
   LOAD DATA (CORE SYSTEM)
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

        state.stories = Array.isArray(storiesData.stories)
            ? storiesData.stories.sort((a, b) => a.id - b.id)
            : [];

        state.missions = Array.isArray(missionsData.missions)
            ? missionsData.missions.sort((a, b) => a.id - b.id)
            : [];

        state.initialized = true;

    } catch (err) {

        console.error(err);

        app.innerHTML = `
            <div class="card">
                <h2>SYSTEM ERROR</h2>
            </div>
        `;
    }
}

/* =========================
   INTRO SCREEN
========================= */

function showIntro() {

    state.phase = "intro";

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h1>KAMIZEN LIFE SYSTEM</h1>
            <p>Awareness • Control • Safety • Focus</p>
        </div>

        <button onclick="startSystem()">START SYSTEM</button>

        <button onclick="loadExamMode()">
            HOW TO REACT BEFORE & DURING EXAMS
        </button>
    `;
}

/* =========================
   START NORMAL SYSTEM
========================= */

function startSystem() {

    state.examMode = false;

    state.currentIndex = 0;
    state.currentBlock = 0;
    state.phase = "story";

    render();
}

/* =========================
   MAIN RENDER (CORE)
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
                <p>${story.en}</p>
            </div>

            <button id="continueBtn" disabled>NARRATING...</button>
        `;

        narrate(story.en, () => {
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
   BLOCK RENDER (CORE)
========================= */

function renderBlock(block) {

    const app = document.getElementById("app");

    let html = "";
    let narration = "";

    if (block.t === "v") {
        html += `<div class="card"><h2>${block.tx?.en}</h2></div>`;
        narration += block.tx?.en + ". ";
    }

    if (block.t === "h") {
        html += `<div class="card"><p>${block.tx?.en}</p></div>`;
        narration += block.tx?.en + ". ";
    }

    if (block.story) {
        html += `<div class="card"><p>${block.story.en}</p></div>`;
        narration += block.story.en + ". ";
    }

    if (block.t === "breath_auto" || block.t === "br") {

        html += `
            <div class="card">
                <div class="breath-circle" id="breathCircle">
                    <span id="breathLabel">INHALE</span>
                </div>
                <p>${block.tx?.en}</p>
                <p>${block.inf?.en}</p>
            </div>
        `;

        narration += block.tx?.en + ". " + block.inf?.en;
    }

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q?.en}</h3>`;

        block.op.forEach((o, i) => {

            html += `
                <div class="answer"
                onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g,'&quot;')})">
                    ${o}
                </div>
            `;
        });

        html += `</div>`;
    }

    if (block.t === "sil") {
        html += `<div class="card"><p>${block.tx?.en}</p></div>`;
    }

    if (block.t === "r") {
        html += `<div class="card"><h2>${block.tx}</h2><p>+${block.p} XP</p></div>`;
    }

    if (block.t === "c") {
        html += `<div class="card"><p>${block.tx?.en}</p></div>`;
    }

    html += `<button id="continueBtn" disabled>NARRATING...</button>`;

    app.innerHTML = html;

    if (block.t === "breath_auto" || block.t === "br") {
        startBreathingAnimation();
    }

    narrate(narration, () => {
        unlockContinue("CONTINUE", nextBlock);
    });
}

/* =========================
   CORE ANSWER SYSTEM
========================= */

function selectAnswer(index, correct, explanations) {

    const app = document.getElementById("app");

    const ok = index === correct;

    app.innerHTML += `
        <div class="card">
            <h3>${ok ? "CORRECT" : "WRONG"}</h3>
            <p>${explanations?.[index] || ""}</p>
        </div>

        <button id="continueBtn" disabled>NARRATING...</button>
    `;

    narrate(explanations?.[index] || "", () => {
        unlockContinue("CONTINUE", nextBlock);
    });
}

/* =========================
   EXAM MODE LOADER
========================= */

async function loadExamMode() {

    try {

        state.examMode = true;
        state.phase = "exam";

        const [a, b] = await Promise.all([
            fetch("/exam36-42.json"),
            fetch("/exam43-49.json")
        ]);

        const d1 = await a.json();
        const d2 = await b.json();

        state.examData = [
            ...d1.missions,
            ...d2.missions
        ];

        state.examIndex = 0;
        state.examBlock = 0;

        renderExam();

    } catch (e) {
        console.error(e);
    }
}

/* =========================
   EXAM RENDER
========================= */

function renderExam() {

    const app = document.getElementById("app");

    const mission = state.examData[state.examIndex];

    if (!mission) {
        state.examMode = false;
        showIntro();
        return;
    }

    const block = mission.b[state.examBlock];

    if (!block) {
        state.examIndex++;
        state.examBlock = 0;
        return renderExam();
    }

    let html = "";
    let narration = "";

    if (block.t === "v") html += `<div class="card"><h2>${block.tx.en}</h2></div>`;
    if (block.t === "h") html += `<div class="card"><p>${block.tx.en}</p></div>`;
    if (block.story) html += `<div class="card"><p>${block.story.en}</p></div>`;

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q.en}</h3>`;

        block.op.forEach((o, i) => {
            html += `<div class="answer" onclick="selectExamAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g,'&quot;')})">${o}</div>`;
        });

        html += `</div>`;
    }

    html += `<button id="continueBtn" disabled>NARRATING...</button>`;

    app.innerHTML = html;

    narrate(block.tx?.en || block.story?.en || "", () => {

        unlockContinue("CONTINUE", () => {
            state.examBlock++;
            renderExam();
        });

    });
}

/* =========================
   EXAM ANSWER SYSTEM
========================= */

function selectExamAnswer(index, correct, explanations) {

    const app = document.getElementById("app");

    const ok = index === correct;

    app.innerHTML += `
        <div class="card">
            <h3>${ok ? "GOOD" : "TRY AGAIN"}</h3>
            <p>${explanations?.[index] || ""}</p>
        </div>
    `;

    narrate(explanations?.[index] || "", () => {

        unlockContinue("CONTINUE", () => {
            state.examBlock++;
            renderExam();
        });

    });
}

/* =========================
   ENGINE HELPERS
========================= */

function startMission() {
    state.phase = "mission";
    state.currentBlock = 0;
    render();
}

function nextBlock() {
    state.currentBlock++;
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
   NARRATION ENGINE
========================= */

function narrate(text, cb) {

    if (!text) return cb && cb();

    state.speechLocked = true;

    const s = new SpeechSynthesisUtterance(text);

    s.lang = "en-US";
    s.rate = 0.92;

    s.onend = () => {
        state.speechLocked = false;
        cb && cb();
    };

    speechSynthesis.speak(s);
}

/* =========================
   UI HELPERS
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

    const c = document.getElementById("breathCircle");
    const l = document.getElementById("breathLabel");

    if (!c || !l) return;

    let inha = true;

    setInterval(() => {

        l.innerText = inha ? "INHALE" : "EXHALE";
        c.style.transform = inha ? "scale(1.25)" : "scale(0.8)";
        inha = !inha;

    }, 4000);
}
