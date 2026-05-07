/* =========================================================
   KAMIZEN ENGINE V10 - FULL STABLE SPEECH LOCK SYSTEM
   ✔ Reads ALL missions
   ✔ Reads ALL inf blocks
   ✔ No freeze
   ✔ No duplicate render
   ✔ Speech finishes completely
   ✔ Render locked until narration ends
   ✔ Loading screen first
   ✔ Manual start button
   ✔ Story 1 always begins clean
   ✔ Breath blocks show tx + inf
   ✔ Supports missions_01_07 -> missions_29_35
   ========================================================= */

let state = {
    stories: [],
    missions: [],

    index: 0,
    bIndex: 0,

    mode: "loading", // loading | intro | story | mission
    ready: false,

    speaking: false,
    breathInterval: null
};

/* =========================================================
   INIT
========================================================= */

window.addEventListener("load", async () => {
    renderLoading();

    await loadData();

    state.mode = "intro";

    render();
});

/* =========================================================
   LOAD DATA
========================================================= */

async function loadData() {
    try {

        const [storiesReq, missionsReq] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);

        const storiesData = await storiesReq.json();
        const missionsData = await missionsReq.json();

        state.stories = (storiesData.stories || [])
            .sort((a, b) => Number(a.id) - Number(b.id));

        state.missions = (missionsData.missions || [])
            .sort((a, b) => Number(a.id) - Number(b.id));

        console.log("STORIES:", state.stories.length);
        console.log("MISSIONS:", state.missions.length);

        state.ready = true;

    } catch (err) {

        console.error("LOAD ERROR:", err);

        const app = document.getElementById("app");

        app.innerHTML = `
            <div class="card">
                <h2>SYSTEM ERROR</h2>
                <p>Could not load mission database.</p>
            </div>
        `;
    }
}

/* =========================================================
   MAIN RENDER
========================================================= */

function render() {

    const app = document.getElementById("app");

    if (!app) return;

    if (!state.ready) {
        renderLoading();
        return;
    }

    /* =========================
       INTRO SCREEN
    ========================= */

    if (state.mode === "intro") {

        stopBreathing();

        app.innerHTML = `
            <div class="card">
                <h1>KAMIZEN LIFE SYSTEM</h1>

                <p class="small">
                    Awareness • Safety • Control • Focus
                </p>

                <hr>

                <p>
                    Neural training system loaded successfully.
                </p>

                <p class="small">
                    Stories Loaded: ${state.stories.length}<br>
                    Missions Loaded: ${state.missions.length}
                </p>

                <button onclick="startSystem()">
                    START SYSTEM
                </button>
            </div>
        `;

        return;
    }

    const story = state.stories[state.index];
    const mission = state.missions[state.index];

    /* =========================
       LOOP SYSTEM
    ========================= */

    if (!story || !mission) {

        state.index = 0;
        state.bIndex = 0;
        state.mode = "story";

        render();

        return;
    }

    /* =========================
       STORY MODE
    ========================= */

    if (state.mode === "story") {

        stopBreathing();

        app.innerHTML = `
            <div class="card">
                <div class="small">
                    STORY ${story.id}/${state.stories.length}
                </div>

                <h2>${story.t || "Knowledge"}</h2>

                <p>
                    ${story.en}
                </p>

                <button id="continueBtn" disabled>
                    Narrating...
                </button>
            </div>
        `;

        speakFull(story.en, () => {

            const btn = document.getElementById("continueBtn");

            if (btn) {
                btn.disabled = false;
                btn.innerText = "START MISSION";
                btn.onclick = startMission;
            }
        });

        return;
    }

    /* =========================
       MISSION MODE
    ========================= */

    if (state.mode === "mission") {

        const block = mission.b[state.bIndex];

        if (!block) {
            nextStory();
            return;
        }

        renderBlock(block);
    }
}

/* =========================================================
   LOADING SCREEN
========================================================= */

