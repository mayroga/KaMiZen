/* =============================================================
   KAMIZEN ENGINE V9 - SAFE BOOT SYSTEM
   FIXES:
   - No startup freeze
   - Safe API parsing
   - Default fallback state
   - Async-safe rendering
============================================================= */

const engine = {
    state: {
        stories: [],
        missions: [],
        index: 1,
        mode: "story",
        blockIndex: 0,
        loaded: false
    }
};

/* =========================
   SAFE INIT
========================= */
window.addEventListener("load", async () => {
    await boot();
});

/* =========================
   BOOT SEQUENCE (CRITICAL FIX)
========================= */
async function boot() {
    try {
        await loadData();
        await syncState();

        // 🔥 SAFE DEFAULT
        if (!engine.state.index || engine.state.index < 1) {
            engine.state.index = 1;
        }

        render();

    } catch (e) {
        console.error("BOOT FAILED", e);

        document.getElementById("app").innerHTML = `
            <div class="card">
                <h2>System Error</h2>
                <p>Backend not ready or data invalid</p>
            </div>
        `;
    }
}

/* =========================
   LOAD DATA SAFE
========================= */
async function loadData() {
    const app = document.getElementById("app");

    try {
        const resS = await fetch("/api/stories");
        const resM = await fetch("/api/missions");

        const storiesData = await resS.json();
        const missionsData = await resM.json();

        engine.state.stories = Array.isArray(storiesData.stories)
            ? storiesData.stories.sort((a,b)=>a.id-b.id)
            : [];

        engine.state.missions = Array.isArray(missionsData.missions)
            ? missionsData.missions.sort((a,b)=>a.id-b.id)
            : [];

        engine.state.loaded = true;

    } catch (e) {
        console.error("LOAD ERROR", e);

        if (app) {
            app.innerHTML = "<h3>Failed to load system data</h3>";
        }
    }
}

/* =========================
   SYNC SAFE STATE
========================= */
async function syncState() {
    try {
        const res = await fetch("/api/state");
        const data = await res.json();

        if (data && typeof data === "object") {
            if (typeof data.index === "number") {
                engine.state.index = data.index;
            }
        }

    } catch (e) {
        console.warn("STATE SYNC FAILED → using default index=1");
        engine.state.index = 1;
    }
}

/* =========================
   SAFE RENDER
========================= */
function render() {
    const app = document.getElementById("app");
    if (!app) return;

    if (!engine.state.loaded) {
        app.innerHTML = "<h3>Loading system...</h3>";
        return;
    }

    const idx = engine.state.index || 1;

    const story = engine.state.stories[idx - 1];
    const mission = engine.state.missions[idx - 1];

    /* SAFE GUARD */
    if (!story || !mission) {
        app.innerHTML = `
            <div class="card">
                <h2>Waiting Data Sync</h2>
                <p>Index: ${idx}</p>
                <button onclick="resetSystem()">RESET</button>
            </div>
        `;
        return;
    }

    /* STORY MODE */
    if (engine.state.mode === "story") {
        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <p>${story.en}</p>
                <button onclick="startMission()">START MISSION</button>
            </div>
        `;
        return;
    }

    /* MISSION MODE */
    const block = mission.b?.[engine.state.blockIndex];

    if (!block) {
        nextMission();
        return;
    }

    let html = `<div class="card">`;

    if (block.t === "v") html += `<h3>${block.tx.en}</h3>`;
    if (block.t === "h") html += `<p>${block.tx.en}</p>`;
    if (block.story) html += `<p>${block.story.en}</p>`;

    if (block.t === "d") {
        html += `<div>${block.q.en}</div>`;

        block.op.forEach((o, i) => {
            html += `
                <div class="answer" onclick="answer(${i}, ${block.c})">
                    ${o}
                </div>
            `;
        });
    }

    if (block.t === "br") {
        html += `
            <div class="breath">
                <span id="breathText">INHALE</span>
            </div>
        `;

        setTimeout(() => startBreathSafe(block.d || 8), 100);
    }

    html += `<button onclick="nextBlock()">CONTINUE</button></div>`;

    app.innerHTML = html;
}

/* =========================
   SAFE BREATHING (NO CRASH)
========================= */
function startBreathSafe(seconds) {
    const el = document.getElementById("breathText");
    if (!el) return;

    let inhale = true;

    const interval = setInterval(() => {
        const current = document.getElementById("breathText");
        if (!current) return clearInterval(interval);

        inhale = !inhale;
        current.innerText = inhale ? "INHALE" : "EXHALE";

    }, 4000);

    setTimeout(() => clearInterval(interval), seconds * 1000);
}

/* =========================
   FLOW CONTROL SAFE
========================= */
function startMission() {
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
   NEXT + LOOP SAFE
========================= */
async function nextMission() {
    engine.state.blockIndex = 0;
    engine.state.mode = "story";

    try {
        const res = await fetch("/api/next", { method: "POST" });
        const data = await res.json();

        engine.state.index = data.index || 1;

    } catch (e) {
        engine.state.index++;

        if (engine.state.index > 35) {
            engine.state.index = 1;
        }
    }

    render();
}

/* =========================
   RESET SYSTEM
========================= */
function resetSystem() {
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
   ANSWER SAFE
========================= */
function answer(i, correct) {
    const mission = engine.state.missions[engine.state.index - 1];
    const block = mission?.b?.[engine.state.blockIndex];

    if (!block) return;

    alert(i === correct ? "CORRECT" : "WRONG");
}

/* EXPOSE */
window.engine = {
    startMission,
    nextBlock,
    nextMission,
    resetSystem,
    state: engine.state
};
