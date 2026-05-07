/* =========================================================
   KAMIZEN ENGINE V10 - FULL STABLE SYSTEM + EXAM MODE
========================================================= */

let state = {
    stories: [],
    missions: [],
    exam: [],

    currentIndex: 0,
    currentBlock: 0,

    phase: "loading", // loading | intro | story | mission | exam

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
   LOAD DATA (CORE + EXAM)
========================= */

async function loadAllData() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h2>LOADING SYSTEM...</h2>
        </div>
    `;

    try {

        const [storiesReq, missionsReq, examReq] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions"),
            fetch("/api/exam")
        ]);

        const storiesData = await storiesReq.json();
        const missionsData = await missionsReq.json();
        const examData = await examReq.json();

        state.stories = (storiesData.stories || []).sort((a,b)=>a.id-b.id);

        state.missions = (missionsData.missions || []).sort((a,b)=>a.id-b.id);

        state.exam = (examData.missions || []).sort((a,b)=>a.id-b.id);

        state.initialized = true;

        console.log("STORIES:", state.stories.length);
        console.log("MISSIONS:", state.missions.length);
        console.log("EXAM:", state.exam.length);

    } catch (err) {

        console.error("LOAD ERROR:", err);

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
            <p>Awareness • Control • Focus</p>
        </div>

        <button onclick="startSystem()">START SYSTEM</button>

        <button style="margin-top:10px;background:#22c55e"
                onclick="startExamMode()">
            HOW TO REACT BEFORE & DURING EXAMS
        </button>
    `;
}

/* =========================
   START SYSTEM
========================= */

function startSystem() {

    state.phase = "story";
    state.currentIndex = 0;
    state.currentBlock = 0;

    render();
}

/* =========================
   EXAM MODE START
========================= */

function startExamMode() {

    state.phase = "exam";
    state.currentIndex = 0;
    state.currentBlock = 0;

    render();
}

/* =========================
   RENDER CONTROLLER
========================= */

function render() {

    if (!state.initialized) return;

    const app = document.getElementById("app");

    let data = [];

    if (state.phase === "story") data = state.stories;
    if (state.phase === "mission") data = state.missions;
    if (state.phase === "exam") data = state.exam;

    const item = data[state.currentIndex];

    if (!item) {
        state.currentIndex = 0;
        state.currentBlock = 0;
        return render();
    }

    if (state.phase === "story") renderStory(item);
    else renderMission(item);
}

/* =========================
   STORY
========================= */

function renderStory(story) {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h2>STORY ${story.id}</h2>
            <p>${story.en || ""}</p>
        </div>

        <button id="continueBtn" disabled>NARRATING...</button>
    `;

    narrate(story.en || "", () => {
        unlockContinue("START", () => {
            state.phase = "mission";
            state.currentBlock = 0;
            render();
        });
    });
}

/* =========================
   MISSION / EXAM (SAME ENGINE)
========================= */

function renderMission(item) {

    const block = item.b[state.currentBlock];

    if (!block) {
        nextItem();
        return;
    }

    let html = "";
    let text = "";

    if (block.t === "v") {
        html += `<div class="card"><h2>${block.tx.en}</h2></div>`;
        text += block.tx.en + ". ";
    }

    if (block.t === "h") {
        html += `<div class="card"><p>${block.tx.en}</p></div>`;
        text += block.tx.en + ". ";
    }

    if (block.story) {
        html += `<div class="card"><p>${block.story.en}</p></div>`;
        text += block.story.en + ". ";
    }

    if (block.t === "breath_auto") {
        html += `
        <div class="card">
            <div class="breath-circle" id="breathCircle">
                <span id="breathLabel">INHALE</span>
            </div>
            <p>${block.tx.en}</p>
        </div>`;
        text += block.tx.en + ". " + block.inf.en;
    }

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q.en}</h3>`;

        block.op.forEach((op, i) => {
            html += `
                <div class="answer" onclick="selectAnswer(${i},${block.c},${JSON.stringify(block.ex).replace(/"/g,'&quot;')})">
                    ${op}
                </div>`;
        });

        html += `</div>`;

        text += block.q.en;
    }

    if (block.t === "sil") {
        html += `<div class="card"><p>${block.tx.en}</p></div>`;
        text += block.tx.en;
    }

    if (block.t === "r") {
        html += `<div class="card"><h3>${block.tx}</h3><p>+${block.p} XP</p></div>`;
        text += block.tx;
    }

    document.getElementById("app").innerHTML = html;

    if (block.t === "breath_auto") startBreathingAnimation();

    narrate(text, () => {
        unlockContinue("CONTINUE", nextBlock);
    });
}

/* =========================
   NAVIGATION
========================= */

function nextBlock() {
    state.currentBlock++;
    render();
}

function nextItem() {
    state.currentIndex++;
    state.currentBlock = 0;
    render();
}

/* =========================
   ANSWERS
========================= */

function selectAnswer(i, correct, ex) {

    const ok = i === correct;

    narrate(ex[i] || "", () => {
        nextBlock();
    });
}

/* =========================
   CONTINUE BUTTON
========================= */

function unlockContinue(label, fn) {

    const btn = document.getElementById("continueBtn");
    if (!btn) return;

    btn.disabled = false;
    btn.innerText = label;
    btn.onclick = fn;
}

/* =========================
   SPEECH
========================= */

function narrate(text, cb) {

    if (!text) return cb?.();

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.92;

    u.onend = () => cb?.();

    window.speechSynthesis.speak(u);
}

/* =========================
   BREATHING
========================= */

function startBreathingAnimation() {

    const c = document.getElementById("breathCircle");
    const l = document.getElementById("breathLabel");

    if (!c || !l) return;

    let inb = true;

    setInterval(() => {

        if (inb) {
            l.innerText = "INHALE";
            c.style.transform = "scale(1.2)";
        } else {
            l.innerText = "EXHALE";
            c.style.transform = "scale(0.8)";
        }

        inb = !inb;

    }, 4000);
}