function renderLoading() {

    const app = document.getElementById("app");

    if (!app) return;

    app.innerHTML = `
        <div class="card center">
            <h1>LOADING SYSTEM</h1>

            <div class="loader"></div>

            <p class="small">
                Initializing neural missions...
            </p>
        </div>
    `;
}

/* =========================================================
   START SYSTEM
========================================================= */

function startSystem() {

    state.index = 0;
    state.bIndex = 0;
    state.mode = "story";

    render();
}

/* =========================================================
   START MISSION
========================================================= */

function startMission() {

    state.mode = "mission";
    state.bIndex = 0;

    render();
}

/* =========================================================
   NEXT BLOCK
========================================================= */

function nextBlock() {

    stopBreathing();

    state.bIndex++;

    render();
}

/* =========================================================
   NEXT STORY
========================================================= */

function nextStory() {

    stopBreathing();

    state.index++;

    if (state.index >= state.stories.length) {
        state.index = 0;
    }

    state.mode = "story";
    state.bIndex = 0;

    render();
}

/* =========================================================
   BLOCK RENDER
========================================================= */

function renderBlock(block) {

    const app = document.getElementById("app");

    if (!app) return;

    stopBreathing();

    let html = "";

    /* =========================
       VISUAL TITLE
    ========================= */

    if (block.t === "v") {

        html = `
            <div class="card">
                <h2>${block.tx?.en || ""}</h2>

                <button id="continueBtn" disabled>
                    Narrating...
                </button>
            </div>
        `;

        app.innerHTML = html;

        speakFull(block.tx?.en || "", unlockContinue);

        return;
    }

    /* =========================
       HEADER
    ========================= */

    if (block.t === "h") {

        html = `
            <div class="card">
                <p>${block.tx?.en || ""}</p>

                <button id="continueBtn" disabled>
                    Narrating...
                </button>
            </div>
        `;

        app.innerHTML = html;

        speakFull(block.tx?.en || "", unlockContinue);

        return;
    }

    /* =========================
       STORY INSIDE MISSION
    ========================= */

    if (block.story) {

        html = `
            <div class="card">
                <p>${block.story.en}</p>

                <button id="continueBtn" disabled>
                    Narrating...
                </button>
            </div>
        `;

        app.innerHTML = html;

        speakFull(block.story.en, unlockContinue);

        return;
    }

    /* =========================
       BREATHING
    ========================= */

    if (block.t === "breath_auto" || block.t === "br") {

        html = `
            <div class="card center">

                <div id="breathCircle" class="breath-circle">
                    <span id="breathLabel">
                        INHALE
                    </span>
                </div>

                <h3>
                    ${block.tx?.en || ""}
                </h3>

                <p class="small">
                    ${block.inf?.en || ""}
                </p>

                <button id="continueBtn" disabled>
                    Breathing...
                </button>

            </div>
        `;

        app.innerHTML = html;

        startBreathing(
            block.d || 30,
            block.tx?.en || "",
            block.inf?.en || ""
        );

        return;
    }

    /* =========================
       DECISION
    ========================= */

    if (block.t === "d") {

        html = `
            <div class="card">

                <h3>${block.q?.en || ""}</h3>

                ${(block.op || []).map((op, i) => `
                    <div class="answer"
                        onclick='answer(
                            ${i},
                            ${block.c},
                            ${JSON.stringify(block.ex || []).replace(/'/g, "&apos;")}
                        )'>
                        ${op}
                    </div>
                `).join("")}

            </div>
        `;

        app.innerHTML = html;

        speakFull(block.q?.en || "");

        return;
    }

    /* =========================
       SILENCE
    ========================= */

    if (block.t === "sil") {

        html = `
            <div class="card center">

                <h3>${block.tx?.en || ""}</h3>

                <p class="small">
                    ${block.inf?.en || ""}
                </p>

                <button id="continueBtn" disabled>
                    Focus...
                </button>

            </div>
        `;

        app.innerHTML = html;

        const totalText =
            (block.tx?.en || "") +
            ". " +
            (block.inf?.en || "");

        speakFull(totalText, () => {

            setTimeout(() => {
                unlockContinue();
            }, (block.d || 10) * 1000);
        });

        return;
    }

    /* =========================
       REWARD
    ========================= */

    if (block.t === "r") {

        html = `
            <div class="card center">

                <h2>
                    ⭐ ${block.tx || ""}
                </h2>

                <p>
                    +${block.p || 0} XP
                </p>

                <button id="continueBtn" disabled>
                    Narrating...
                </button>

            </div>
        `;

        app.innerHTML = html;

        speakFull(
            `${block.tx || ""} plus ${block.p || 0} experience`,
            unlockContinue
        );

        return;
    }

    /* =========================
       CONCLUSION
    ========================= */

    if (block.t === "c") {

        html = `
            <div class="card">

                <h3>Conclusion</h3>

                <p>${block.tx?.en || ""}</p>

                <button id="continueBtn" disabled>
                    Narrating...
                </button>

            </div>
        `;

        app.innerHTML = html;

        speakFull(block.tx?.en || "", unlockContinue);

        return;
    }
}

/* =========================================================
   ANSWER SYSTEM
========================================================= */

function answer(index, correct, explanations) {

    const app = document.getElementById("app");

    const ok = index === correct;

    let exp = "";

    try {
        exp = explanations[index] || "";
    } catch {
        exp = "";
    }

    app.innerHTML += `
        <div class="card">

            <h3 style="color:${ok ? '#22c55e' : '#ef4444'}">

                ${ok ? "CORRECT" : "WARNING"}

            </h3>

            <p>${exp}</p>

            <button id="continueBtn" disabled>
                Narrating...
            </button>

        </div>
    `;

    speakFull(exp, unlockContinue);
}

/* =========================================================
   CONTINUE BUTTON UNLOCK
========================================================= */

function unlockContinue() {

    const btn = document.getElementById("continueBtn");

    if (!btn) return;

    btn.disabled = false;

    btn.innerText = "CONTINUE";

    btn.onclick = nextBlock;
}

/* =========================================================
   SPEECH SYSTEM
========================================================= */

function speakFull(text, callback = null) {

    if (!text) {

        if (callback) callback();

        return;
    }

    window.speechSynthesis.cancel();

    state.speaking = true;

    const utter = new SpeechSynthesisUtterance(text);

    utter.lang = "en-US";

    utter.rate = 0.92;

    utter.pitch = 1;

    utter.volume = 1;

    utter.onend = () => {

        state.speaking = false;

        if (callback) callback();
    };

    utter.onerror = () => {

        state.speaking = false;

        if (callback) callback();
    };

    window.speechSynthesis.speak(utter);
}

/* =========================================================
   BREATHING SYSTEM
========================================================= */

function startBreathing(duration, tx, inf) {

    stopBreathing();

    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");

    if (!circle || !label) return;

    let inhale = true;

    let elapsed = 0;

    const fullText = `${tx}. ${inf}`;

    speakFull(fullText);

    function animate() {

        if (inhale) {

            label.innerText = "INHALE";

            circle.style.transform = "scale(1.25)";

        } else {

            label.innerText = "EXHALE";

            circle.style.transform = "scale(0.8)";
        }

        inhale = !inhale;
    }

    animate();

    state.breathInterval = setInterval(() => {

        elapsed += 4;

        animate();

        if (elapsed >= duration) {

            stopBreathing();

            unlockContinue();
        }

    }, 4000);
}

/* =========================================================
   STOP BREATHING
========================================================= */

function stopBreathing() {

    if (state.breathInterval) {

        clearInterval(state.breathInterval);

        state.breathInterval = null;
    }
}

/* =========================================================
   DUPLICATE ENGINE PROTECTION
========================================================= */

if (window.__KAMIZEN_ENGINE_ACTIVE__) {

    console.warn("ENGINE DUPLICATE BLOCKED");

} else {

    window.__KAMIZEN_ENGINE_ACTIVE__ = true;
}
