/* =============================================================
   KAMIZEN ENGINE V7 - STABLE SYNCHRONIZED SYSTEM
   FIXED: story-mission sync, breathing UI, safety parsing
   ============================================================= */

let state = {
    name: "",
    step: "welcome",
    index: 0,
    bIndex: 0,
    subStep: "story",
    stories: [],
    missions: [],
    initialized: false
};

window.addEventListener("load", async () => {
    await loadData();
    render();
});

/* =========================
   DATA LOADER SAFE
========================= */
async function loadData() {
    try {
        const [sRes, mRes] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);

        const sData = await sRes.json();
        const mData = await mRes.json();

        state.stories = Array.isArray(sData.stories)
            ? sData.stories.sort((a, b) => a.id - b.id)
            : [];

        state.missions = Array.isArray(mData.missions)
            ? mData.missions.sort((a, b) => a.id - b.id)
            : [];

        console.log("✔ STORIES:", state.stories.length);
        console.log("✔ MISSIONS:", state.missions.length);

        state.initialized = true;

    } catch (err) {
        console.error("❌ DATA LOAD ERROR:", err);
    }
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
   SAFE RENDER ENGINE
========================= */
function render() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = "";

    /* -------------------------
       WELCOME SCREEN
    ------------------------- */
    if (state.step === "welcome") {
        app.innerHTML = `
            <h1>KAMIZEN LIFE SAFETY</h1>
            <div class="card">
                <p>Enter your name to begin training system</p>
                <input id="nameInput" type="text" placeholder="Your Name" />
            </div>
            <button class="primary" onclick="startApp()">START</button>
        `;
        return;
    }

    /* -------------------------
       SAFETY INDEX CHECK
    ------------------------- */
    const currentStory = state.stories.find(s => s.id === state.index + 1);
    const currentMission = state.missions.find(m => m.id === state.index + 1);

    if (!currentStory || !currentMission) {
        app.innerHTML = `
            <h2>PROTOCOL COMPLETED</h2>
            <p>All missions finished successfully.</p>
            <button class="primary" onclick="location.reload()">RESTART</button>
        `;
        return;
    }

    /* -------------------------
       STORY PHASE
    ------------------------- */
    if (state.subStep === "story") {
        app.innerHTML = `
            <h3>STORY ${currentStory.id}</h3>
            <div class="card">
                <p>${currentStory.en}</p>
            </div>
            <button class="primary" onclick="startMission()">START MISSION</button>
        `;

        speak(currentStory.en);
        return;
    }

    /* -------------------------
       MISSION PHASE
    ------------------------- */
    if (state.subStep === "blocks") {
        const block = currentMission.b[state.bIndex];

        if (!block) {
            nextMission();
            return;
        }

        renderBlock(block, currentMission.b.length);
    }
}

/* =========================
   BLOCK RENDER
========================= */
function renderBlock(block, total) {
    const app = document.getElementById("app");
    let html = "";
    const type = block.t;

    switch (type) {

        case "v":
            html = `<h2>${block.tx.en}</h2>`;
            speak(block.tx.en);
            break;

        case "h":
            html = `<div class="card">${block.tx.en}</div>`;
            speak(block.tx.en);
            break;

        case "story":
            html = `<div class="card">${block.story.en}</div>`;
            speak(block.story.en);
            break;

        /* =========================
           BREATHING FIXED VISUAL
        ========================= */
        case "br":
        case "breath_auto":
            html = `
                <div class="circle-container">
                    <div id="respiratoryCircle" class="circle blue-breath">
                        <span id="breathAction">INHALE</span>
                    </div>
                </div>
                <div class="card">
                    <p>${block.tx?.en || block.inf?.en || ""}</p>
                </div>
            `;

            app.innerHTML = html;

            setTimeout(() => startAutoBreath(block.d || 8), 80);
            return;

        case "d":
            html = `
                <div class="card">
                    <h3>${block.q.en}</h3>
                    ${block.op.map((opt, i) => `
                        <div class="answer" onclick="handleDecision(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})">
                            ${opt}
                        </div>
                    `).join("")}
                    <div id="feedback"></div>
                </div>
            `;
            app.innerHTML = html;
            speak(block.q.en);
            return;

        case "sil":
            html = `<div class="card">🧘 ${block.tx.en}</div>`;
            speak(block.tx.en);
            break;

        case "r":
            html = `<div class="card">⭐ +${block.p} ${block.tx.en}</div>`;
            break;

        case "c":
            html = `<div class="card">${block.tx.en}</div>`;
            speak(block.tx.en);
            break;
    }

    app.innerHTML = html + `<button class="primary" onclick="nextBlock()">CONTINUE</button>`;
}

/* =========================
   FLOW CONTROL
========================= */
function startApp() {
    const val = document.getElementById("nameInput").value;
    if (!val) return;

    state.name = val;
    state.step = "training";
    state.subStep = "story";
    render();
}

function startMission() {
    state.subStep = "blocks";
    state.bIndex = 0;
    render();
}

function nextBlock() {
    const mission = state.missions.find(m => m.id === state.index + 1);

    if (!mission) return;

    if (state.bIndex < mission.b.length - 1) {
        state.bIndex++;
    } else {
        nextMission();
    }

    render();
}

function nextMission() {
    state.index++;
    state.subStep = "story";
    state.bIndex = 0;
    render();
}

/* =========================
   DECISION SYSTEM
========================= */
function handleDecision(idx, correct, explanations) {
    const fb = document.getElementById("feedback");
    const isCorrect = idx === correct;

    fb.innerHTML = `
        <div class="card">
            <p>${isCorrect ? "CORRECT" : "INCORRECT"}</p>
            <p>${explanations[idx]}</p>
            <button class="primary" onclick="nextBlock()">CONTINUE</button>
        </div>
    `;

    speak(explanations[idx]);
}

/* =========================
   BREATHING ENGINE FIXED
========================= */
function startAutoBreath(seconds) {
    let isInhale = true;
    const circle = document.getElementById("respiratoryCircle");
    const label = document.getElementById("breathAction");

    if (!circle || !label) return;

    circle.style.transition = "transform 4s ease-in-out";

    function cycle() {
        if (!document.getElementById("respiratoryCircle")) return;

        if (isInhale) {
            circle.style.transform = "scale(1.3)";
            label.innerText = "INHALE";
            speak("inhale");
        } else {
            circle.style.transform = "scale(0.7)";
            label.innerText = "EXHALE";
            speak("exhale");
        }

        isInhale = !isInhale;
    }

    cycle();

    const interval = setInterval(() => {
        if (!document.getElementById("respiratoryCircle")) {
            clearInterval(interval);
            return;
        }

        cycle();
    }, 4000);

    setTimeout(() => {
        clearInterval(interval);
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML += `<button class="primary" onclick="nextBlock()">CONTINUE</button>`;
        }
    }, seconds * 1000);
}
