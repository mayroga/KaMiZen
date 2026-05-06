/* =========================================================
   KAMIZEN ENGINE V7 - STABLE CORE (NO FREEZE VERSION)
   CONTROL: SINGLE FLOW ENGINE
   ========================================================= */

let state = {
    stories: [],
    missions: [],
    index: 0,
    step: "story",
    bIndex: 0,
    ready: false
};

/* =========================
   INIT SYSTEM
========================= */

window.addEventListener("load", async () => {
    await loadData();
    render();
});

async function loadData() {
    try {
        const [s, m] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);

        const sd = await s.json();
        const md = await m.json();

        state.stories = (sd.stories || []).sort((a, b) => a.id - b.id);

        // missions vienen como {missions: []}
        state.missions = (md.missions || []).sort((a, b) => a.id - b.id);

        state.ready = true;

    } catch (err) {
        console.error("ENGINE ERROR: DATA LOAD FAILED", err);
    }
}

/* =========================
   MAIN RENDER ENGINE
========================= */

function render() {
    const app = document.getElementById("screen") || document.getElementById("app");
    if (!app) return;

    if (!state.ready) {
        app.innerHTML = `
            <h3>Loading...</h3>
            <p>System initializing</p>
        `;
        return;
    }

    const story = state.stories[state.index];
    const mission = state.missions[state.index];

    // RESET LOOP (1 → 35 → 1)
    if (!story || !mission) {
        state.index = 0;
        state.step = "story";
        state.bIndex = 0;
        return render();
    }

    /* =========================
       STORY MODE
    ========================= */

    if (state.step === "story") {
        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <p>${story.en}</p>
            </div>

            <button onclick="startMission()">START MISSION</button>
        `;

        speak(story.en);
        return;
    }

    /* =========================
       MISSION MODE
    ========================= */

    if (state.step === "mission") {
        const block = mission.b[state.bIndex];

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

function renderBlock(b) {
    const app = document.getElementById("screen") || document.getElementById("app");

    let html = "";

    /* VISUAL BLOCK */
    if (b.t === "v") {
        html += `<div class="card"><h2>${b.tx.en}</h2></div>`;
        speak(b.tx.en);
    }

    /* HEADER BLOCK */
    if (b.t === "h") {
        html += `<div class="card"><p>${b.tx.en}</p></div>`;
        speak(b.tx.en);
    }

    /* STORY BLOCK INSIDE MISSION */
    if (b.story) {
        html += `<div class="card"><p>${b.story.en}</p></div>`;
        speak(b.story.en);
    }

    /* QUESTION BLOCK */
    if (b.t === "d") {
        html += `
        <div class="card">
            <p>${b.q.en}</p>
        `;

        b.op.forEach((opt, i) => {
            html += `
                <div class="answer" onclick="answer(${i},${b.c},${JSON.stringify(b.ex).replace(/"/g, '&quot;')})">
                    ${opt}
                </div>
            `;
        });

        html += `</div>`;
    }

    /* BREATHING BLOCK */
    if (b.t === "br" || b.t === "breath_auto") {
        html += `
        <div class="card center">
            <div class="breath-circle">
                <span>FOCUS</span>
            </div>
            <p>${b.tx?.en || b.inf?.en || ""}</p>
        </div>`;
    }

    /* SILENCE BLOCK */
    if (b.t === "sil") {
        html += `
        <div class="card">
            <h3>${b.tx.en}</h3>
            <p>${b.inf?.en || ""}</p>
        </div>`;
    }

    /* REWARD BLOCK */
    if (b.t === "r") {
        html += `
        <div class="card" style="color:#22c55e;">
            ⭐ +${b.p} XP
        </div>`;
    }

    /* CONCLUSION */
    if (b.t === "c") {
        html += `
        <div class="card">
            <p>${b.tx.en}</p>
        </div>`;
        speak(b.tx.en);
    }

    html += `<button onclick="nextBlock()">CONTINUE</button>`;

    app.innerHTML = html;
}

/* =========================
   CONTROL FLOW
========================= */

function startMission() {
    state.step = "mission";
    state.bIndex = 0;
    render();
}

function nextBlock() {
    state.bIndex++;
    render();
}

function nextStory() {
    state.index++;

    if (state.index >= state.stories.length) {
        state.index = 0; // LOOP CLEAN 1→35→1
    }

    state.step = "story";
    state.bIndex = 0;

    render();
}

/* =========================
   ANSWER SYSTEM
========================= */

function answer(i, correct, explanations) {
    const app = document.getElementById("screen") || document.getElementById("app");

    const isCorrect = i === correct;
    const msg = explanations?.[i] || "";

    app.innerHTML += `
        <div class="card" style="color:${isCorrect ? '#22c55e' : '#ef4444'};">
            ${isCorrect ? "CORRECT" : "WRONG"}<br>
            ${msg}
        </div>

        <button onclick="nextBlock()">CONTINUE</button>
    `;

    speak(msg);
}

/* =========================
   SPEECH ENGINE
========================= */

function speak(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-US";
    window.speechSynthesis.speak(msg);
}

/* =========================
   SAFETY: PREVENT DOUBLE ENGINE
========================= */

if (window.__KAMIZEN_ENGINE_LOADED__) {
    console.warn("ENGINE DUPLICATED - BLOCKED");
} else {
    window.__KAMIZEN_ENGINE_LOADED__ = true;
}
