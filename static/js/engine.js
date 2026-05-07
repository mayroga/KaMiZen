/* =========================================================
   KAMIZEN ENGINE V10 - FULL STABLE SYSTEM (FIXED BREATHING)
   ========================================================= */

let state = {
    stories: [],
    missions: [],
    currentIndex: 0,
    currentBlock: 0,
    phase: "loading",
    speechLocked: false,
    initialized: false
};

if (window.__KAMIZEN_ENGINE_ACTIVE__) {
    console.warn("KAMIZEN ENGINE ALREADY RUNNING");
} else {
    window.__KAMIZEN_ENGINE_ACTIVE__ = true;
}

window.addEventListener("load", async () => {
    await loadAllData();
    showIntro();
});

/* =========================
   LOAD DATA
========================= */

async function loadAllData() {

    const app = document.getElementById("app");

    app.innerHTML = `<div class="card"><h2>LOADING...</h2></div>`;

    try {

        const [storiesReq, missionsReq] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);

        const storiesData = await storiesReq.json();
        const missionsData = await missionsReq.json();

        state.stories = storiesData.stories || [];
        state.missions = missionsData.missions || [];

        state.initialized = true;

    } catch (err) {

        console.error(err);

        document.getElementById("app").innerHTML =
            `<div class="card"><h2>ERROR LOADING SYSTEM</h2></div>`;
    }
}

/* =========================
   INTRO
========================= */

function showIntro() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h1>KAMIZEN SYSTEM</h1>
            <p>Awareness • Focus • Control</p>
        </div>

        <button onclick="startSystem()">START</button>
    `;
}

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
        return render();
    }

    if (state.phase === "story") {

        app.innerHTML = `
            <div class="card">
                <h2>${story.t || ""}</h2>
                <p>${story.en || ""}</p>
            </div>

            <button id="continueBtn" disabled>NARRATING...</button>
        `;

        narrate(`${story.t}. ${story.en}`, () => {
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
   BLOCK RENDER
========================= */

function renderBlock(block) {

    const app = document.getElementById("app");

    let html = "";
    let narration = "";

    if (block.t === "v") {
        html += `<div class="card"><h2>${block.tx?.en}</h2></div>`;
        narration += block.tx?.en + ". ";
    }

    if (block.t === "h") {
        html += `<div class="card"><p>${block.tx?.en}</p></div>`;
        narration += block.tx?.en + ". ";
    }

    if (block.story) {
        html += `<div class="card"><p>${block.story.en}</p></div>`;
        narration += block.story.en + ". ";
    }

    /* =========================
       BREATHING FIXED (NEW CORE)
    ========================= */

    if (block.t === "br" || block.t === "breath_auto") {

        const duration = block.d || 4;

        html += `
        <div class="card breathing-card">

            <div class="breath-wrapper">
                <div id="breathCircle" class="breath-circle"></div>
                <div id="breathText">INHALE</div>
            </div>

            <h3>${block.tx?.en || ""}</h3>

            <p>${block.inf?.en || ""}</p>

        </div>
        `;

        narration += `${block.tx?.en}. ${block.inf?.en}.`;

        setTimeout(() => startBreathing(duration), 300);
    }

    if (block.t === "d") {

        html += `<div class="card"><h3>${block.q?.en}</h3>`;

        block.op.forEach((opt, i) => {

            html += `
                <div class="answer"
                onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g,'&quot;')})">
                    ${opt}
                </div>
            `;
        });

        html += `</div>`;
        narration += block.q?.en;
    }

    if (block.t === "sil") {

        html += `
            <div class="card">
                <h3>${block.tx?.en}</h3>
                <p>${block.inf?.en}</p>
            </div>
        `;

        narration += block.tx?.en;
    }

    if (block.t === "r") {

        html += `
            <div class="card">
                <h2>+${block.p} XP</h2>
            </div>
        `;
    }

    if (block.t === "c") {

        html += `<div class="card"><p>${block.tx?.en}</p></div>`;
    }

    html += `<button id="continueBtn" disabled>NARRATING...</button>`;

    app.innerHTML = html;

    narrate(narration, () => {
        unlockContinue("CONTINUE", nextBlock);
    });
}

/* =========================
   BREATHING ANIMATION (FIXED PRO)
========================= */

function startBreathing(duration = 4) {

    const circle = document.getElementById("breathCircle");
    const text = document.getElementById("breathText");

    if (!circle || !text) return;

    let inhale = true;
    let cycles = duration * 2;

    let i = 0;

    const interval = setInterval(() => {

        if (i >= cycles) {
            clearInterval(interval);
            return;
        }

        if (inhale) {

            text.innerText = "INHALE";
            circle.style.transform = "scale(1.3)";
            circle.style.boxShadow = "0 0 25px #00f2ff";

        } else {

            text.innerText = "EXHALE";
            circle.style.transform = "scale(0.8)";
            circle.style.boxShadow = "0 0 10px #00f2ff66";
        }

        inhale = !inhale;
        i++;

    }, 2000);
}

/* =========================
   NAVIGATION
========================= */

function nextBlock() {
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

    if (state.currentIndex >= state.stories.length) {
        state.currentIndex = 0;
    }

    state.phase = "story";
    state.currentBlock = 0;

    render();
}

/* =========================
   SPEECH
========================= */

function narrate(text, cb) {

    if (!text) return cb && cb();

    state.speechLocked = true;

    const s = new SpeechSynthesisUtterance(text);
    s.lang = "en-US";

    s.onend = () => {
        state.speechLocked = false;
        cb && cb();
    };

    speechSynthesis.cancel();
    speechSynthesis.speak(s);
}

/* =========================
   BUTTON
========================= */

function unlockContinue(label, action) {

    const btn = document.getElementById("continueBtn");
    if (!btn) return;

    btn.disabled = false;
    btn.innerText = label;
    btn.onclick = action;
}

/* =========================
   ANSWERS
========================= */

function selectAnswer(i, correct, ex) {

    const isCorrect = i === correct;

    alert(isCorrect ? "CORRECT" : "WRONG");

    nextBlock();
}
