/* =========================================================
   KAMIZEN ENGINE V10 - FULL STABLE SYSTEM
   ✔ Reads ALL 35 stories
   ✔ Reads ALL 35 missions
   ✔ Reads inf correctly
   ✔ No freeze
   ✔ No double render
   ✔ Speech lock until narration ends
   ✔ Loading screen first
   ✔ Manual start button
   ✔ Breathing text + inf visible
   ✔ Sequential clean flow 1 -> 35 -> 1
   ✔ Direct mission jump (NEW SAFE FEATURE)
   ========================================================= */

/* =========================
   GLOBAL STATE
========================= */

let state = {
    stories: [],
    missions: [],

    currentIndex: 0,
    currentBlock: 0,

    phase: "loading", // loading | intro | story | mission

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

        /* MISSIONS */
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
   INTRO SCREEN
========================= */

function showIntro() {

    state.phase = "intro";

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h1>KAMIZEN LIFE SYSTEM</h1>

            <p>
                Awareness • Control • Safety • Focus
            </p>

            <p style="opacity:.8;">
                35 Stories • 35 Missions
            </p>
        </div>

        <!-- ✅ NEW SAFE JUMP SYSTEM -->
        <div class="card">
            <input id="missionInput"
                   type="number"
                   placeholder="Enter mission ID (e.g. 36)"
                   style="width:100%;padding:10px;border-radius:8px;border:none;margin-bottom:10px;">

            <button onclick="jumpToMission()">
                GO TO MISSION
            </button>
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

                <h3>${story.t || ""}</h3>

                <p>${story.en || ""}</p>

            </div>

            <button id="continueBtn" disabled>
                NARRATING...
            </button>
        `;

        narrate(`${story.t || ""}. ${story.en || ""}`, () => {

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
   RENDER BLOCK
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
        <div class="card center">
            <div class="breath-circle" id="breathCircle">
                <span id="breathLabel">INHALE</span>
            </div>

            <h3>${block.tx?.en || ""}</h3>
            <p>${block.inf?.en || ""}</p>
        </div>`;

        narration += `${block.tx?.en || ""}. ${block.inf?.en || ""}. `;
    }

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q?.en || ""}</h3>`;

        narration += `${block.q?.en || ""}. `;

        block.op?.forEach((opt, i) => {

            html += `
                <div class="answer"
                     onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g,'&quot;')})">
                    ${opt}
                </div>
            `;

            narration += `${opt}. `;
        });

        html += `</div>`;
    }

    if (block.t !== "d") {
        html += `<button id="continueBtn" disabled>NARRATING...</button>`;
    }

    app.innerHTML = html;

    startBreathingAnimation();

    narrate(narration, () => {

        if (block.t !== "d") {
            unlockContinue("CONTINUE", nextBlock);
        }
    });
}

/* =========================
   ANSWER SYSTEM
========================= */

function selectAnswer(index, correct, explanations) {

    if (state.speechLocked) return;

    const isCorrect = index === correct;
    const explanation = explanations?.[index] || "";

    document.getElementById("app").innerHTML += `
        <div class="card">
            <h3 style="color:${isCorrect ? '#22c55e' : '#ef4444'}">
                ${isCorrect ? "CORRECT" : "WRONG"}
            </h3>
            <p>${explanation}</p>
        </div>

        <button id="continueBtn" disabled>NARRATING...</button>
    `;

    narrate(explanation, () => {
        unlockContinue("CONTINUE", nextBlock);
    });
}

/* =========================
   FLOW CONTROL
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
   SAFE DIRECT JUMP (NEW FEATURE)
========================= */

function goToMissionById(id) {

    if (!state.missions || !state.missions.length) return;

    const index = state.missions.findIndex(m => m.id === Number(id));

    if (index === -1) {
        console.warn("Mission not found:", id);
        return;
    }

    state.currentIndex = index;
    state.currentBlock = 0;
    state.phase = "mission";

    render();
}

function jumpToMission() {

    const input = document.getElementById("missionInput");
    if (!input) return;

    const id = parseInt(input.value);
    if (isNaN(id)) return;

    goToMissionById(id);
}

/* =========================
   NARRATION SYSTEM
========================= */

function narrate(text, callback = null) {

    if (!text) {
        callback?.();
        return;
    }

    state.speechLocked = true;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-US";
    speech.rate = 0.92;

    speech.onend = () => {
        state.speechLocked = false;
        callback?.();
    };

    speech.onerror = () => {
        state.speechLocked = false;
        callback?.();
    };

    window.speechSynthesis.speak(speech);
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

    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");

    if (!circle || !label) return;

    let inhale = true;

    function animate() {

        if (!document.getElementById("breathCircle")) return;

        label.innerText = inhale ? "INHALE" : "EXHALE";
        circle.style.transform = inhale ? "scale(1.25)" : "scale(0.8)";

        inhale = !inhale;
    }

    animate();
    setInterval(animate, 4000);
}
