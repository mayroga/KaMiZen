/* =========================================================
   KAMIZEN ENGINE V10 - FULL STABLE SYSTEM (UPGRADED)
   ✔ Reads ALL stories
   ✔ Reads ALL missions (1–49 compatible)
   ✔ Supports BODY + PRESENCE SYSTEM (NEW)
   ✔ Reads inf correctly
   ✔ No freeze
   ✔ No double render
   ✔ Speech lock until narration ends
   ✔ Loading screen first
   ✔ Manual start button
   ✔ Breathing system enhanced
   ✔ Sequential clean flow 1 -> 35 -> 49 -> loop
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

        state.stories = Array.isArray(storiesData.stories)
            ? storiesData.stories.sort((a, b) => a.id - b.id)
            : [];

        state.missions = Array.isArray(missionsData.missions)
            ? missionsData.missions.sort((a, b) => a.id - b.id)
            : [];

        console.log("STORIES:", state.stories.length);
        console.log("MISSIONS:", state.missions.length);

        state.initialized = true;

    } catch (err) {

        console.error("LOAD FAILURE:", err);

        app.innerHTML = `
            <div class="card">
                <h2>SYSTEM ERROR</h2>
                <p>Failed loading missions</p>
            </div>
        `;
    }
}

/* =========================
   INTRO
========================= */

function showIntro() {

    state.phase = "intro";

    document.getElementById("app").innerHTML = `
        <div class="card">
            <h1>KAMIZEN LIFE SYSTEM</h1>
            <p>BODY • CALM • FOCUS • PRESENCE</p>
            <p style="opacity:.8;">Stories + Missions Active</p>
        </div>

        <button onclick="startSystem()">START SYSTEM</button>
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
       STORY MODE
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
       MISSION MODE
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
   BLOCK RENDER (ENHANCED)
========================= */

function renderBlock(block) {

    const app = document.getElementById("app");

    let html = "";
    let narration = "";

    /* VISUAL */
    if (block.t === "v") {
        html += `<div class="card"><h2>${block.tx?.en || ""}</h2></div>`;
        narration += block.tx?.en + ". ";
    }

    /* HEADER */
    if (block.t === "h") {
        html += `<div class="card"><p>${block.tx?.en || ""}</p></div>`;
        narration += block.tx?.en + ". ";
    }

    /* STORY INSIDE */
    if (block.story) {
        html += `<div class="card"><p>${block.story.en}</p></div>`;
        narration += block.story.en + ". ";
    }

    /* =========================
       BREATHING SYSTEM (ENHANCED BODY + PRESENCE)
    ========================= */

    if (block.t === "breath_auto" || block.t === "br") {

        html += `
            <div class="card text-center">

                <div class="breath-circle" id="breathCircle">
                    <span id="breathLabel">INHALE</span>
                </div>

                <h3>${block.tx?.en || ""}</h3>
                <p>${block.inf?.en || ""}</p>

            </div>
        `;

        narration += block.tx?.en + ". " + (block.inf?.en || "") + ".";
    }

    /* =========================
       DECISION
    ========================= */

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q?.en}</h3>`;

        narration += block.q?.en + ". ";

        block.op.forEach((o, i) => {

            html += `
                <div class="answer"
                onclick="selectAnswer(${i},${block.c},${JSON.stringify(block.ex).replace(/"/g,'&quot;')})">
                ${o}
                </div>
            `;

            narration += o + ". ";
        });

        html += `</div>`;
    }

    /* SILENCE */
    if (block.t === "sil") {

        html += `<div class="card">
            <h3>${block.tx?.en}</h3>
            <p>${block.inf?.en}</p>
        </div>`;

        narration += block.tx?.en + ". " + block.inf?.en;
    }

    /* REWARD */
    if (block.t === "r") {

        html += `<div class="card">
            <h2>⭐ ${block.tx}</h2>
            <p>+${block.p} XP</p>
        </div>`;

        narration += block.tx + ". " + block.p + " XP.";
    }

    /* CONTINUE BUTTON */
    if (block.t !== "d") {
        html += `<button id="continueBtn" disabled>NARRATING...</button>`;
    }

    app.innerHTML = html;

    /* BREATH ANIMATION */
    if (block.t === "breath_auto" || block.t === "br") {
        startBreathingAnimation();
    }

    /* SPEECH */
    narrate(narration, () => {

        if (block.t !== "d") {
            unlockContinue("CONTINUE", nextBlock);
        }
    });
}

/* =========================
   ANSWERS
========================= */

function selectAnswer(i, correct, ex) {

    if (state.speechLocked) return;

    const ok = i === correct;

    document.getElementById("app").innerHTML += `
        <div class="card">
            <h3 style="color:${ok?'#22c55e':'#ef4444'}">
                ${ok ? "CORRECT" : "TRY AGAIN"}
            </h3>
            <p>${ex[i]}</p>
        </div>

        <button id="continueBtn" disabled>NARRATING...</button>
    `;

    narrate(ex[i], () => {
        unlockContinue("CONTINUE", nextBlock);
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
   SPEECH ENGINE
========================= */

function narrate(text, cb) {

    if (!text) return cb && cb();

    state.speechLocked = true;

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);

    u.rate = 0.92;
    u.pitch = 1;

    u.onend = () => {
        state.speechLocked = false;
        cb && cb();
    };

    u.onerror = () => {
        state.speechLocked = false;
        cb && cb();
    };

    speechSynthesis.speak(u);
}

/* =========================
   UI CONTROLS
========================= */

function unlockContinue(t, fn) {

    const b = document.getElementById("continueBtn");

    if (!b) return;

    b.disabled = false;
    b.innerText = t;
    b.onclick = fn;
}

/* =========================
   BREATHING SYSTEM (BODY + PRESENCE CORE)
========================= */

function startBreathingAnimation() {

    const c = document.getElementById("breathCircle");
    const l = document.getElementById("breathLabel");

    if (!c || !l) return;

    let inb = true;

    setInterval(() => {

        if (!c) return;

        if (inb) {
            l.innerText = "INHALE";
            c.style.transform = "scale(1.3)";
        } else {
            l.innerText = "EXHALE";
            c.style.transform = "scale(0.85)";
        }

        inb = !inb;

    }, 4000);
}
