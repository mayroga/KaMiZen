/* =============================================================
   KAMIZEN ENGINE V7 - FIXED ARCHITECTURE
   - Multi file missions support (01-07, 08-14, etc.)
   - Story → Mission sync strict
   - Fixed breathing UI rendering bug
   - Single source rendering control
============================================================= */

const engine = {
    state: {
        stories: [],
        missions: [],
        storyIndex: 0,
        missionIndex: 0,
        blockIndex: 0,
        mode: "story", // story | mission
        loaded: false
    }
};

/* =========================
   INIT
========================= */
window.addEventListener("load", async () => {
    await loadData();
    render();
});

/* =========================
   LOAD BACKEND DATA
========================= */
async function loadData() {
    try {
        const [s, m] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);

        const storiesData = await s.json();
        const missionsData = await m.json();

        engine.state.stories = (storiesData.stories || []).sort((a, b) => a.id - b.id);
        engine.state.missions = (missionsData.missions || []).sort((a, b) => a.id - b.id);

        engine.state.loaded = true;

    } catch (e) {
        console.error("ENGINE ERROR: cannot load data", e);
    }
}

/* =========================
   TEXT TO SPEECH
========================= */
function speak(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-US";
    window.speechSynthesis.speak(msg);
}

/* =========================
   MAIN RENDER
========================= */
function render() {
    const app = document.getElementById("app");
    if (!app) return;

    if (!engine.state.loaded) {
        app.innerHTML = `<h3>Loading system...</h3>`;
        return;
    }

    const story = engine.state.stories[engine.state.storyIndex];
    const mission = engine.state.missions[engine.state.missionIndex];

    if (!story || !mission) {
        app.innerHTML = `
            <div class="card">
                <h2>COMPLETE</h2>
                <p>All missions finished</p>
            </div>
        `;
        return;
    }

    /* =========================
       STORY MODE
    ========================= */
    if (engine.state.mode === "story") {
        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <p>${story.en}</p>
                <button onclick="startMission()">START MISSION</button>
            </div>
        `;

        speak(story.en);
        return;
    }

    /* =========================
       MISSION MODE
    ========================= */
    const block = mission.b[engine.state.blockIndex];

    if (!block) {
        nextMission();
        return;
    }

    let html = `<div class="card">`;

    /* TEXT BLOCKS */
    if (block.t === "v") {
        html += `<h3>${block.tx.en}</h3>`;
        speak(block.tx.en);
    }

    if (block.t === "h") {
        html += `<p>${block.tx.en}</p>`;
        speak(block.tx.en);
    }

    if (block.story) {
        html += `<p>${block.story.en}</p>`;
        speak(block.story.en);
    }

    /* QUESTION */
    if (block.t === "d") {
        html += `<div class="question">${block.q.en}</div>`;

        block.op.forEach((opt, i) => {
            html += `
                <div class="answer" onclick="answer(${i}, ${block.c}, ${engine.state.blockIndex})">
                    ${opt}
                </div>
            `;
        });
    }

    /* REWARD */
    if (block.t === "r") {
        html += `<div class="feedback success">+${block.p} XP</div>`;
    }

    /* CONCLUSION */
    if (block.t === "c") {
        html += `<div class="feedback">${block.tx.en}</div>`;
        speak(block.tx.en);
    }

    /* =========================
       BREATHING FIX (IMPORTANT)
       THIS WAS YOUR BUG
    ========================= */
    if (block.t === "br" || block.t === "breath_auto") {
        html += `
            <div class="breath-container">
                <div id="breathCircle" class="breath">
                    <span id="breathText">INHALE</span>
                </div>
                <p>${block.tx?.en || block.inf?.en || ""}</p>
            </div>
        `;

        setTimeout(() => startBreathing(block.d || 8), 100);
    }

    html += `
        <button onclick="nextBlock()">CONTINUE</button>
    </div>`;

    app.innerHTML = html;
}

/* =========================
   BREATHING SYSTEM FIXED
========================= */
function startBreathing(seconds = 8) {
    const circle = document.getElementById("breathCircle");
    const text = document.getElementById("breathText");

    if (!circle || !text) return;

    let inhale = true;

    circle.style.transition = "all 4s ease-in-out";

    const interval = setInterval(() => {

        if (!document.getElementById("breathCircle")) {
            clearInterval(interval);
            return;
        }

        inhale = !inhale;

        if (inhale) {
            text.innerText = "INHALE";
            circle.style.transform = "scale(1.3)";
        } else {
            text.innerText = "EXHALE";
            circle.style.transform = "scale(0.7)";
        }

    }, 4000);

    setTimeout(() => {
        clearInterval(interval);
    }, seconds * 1000);
}

/* =========================
   FLOW CONTROL
========================= */
function startMission() {
    engine.state.mode = "mission";
    render();
}

function nextBlock() {
    engine.state.blockIndex++;

    const mission = engine.state.missions[engine.state.missionIndex];

    if (engine.state.blockIndex >= mission.b.length) {
        nextMission();
        return;
    }

    render();
}

function nextMission() {
    engine.state.missionIndex++;
    engine.state.blockIndex = 0;
    engine.state.mode = "story";

    render();
}

/* =========================
   ANSWER SYSTEM
========================= */
function answer(i, correct, blockIndex) {
    const block = engine.state.missions[engine.state.missionIndex].b[blockIndex];

    if (!block || block.t !== "d") return;

    const app = document.getElementById("app");

    const result = (i === correct);

    app.innerHTML += `
        <div class="feedback ${result ? "success" : "error"}">
            ${result ? "CORRECT" : "WRONG"} - ${block.ex[i]}
        </div>
        <button onclick="nextBlock()">CONTINUE</button>
    `;
}

/* EXPOSE */
window.engine = {
    nextMission,
    nextBlock,
    state: engine.state
};
