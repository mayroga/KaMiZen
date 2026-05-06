/* =============================================================
   KAMIZEN ENGINE V8 - STABLE CONTROL SYSTEM
   FIXES:
   - No repetition bugs
   - Proper 1–35 loop sync with backend
   - Fixed breathing DOM destruction issue
   - Single render authority
   - Backend-driven index system
============================================================= */

const engine = {
    state: {
        stories: [],
        missions: [],
        index: 1,          // 🔥 GLOBAL 1–35 CONTROLLED BY BACKEND
        mode: "story",     // story | mission
        blockIndex: 0,
        loaded: false
    }
};

/* =========================
   INIT
========================= */
window.addEventListener("load", async () => {
    await loadData();
    await syncState();
    render();
});

/* =========================
   LOAD DATA
========================= */
async function loadData() {
    try {
        const [s, m] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);

        const storiesData = await s.json();
        const missionsData = await m.json();

        engine.state.stories = (storiesData.stories || []).sort((a,b)=>a.id-b.id);
        engine.state.missions = (missionsData.missions || []).sort((a,b)=>a.id-b.id);

        engine.state.loaded = true;

    } catch (e) {
        console.error("LOAD ERROR", e);
    }
}

/* =========================
   SYNC WITH BACKEND STATE
========================= */
async function syncState() {
    try {
        const res = await fetch("/api/state");
        const data = await res.json();

        if (data.index) {
            engine.state.index = data.index;
        }
    } catch (e) {
        console.warn("STATE SYNC FAILED");
    }
}

/* =========================
   SPEECH
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
    if (!app || !engine.state.loaded) {
        app.innerHTML = "<h3>Loading...</h3>";
        return;
    }

    const story = engine.state.stories[engine.state.index - 1];
    const mission = engine.state.missions[engine.state.index - 1];

    if (!story || !mission) {
        app.innerHTML = `
            <div class="card">
                <h2>COMPLETE LOOP</h2>
                <button onclick="resetLoop()">RESTART</button>
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

    /* TEXT */
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
                <div class="answer" onclick="answer(${i}, ${block.c})">
                    ${opt}
                </div>
            `;
        });
    }

    /* BREATHING FIX 🔥 (NO DOM BREAK) */
    if (block.t === "br" || block.t === "breath_auto") {
        html += `
            <div class="breath-wrapper">
                <div id="breathCircle" class="breath">
                    <span id="breathText">INHALE</span>
                </div>
                <p>${block.tx?.en || block.inf?.en || ""}</p>
            </div>
        `;

        setTimeout(() => startBreathing(block.d || 8), 100);
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

    html += `<button onclick="nextBlock()">CONTINUE</button></div>`;

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

    circle.style.transition = "transform 4s ease-in-out";

    const interval = setInterval(() => {
        const el = document.getElementById("breathCircle");
        if (!el) return clearInterval(interval);

        inhale = !inhale;

        if (inhale) {
            text.innerText = "INHALE";
            circle.style.transform = "scale(1.3)";
        } else {
            text.innerText = "EXHALE";
            circle.style.transform = "scale(0.7)";
        }
    }, 4000);

    setTimeout(() => clearInterval(interval), seconds * 1000);
}

/* =========================
   FLOW CONTROL
========================= */
async function startMission() {
    engine.state.mode = "mission";
    render();
}

function nextBlock() {
    engine.state.blockIndex++;

    const mission = engine.state.missions[engine.state.index - 1];

    if (!mission || engine.state.blockIndex >= mission.b.length) {
        nextMission();
        return;
    }

    render();
}

/* =========================
   NEXT MISSION (BACKEND SYNC)
========================= */
async function nextMission() {
    engine.state.blockIndex = 0;
    engine.state.mode = "story";

    try {
        const res = await fetch("/api/next", { method: "POST" });
        const data = await res.json();

        engine.state.index = data.index;

    } catch (e) {
        engine.state.index++;
        if (engine.state.index > 35) engine.state.index = 1;
    }

    render();
}

/* =========================
   RESET LOOP
========================= */
function resetLoop() {
    engine.state.index = 1;
    engine.state.mode = "story";
    engine.state.blockIndex = 0;

    fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: 1 })
    });

    render();
}

/* =========================
   ANSWER SYSTEM
========================= */
function answer(i, correct) {
    const mission = engine.state.missions[engine.state.index - 1];
    const block = mission?.b?.[engine.state.blockIndex];

    if (!block) return;

    const app = document.getElementById("app");

    const ok = i === correct;

    app.innerHTML += `
        <div class="feedback ${ok ? "success" : "error"}">
            ${ok ? "CORRECT" : "WRONG"} - ${block.ex?.[i] || ""}
        </div>
        <button onclick="nextBlock()">CONTINUE</button>
    `;
}

/* EXPOSE */
window.engine = {
    nextBlock,
    nextMission,
    startMission,
    resetLoop,
    state: engine.state
};
