/* =========================================================
   KAMIZEN ENGINE V10 - FULL STABLE SYSTEM (PATCHED)
   ✔ Reads ALL 35 stories
   ✔ Reads CORE missions
   ✔ Reads EXAM missions (36–49)
   ✔ No freeze safe merge
   ✔ No double render
   ✔ Speech lock stable
   ✔ Clean flow 1 -> 35 -> 1
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
   LOAD DATA (PATCHED SAFE)
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

        /* =========================
           STORIES SAFE LOAD
        ========================= */

        state.stories = Array.isArray(storiesData.stories)
            ? storiesData.stories.sort((a, b) => a.id - b.id)
            : [];

        /* =========================
           MISSIONS SAFE LOAD (CORE + EXAM already merged backend)
        ========================= */

        const rawMissions = missionsData.missions;

        state.missions = Array.isArray(rawMissions)
            ? rawMissions.filter(m => m && typeof m === "object" && m.id != null)
                         .sort((a, b) => a.id - b.id)
            : [];

        console.log("STORIES:", state.stories.length);
        console.log("MISSIONS (CORE+EXAM):", state.missions.length);

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
            <p>Awareness • Control • Safety • Focus</p>
            <p style="opacity:.8;">Stories + Missions + Exam Mode</p>
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

    /* =========================
       STORY
    ========================= */

    if (state.phase === "story") {

        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <h3>${story.t || ""}</h3>
                <p>${story.en || ""}</p>
            </div>

            <button id="continueBtn" disabled>NARRATING...</button>
        `;

        narrate(`${story.t || ""}. ${story.en || ""}`, () => {
            unlockContinue("START MISSION", startMission);
        });

        return;
    }

    /* =========================
       MISSION
    ========================= */

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
        narration += `${block.tx?.en || ""}. `;
    }

    if (block.t === "h") {
        html += `<div class="card"><p>${block.tx?.en || ""}</p></div>`;
        narration += `${block.tx?.en || ""}. `;
    }

    if (block.story) {
        html += `<div class="card"><p>${block.story.en || ""}</p></div>`;
        narration += `${block.story.en || ""}. `;
    }

    if (block.t === "breath_auto" || block.t === "br") {

        html += `
            <div class="card">
                <div id="breathCircle" class="breath-circle">
                    <span id="breathLabel">INHALE</span>
                </div>
                <h3>${block.tx?.en || ""}</h3>
                <p>${block.inf?.en || ""}</p>
            </div>
        `;

        narration += `${block.tx?.en || ""}. ${block.inf?.en || ""}.`;
    }

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q?.en || ""}</h3>`;

        if (Array.isArray(block.op)) {
            block.op.forEach((opt, i) => {
                html += `
                    <div class="answer"
                        onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g,'&quot;')})">
                        ${opt}
                    </div>
                `;
            });
        }

        html += `</div>`;
    }

    if (block.t === "r") {
        html += `<div class="card"><h2>⭐ ${block.tx}</h2><p>+${block.p} XP</p></div>`;
    }

    if (block.t === "c") {
        html += `<div class="card"><p>${block.tx?.en || ""}</p></div>`;
    }

    if (block.t !== "d") {
        html += `<button id="continueBtn" disabled>NARRATING...</button>`;
    }

    app.innerHTML = html;

    if (block.t === "breath_auto" || block.t === "br") {
        startBreathingAnimation();
    }

    narrate(narration, () => {
        if (block.t !== "d") {
            unlockContinue("CONTINUE", nextBlock);
        }
    });
}

/* =========================
   SAFE FUNCTIONS (UNCHANGED LOGIC)
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
    if (state.currentIndex >= state.stories.length) state.currentIndex = 0;
    state.phase = "story";
    state.currentBlock = 0;
    render();
}

function narrate(text, cb) {
    if (!text) return cb && cb();

    state.speechLocked = true;

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.92;

    u.onend = () => {
        state.speechLocked = false;
        cb && cb();
    };

    window.speechSynthesis.speak(u);
}

function unlockContinue(label, action) {
    const btn = document.getElementById("continueBtn");
    if (!btn) return;
    btn.disabled = false;
    btn.innerText = label;
    btn.onclick = action;
}

function startBreathingAnimation() {

    const c = document.getElementById("breathCircle");
    const l = document.getElementById("breathLabel");

    if (!c || !l) return;

    let inhale = true;

    setInterval(() => {
        if (!document.getElementById("breathCircle")) return;

        l.innerText = inhale ? "INHALE" : "EXHALE";
        c.style.transform = inhale ? "scale(1.25)" : "scale(0.85)";
        inhale = !inhale;

    }, 4000);
}

function selectAnswer(i, correct, ex) {

    if (state.speechLocked) return;

    const ok = i === correct;
    const msg = ex?.[i] || "";

    document.getElementById("app").innerHTML += `
        <div class="card">
            <h3 style="color:${ok ? 'lime' : 'red'}">
                ${ok ? "CORRECT" : "WRONG"}
            </h3>
            <p>${msg}</p>
        </div>

        <button id="continueBtn" disabled>NARRATING...</button>
    `;

    narrate(msg, () => unlockContinue("CONTINUE", nextBlock));
}
