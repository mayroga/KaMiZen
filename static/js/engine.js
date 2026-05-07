/* =========================================================
   KAMIZEN ENGINE V10 - FULL STABLE SYSTEM + EXAM MODE
   ========================================================= */

/* =========================
   GLOBAL STATE
========================= */

let state = {
    stories: [],
    missions: [],

    currentIndex: 0,
    currentBlock: 0,

    phase: "loading", // loading | intro | story | mission | exam

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
   LOAD DATA
========================= */

async function loadAllData() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h2>LOADING SYSTEM...</h2>
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

        console.log("LOADED OK");

    } catch (err) {

        console.error(err);

        app.innerHTML = `
            <div class="card">
                <h2>ERROR LOADING SYSTEM</h2>
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
   START SYSTEM
========================= */

function startSystem() {

    state.examMode = false;

    state.currentIndex = 0;
    state.currentBlock = 0;
    state.phase = "story";

    render();
}

/* =========================
   EXAM MODE LOADER
========================= */

async function loadExamMode() {

    try {

        state.examMode = true;
        state.phase = "exam";

        const [exam1, exam2] = await Promise.all([
            fetch("/exam36-42.json"),
            fetch("/exam43-49.json")
        ]);

        const data1 = await exam1.json();
        const data2 = await exam2.json();

        state.examData = [
            ...data1.missions,
            ...data2.missions
        ];

        state.examIndex = 0;
        state.examBlock = 0;

        renderExam();

    } catch (err) {
        console.error("EXAM LOAD ERROR", err);
    }
}

/* =========================
   MAIN RENDER (NORMAL MODE)
========================= */

function render() {

    if (!state.initialized || state.examMode) return;

    const app = document.getElementById("app");

    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    if (!story || !mission) {
        state.currentIndex = 0;
        return render();
    }

    if (state.phase === "story") {

        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <p>${story.en || ""}</p>
            </div>

            <button id="continueBtn" disabled>NARRATING...</button>

            <button onclick="loadExamMode()">
                EXAM MODE ⚡
            </button>
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
   EXAM RENDER MODE
========================= */

function renderExam() {

    if (!state.examMode || !state.examData) return;

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
    let text = "";

    if (block.t === "v") {
        html += `<div class="card"><h2>${block.tx.en}</h2></div>`;
        text += block.tx.en + ". ";
    }

    if (block.t === "h") {
        html += `<div class="card"><p>${block.tx.en}</p></div>`;
        text += block.tx.en + ". ";
    }

    if (block.story) {
        html += `<div class="card"><p>${block.story.en}</p></div>`;
        text += block.story.en + ". ";
    }

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q.en}</h3>`;

        block.op.forEach((o, i) => {

            html += `
                <div class="answer"
                onclick="selectExamAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g,'&quot;')})">
                    ${o}
                </div>
            `;
        });

        html += `</div>`;
    }

    html += `<button id="continueBtn" disabled>NARRATING...</button>`;

    app.innerHTML = html;

    narrate(text, () => {

        unlockContinue("CONTINUE", () => {
            state.examBlock++;
            renderExam();
        });

    });
}

/* =========================
   BLOCK RENDER (NORMAL)
========================= */

function renderBlock(block) {

    const app = document.getElementById("app");

    let html = "";
    let narration = "";

    if (block.t === "v") {
        html += `<div class="card"><h2>${block.tx.en}</h2></div>`;
        narration += block.tx.en + ". ";
    }

    if (block.t === "h") {
        html += `<div class="card"><p>${block.tx.en}</p></div>`;
        narration += block.tx.en + ". ";
    }

    if (block.story) {
        html += `<div class="card"><p>${block.story.en}</p></div>`;
        narration += block.story.en + ". ";
    }

    if (block.t === "breath_auto") {

        html += `
            <div class="card">
                <div class="breath-circle" id="breathCircle">
                    <span id="breathLabel">INHALE</span>
                </div>
                <p>${block.tx.en}</p>
            </div>
        `;

        startBreathingAnimation();
    }

    html += `<button id="continueBtn" disabled>NARRATING...</button>`;

    app.innerHTML = html;

    narrate(narration, () => {
        unlockContinue("CONTINUE", nextBlock);
    });
}

/* =========================
   ANSWERS
========================= */

function selectAnswer(index, correct, explanations) {

    const app = document.getElementById("app");

    const ok = index === correct;

    app.innerHTML += `
        <div class="card">
            <h3 style="color:${ok ? 'green' : 'red'}">
                ${ok ? "CORRECT" : "WRONG"}
            </h3>
            <p>${explanations?.[index] || ""}</p>
        </div>
    `;
}

/* =========================
   NAVIGATION
========================= */

function nextBlock() {
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
    if (state.currentIndex >= state.stories.length) {
        state.currentIndex = 0;
    }
    state.phase = "story";
    state.currentBlock = 0;
    render();
}

/* =========================
   SPEECH ENGINE
========================= */

function narrate(text, cb) {

    if (!text) return cb?.();

    state.speechLocked = true;

    const s = new SpeechSynthesisUtterance(text);

    s.rate = 0.92;
    s.lang = "en-US";

    s.onend = () => {
        state.speechLocked = false;
        cb?.();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(s);
}

/* =========================
   CONTINUE BUTTON
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

    if (!circle) return;

    let inhale = true;

    setInterval(() => {

        if (!circle) return;

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
