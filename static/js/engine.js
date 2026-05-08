/* =========================================================
   KAMIZEN ENGINE V11 - AUTO FLOW + CONTROL HYBRID SYSTEM
   ✔ Auto play with speech + 2s delay
   ✔ Manual control ONLY for breathing + questions
   ✔ Start button remains manual
   ✔ End-of-block controls: continue / skip / restart
   ✔ No freeze / no double render / speech lock safe
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

        state.stories = (storiesData.stories || []).sort((a,b)=>a.id-b.id);
        state.missions = (missionsData.missions || []).sort((a,b)=>a.id-b.id);

        state.initialized = true;

    } catch (err) {

        console.error(err);

        app.innerHTML = `
            <div class="card">
                <h2>SYSTEM ERROR</h2>
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

            <p style="opacity:.8;">
                Stories + Missions Active
            </p>
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
   AUTO DELAY (CRITICAL RULE)
========================= */

function autoNext(callback) {

    setTimeout(() => {

        if (!state.speechLocked) {
            callback();
        }

    }, 2000); // 🧠 2 seconds AFTER voice ends
}

/* =========================
   RENDER
========================= */

function render() {

    if (!state.initialized) return;

    const app = document.getElementById("app");

    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    if (!story || !mission) {
        state.currentIndex = 0;
        state.currentBlock = 0;
        return render();
    }

    /* =========================
       STORY
    ========================= */

    if (state.phase === "story") {

        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <h3>${story.t}</h3>
                <p>${story.en}</p>
            </div>
        `;

        narrate(`${story.t}. ${story.en}`, () => {

            autoNext(() => {
                startMission();
            });

        });

        return;
    }

    /* =========================
       MISSION
    ========================= */

    const block = mission.b[state.currentBlock];

    if (!block) {
        nextStory();
        return;
    }

    renderBlock(block);
}

/* =========================
   BLOCK RENDER
========================= */

function renderBlock(block) {

    const app = document.getElementById("app");

    let html = "";
    let narration = "";

    const isControl =
        block.t === "d" ||
        block.t === "breath_auto" ||
        block.t === "br";

    /* =========================
       VISUAL / TEXT AUTO
    ========================= */

    if (block.t === "v" || block.t === "h" || block.story || block.t === "sil" || block.t === "r") {

        html += `<div class="card">`;

        html += `<p>${block.tx?.en || block.story?.en || block.inf?.en || ""}</p>`;

        html += `</div>`;

        narration += `${block.tx?.en || block.story?.en || ""}.`;
    }

    /* =========================
       BREATHING (MANUAL CONTROL)
    ========================= */

    if (block.t === "breath_auto" || block.t === "br") {

        html += `
        <div class="card center">

            <div class="breath-circle" id="breathCircle">
                <span id="breathLabel">INHALE</span>
            </div>

            <h3>${block.tx?.en}</h3>
            <p>${block.inf?.en}</p>

            ${controls()}
        </div>`;

        startBreathingAnimation();
    }

    /* =========================
       QUESTION (MANUAL CONTROL)
    ========================= */

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q?.en}</h3>`;

        block.op.forEach((o,i)=>{

            html += `
                <div class="answer" onclick="selectAnswer(${i},${block.c},${JSON.stringify(block.ex).replace(/"/g,'&quot;')})">
                    ${o}
                </div>
            `;
        });

        html += controls();
        html += `</div>`;
    }

    app.innerHTML = html;

    /* =========================
       AUTO FLOW RULE
    ========================= */

    if (!isControl) {

        narrate(narration, () => {

            autoNext(() => {
                nextBlock();
            });

        });

    } else {

        narrate(narration);
    }
}

/* =========================
   CONTROLS UI
========================= */

function controls() {
    return `
    <div style="margin-top:15px;">
        <button onclick="nextBlock()">CONTINUE</button>
        <button onclick="nextStory()">SKIP</button>
        <button onclick="restartSystem()">RESTART</button>
    </div>`;
}

/* =========================
   ANSWERS
========================= */

function selectAnswer(i, correct, ex) {

    const ok = i === correct;

    narrate(ex[i] || "", () => {

        autoNext(() => {
            nextBlock();
        });

    });
}

/* =========================
   NAVIGATION
========================= */

function nextBlock() {
    state.currentBlock++;
    render();
}

function nextStory() {
    state.currentIndex++;
    state.currentBlock = 0;
    state.phase = "story";
    render();
}

function restartSystem() {
    state.currentIndex = 0;
    state.currentBlock = 0;
    state.phase = "story";
    render();
}

function startMission() {
    state.phase = "mission";
    state.currentBlock = 0;
    render();
}

/* =========================
   SPEECH ENGINE
========================= */

function narrate(text, cb) {

    if (!text) return cb?.();

    state.speechLocked = true;

    window.speechSynthesis.cancel();

    const s = new SpeechSynthesisUtterance(text);

    s.rate = 0.92;

    s.onend = () => {
        state.speechLocked = false;
        cb?.();
    };

    speechSynthesis.speak(s);
}

/* =========================
   BREATHING
========================= */

function startBreathingAnimation() {

    const c = document.getElementById("breathCircle");
    const l = document.getElementById("breathLabel");

    if (!c || !l) return;

    let inhale = true;

    setInterval(()=>{

        inhale = !inhale;

        l.innerText = inhale ? "INHALE" : "EXHALE";

        c.style.transform = inhale ? "scale(1.2)" : "scale(0.85)";

    },4000);
}
