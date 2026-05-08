/* =========================================================
   KAMIZEN ENGINE V10 - FULL STABLE SYSTEM
   ✔ Reads ALL 49 stories
   ✔ Reads ALL 49 missions
   ✔ Reads inf correctly
   ✔ No freeze
   ✔ No double render
   ✔ Speech lock until narration ends
   ✔ Loading screen first
   ✔ Manual start button
   ✔ Breathing text + inf visible
   ✔ Sequential clean flow 1 -> 49 -> 1
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
                49 Stories • 49 Missions
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
   MAIN RENDER
========================= */

function render() {

    if (!state.initialized) return;

    const app = document.getElementById("app");

    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    /* LOOP SYSTEM */

    if (!story || !mission) {

        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "story";

        return render();
    }

    /* =========================
       STORY SCREEN
    ========================= */

    if (state.phase === "story") {

        app.innerHTML = `
            <div class="card">

                <h2>
                    STORY ${story.id}
                </h2>

                <h3>
                    ${story.t || ""}
                </h3>

                <p>
                    ${story.en || ""}
                </p>

            </div>

            <button id="continueBtn" disabled>
                NARRATING...
            </button>
        `;

        narrate(
            `${story.t || ""}. ${story.en || ""}`,
            () => {

                unlockContinue(
                    "START MISSION",
                    startMission
                );

            }
        );

        return;
    }

    /* =========================
       MISSION SCREEN
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
   RENDER BLOCK
========================= */

function renderBlock(block) {

    const app = document.getElementById("app");

    let html = "";

    let narration = "";

    /* =========================
       VISUAL TITLE
    ========================= */

    if (block.t === "v") {

        html += `
            <div class="card">
                <h2>${block.tx?.en || ""}</h2>
            </div>
        `;

        narration += `${block.tx?.en || ""}. `;
    }

    /* =========================
       HEADER
    ========================= */

    if (block.t === "h") {

        html += `
            <div class="card">
                <p>${block.tx?.en || ""}</p>
            </div>
        `;

        narration += `${block.tx?.en || ""}. `;
    }

    /* =========================
       STORY INSIDE MISSION
    ========================= */

    if (block.story) {

        html += `
            <div class="card">
                <p>${block.story.en || ""}</p>
            </div>
        `;

        narration += `${block.story.en || ""}. `;
    }

    /* =========================
       BREATHING
    ========================= */

    if (
        block.t === "breath_auto" ||
        block.t === "br"
    ) {

        html += `
            <div class="card" style="text-align:center;">

                <div class="breath-circle"
                     id="breathCircle">

                    <span id="breathLabel">
                        INHALE
                    </span>

                </div>

                <h3>
                    ${block.tx?.en || ""}
                </h3>

                <p>
                    ${block.inf?.en || ""}
                </p>

            </div>
        `;

        narration += `
            ${block.tx?.en || ""}.
            ${block.inf?.en || ""}.
        `;
    }

    /* =========================
       DECISION
    ========================= */

    if (block.t === "d") {

        html += `
            <div class="card">

                <h3>
                    ${block.q?.en || ""}
                </h3>
        `;

        narration += `${block.q?.en || ""}. `;

        if (Array.isArray(block.op)) {

            block.op.forEach((option, index) => {

                html += `
                    <div class="answer"
                         onclick="selectAnswer(
                            ${index},
                            ${block.c},
                            ${JSON.stringify(block.ex).replace(/"/g, '&quot;')}
                         )">

                        ${option}

                    </div>
                `;

                narration += `${option}. `;
            });
        }

        html += `</div>`;
    }

    /* =========================
       SILENCE
    ========================= */

    if (block.t === "sil") {

        html += `
            <div class="card">

                <h3>
                    ${block.tx?.en || ""}
                </h3>

                <p>
                    ${block.inf?.en || ""}
                </p>

            </div>
        `;

        narration += `
            ${block.tx?.en || ""}.
            ${block.inf?.en || ""}.
        `;
    }

    /* =========================
       REWARD
    ========================= */

    if (block.t === "r") {

        html += `
            <div class="card">

                <h2>
                    ⭐ ${block.tx || ""}
                </h2>

                <p>
                    +${block.p || 0} XP
                </p>

            </div>
        `;

        narration += `
            ${block.tx || ""}.
            ${block.p || 0} experience points.
        `;
    }

    /* =========================
       CONCLUSION
    ========================= */

    if (block.t === "c") {

        html += `
            <div class="card">

                <p>
                    ${block.tx?.en || ""}
                </p>

            </div>
        `;

        narration += `${block.tx?.en || ""}. `;
    }

    /* =========================
       CONTINUE BUTTON
    ========================= */

    if (block.t !== "d") {

        html += `
            <button id="continueBtn" disabled>
                NARRATING...
            </button>
        `;
    }

    app.innerHTML = html;

    /* =========================
       BREATHING START
    ========================= */

    if (
        block.t === "breath_auto" ||
        block.t === "br"
    ) {

        startBreathingAnimation();
    }

    /* =========================
       NARRATION LOCK
    ========================= */

    narrate(narration, () => {

        if (block.t !== "d") {

            unlockContinue(
                "CONTINUE",
                nextBlock
            );
        }
    });
}

/* =========================
   ANSWER SYSTEM
========================= */

function selectAnswer(index, correct, explanations) {

    if (state.speechLocked) return;

    const app = document.getElementById("app");

    const isCorrect = index === correct;

    const explanation = explanations?.[index] || "";

    app.innerHTML += `
        <div class="card">

            <h3 style="color:${isCorrect ? '#22c55e' : '#ef4444'}">

                ${isCorrect ? "CORRECT" : "WRONG"}

            </h3>

            <p>
                ${explanation}
            </p>

        </div>

        <button id="continueBtn" disabled>
            NARRATING...
        </button>
    `;

    narrate(explanation, () => {

        unlockContinue(
            "CONTINUE",
            nextBlock
        );

    });
}

/* =========================
   NEXT BLOCK
========================= */

function nextBlock() {

    if (state.speechLocked) return;

    state.currentBlock++;

    render();
}

/* =========================
   START MISSION
========================= */

function startMission() {

    if (state.speechLocked) return;

    state.phase = "mission";
    state.currentBlock = 0;

    render();
}

/* =========================
   NEXT STORY
========================= */

function nextStory() {

    state.currentIndex++;

    /* CLEAN LOOP */

    if (state.currentIndex >= state.stories.length) {

        state.currentIndex = 0;
    }

    state.phase = "story";
    state.currentBlock = 0;

    render();
}

/* =========================
   NARRATOR
========================= */

function narrate(text, callback = null) {

    if (!text) {

        if (callback) callback();

        return;
    }

    state.speechLocked = true;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-US";

    speech.rate = 0.92;
    speech.pitch = 1;
    speech.volume = 1;

    speech.onend = () => {

        state.speechLocked = false;

        if (callback) callback();
    };

    speech.onerror = () => {

        state.speechLocked = false;

        if (callback) callback();
    };

    window.speechSynthesis.speak(speech);
}

/* =========================
   BUTTON UNLOCK
========================= */

function unlockContinue(label, action) {

    const btn = document.getElementById("continueBtn");

    if (!btn) return;

    btn.disabled = false;
    btn.innerText = label;

    btn.onclick = action;
}

/* =========================
   BREATHING ANIMATION
========================= */

function startBreathingAnimation() {

    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");

    if (!circle || !label) return;

    let inhale = true;

    circle.style.transition =
        "transform 4s ease-in-out";

    function animate() {

        if (!document.getElementById("breathCircle")) {
            return;
        }

        if (inhale) {

            label.innerText = "INHALE";

            circle.style.transform =
                "scale(1.25)";

        } else {

            label.innerText = "EXHALE";

            circle.style.transform =
                "scale(0.8)";
        }

        inhale = !inhale;
    }

    animate();

    setInterval(animate, 4000);
}
/* =========================
   DIRECT MISSION LOADER
========================= */

function jumpToMission() {

    const input =
        document.getElementById("missionSelector");

    if (!input) return;

    let num = parseInt(input.value);

    if (isNaN(num)) return;

    if (num < 1) num = 1;
    if (num > 49) num = 49;

    const index =
        state.stories.findIndex(
            s => s.id === num
        );

    if (index === -1) {

        alert("Mission not found");
        return;
    }

    /* STOP CURRENT SPEECH */

    window.speechSynthesis.cancel();

    state.speechLocked = false;

    /* LOAD TARGET */

    state.currentIndex = index;
    state.currentBlock = 0;
    state.phase = "story";

    render();
}
