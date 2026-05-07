/* =========================================================
   KAMIZEN ENGINE V12 - FULL STABLE SYSTEM
   ✔ Core System 1-35
   ✔ Exam Mode 36-49
   ✔ Male Voice Restored
   ✔ Correct/Wrong Colors Restored
   ✔ No Frozen Buttons
   ✔ No Double Render
   ✔ Stable Breathing System
========================================================= */

let state = {
    stories: [],
    missions: [],

    currentIndex: 0,
    currentBlock: 0,

    phase: "intro",

    speechLocked: false,
    initialized: false,

    examMode: false,
    examData: [],
    examIndex: 0,
    examBlock: 0,

    breathingInterval: null,
    selectedVoice: null
};

/* =========================
   ENGINE LOCK
========================= */

if (window.__KAMIZEN_ENGINE_ACTIVE__) {
    console.warn("ENGINE ALREADY ACTIVE");
} else {
    window.__KAMIZEN_ENGINE_ACTIVE__ = true;
}

/* =========================
   INIT
========================= */

window.addEventListener("load", async () => {

    initVoices();

    await loadAllData();

    showIntro();
});

/* =========================
   VOICES
========================= */

function initVoices() {

    function loadVoices() {

        const voices = speechSynthesis.getVoices();

        state.selectedVoice =
            voices.find(v =>
                v.lang.includes("en") &&
                (
                    v.name.toLowerCase().includes("david") ||
                    v.name.toLowerCase().includes("mark") ||
                    v.name.toLowerCase().includes("male") ||
                    v.name.toLowerCase().includes("guy")
                )
            ) || voices.find(v => v.lang.includes("en"));
    }

    loadVoices();

    speechSynthesis.onvoiceschanged = loadVoices;
}

/* =========================
   LOAD DATA
========================= */

async function loadAllData() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card center">
            <h2>LOADING SYSTEM...</h2>
            <p>Initializing missions</p>
        </div>
    `;

    try {

        const [storiesReq, missionsReq] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);

        const storiesData = await storiesReq.json();
        const missionsData = await missionsReq.json();

        state.stories = Array.isArray(storiesData.stories)
            ? storiesData.stories.sort((a,b)=>a.id-b.id)
            : [];

        state.missions = Array.isArray(missionsData.missions)
            ? missionsData.missions.sort((a,b)=>a.id-b.id)
            : [];

        state.initialized = true;

    } catch(err){

        console.error(err);

        app.innerHTML = `
            <div class="card center">
                <h2>SYSTEM ERROR</h2>
                <p>Failed loading data</p>
            </div>
        `;
    }
}

/* =========================
   INTRO
========================= */

function showIntro() {

    clearBreathing();

    state.examMode = false;

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card center">

            <h1>KAMIZEN LIFE SYSTEM</h1>

            <p>
                Awareness • Control • Safety • Focus
            </p>

            <p class="small">
                35 Life Missions • Optional Exam Training
            </p>

        </div>

        <button onclick="startSystem()">
            START SYSTEM
        </button>

        <button onclick="loadExamMode()">
            HOW TO REACT BEFORE & DURING EXAMS
        </button>
    `;
}

/* =========================
   START CORE SYSTEM
========================= */

function startSystem() {

    state.examMode = false;

    state.currentIndex = 0;
    state.currentBlock = 0;

    state.phase = "story";

    render();
}

/* =========================
   START EXAM MODE
========================= */

async function loadExamMode() {

    try {

        const app = document.getElementById("app");

        app.innerHTML = `
            <div class="card center">
                <h2>LOADING EXAM MODE...</h2>
            </div>
        `;

        const [r1, r2] = await Promise.all([
            fetch("/static/exam36-42.json"),
            fetch("/static/exam43-49.json")
        ]);

        const d1 = await r1.json();
        const d2 = await r2.json();

        state.examMode = true;

        state.examData = [
            ...(d1.missions || []),
            ...(d2.missions || [])
        ];

        state.examIndex = 0;
        state.examBlock = 0;

        renderExam();

    } catch(err){

        console.error("EXAM LOAD ERROR:", err);

        showIntro();
    }
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

        return render();
    }

    if (state.phase === "story") {

        app.innerHTML = `
            <div class="card">

                <h2>STORY ${story.id}</h2>

                <h3>${story.t || ""}</h3>

                <p>${story.en || ""}</p>

            </div>

            <button id="continueBtn" disabled>
                NARRATING...
            </button>
        `;

        narrate(
            `${story.t || ""}. ${story.en || ""}`,
            () => unlockContinue(
                "START MISSION",
                startMission
            )
        );

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
   RENDER EXAM
========================= */

function renderExam() {

    const app = document.getElementById("app");

    const mission = state.examData[state.examIndex];

    if (!mission) {

        showIntro();

        return;
    }

    const block = mission.b[state.examBlock];

    if (!block) {

        state.examIndex++;
        state.examBlock = 0;

        renderExam();

        return;
    }

    renderBlock(block, true);
}

/* =========================
   BLOCK RENDER
========================= */

function renderBlock(block, exam=false) {

    clearBreathing();

    const app = document.getElementById("app");

    let html = "";
    let narration = "";

    /* TITLE */

    if (block.t === "v") {

        html += `
            <div class="card">
                <h2>${block.tx?.en || ""}</h2>
            </div>
        `;

        narration += `${block.tx?.en || ""}. `;
    }

    /* HEADER */

    if (block.t === "h") {

        html += `
            <div class="card">
                <p>${block.tx?.en || ""}</p>
            </div>
        `;

        narration += `${block.tx?.en || ""}. `;
    }

    /* STORY */

    if (block.story) {

        html += `
            <div class="card">
                <p>${block.story.en || ""}</p>
            </div>
        `;

        narration += `${block.story.en || ""}. `;
    }

    /* BREATH */

    if (block.t === "breath_auto" || block.t === "br") {

        html += `
            <div class="card center">

                <div class="breath-circle" id="breathCircle">

                    <span id="breathLabel">
                        INHALE
                    </span>

                </div>

                <h3>${block.tx?.en || ""}</h3>

                <p>${block.inf?.en || ""}</p>

                <div class="timer">
                    ${block.d || 30}s
                </div>

            </div>
        `;

        narration += `
            ${block.tx?.en || ""}.
            ${block.inf?.en || ""}.
        `;
    }

    /* QUESTION */

    if (block.t === "d") {

        html += `
            <div class="card">

                <h3>${block.q?.en || ""}</h3>
        `;

        narration += `${block.q?.en || ""}. `;

        block.op.forEach((option,index)=>{

            html += `
                <div class="answer"
                    onclick='selectAnswer(
                        ${index},
                        ${block.c},
                        ${JSON.stringify(block.ex)}
                    )'>
                    ${option}
                </div>
            `;

            narration += `${option}. `;
        });

        html += `</div>`;
    }

    /* SILENCE */

    if (block.t === "sil") {

        html += `
            <div class="card center">

                <h3>${block.tx?.en || ""}</h3>

                <p>${block.inf?.en || ""}</p>

                <div class="timer">
                    ${block.d || 30}s
                </div>

            </div>
        `;

        narration += `
            ${block.tx?.en || ""}.
            ${block.inf?.en || ""}.
        `;
    }

    /* REWARD */

    if (block.t === "r") {

        html += `
            <div class="card center">

                <h2 style="color:#22c55e;">
                    ⭐ ${block.tx || ""}
                </h2>

                <p>+${block.p || 0} XP</p>

            </div>
        `;

        narration += `${block.tx || ""}`;
    }

    /* CONCLUSION */

    if (block.t === "c") {

        html += `
            <div class="card">
                <p>${block.tx?.en || ""}</p>
            </div>
        `;

        narration += `${block.tx?.en || ""}`;
    }

    /* CONTINUE */

    if (block.t !== "d") {

        html += `
            <button id="continueBtn" disabled>
                NARRATING...
            </button>
        `;
    }

    app.innerHTML = html;

    /* START BREATHING */

    if (block.t === "breath_auto" || block.t === "br") {
        startBreathingAnimation();
    }

    /* NARRATION */

    narrate(narration, ()=>{

        if (block.t !== "d") {

            unlockContinue(
                "CONTINUE",
                ()=>{
                    if (exam) {
                        state.examBlock++;
                        renderExam();
                    } else {
                        nextBlock();
                    }
                }
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

    const ok = index === correct;

    const explanation = explanations?.[index] || "";

    app.innerHTML += `

        <div class="card center">

            <h2 style="
                color:${ok ? '#22c55e' : '#ef4444'};
            ">
                ${ok ? 'CORRECT' : 'WRONG'}
            </h2>

            <p>${explanation}</p>

        </div>

        <button id="continueBtn" disabled>
            NARRATING...
        </button>
    `;

    narrate(explanation, ()=>{

        unlockContinue(
            "CONTINUE",
            ()=>{

                if (state.examMode) {

                    state.examBlock++;
                    renderExam();

                } else {

                    nextBlock();
                }
            }
        );
    });
}

/* =========================
   START MISSION
========================= */

function startMission() {

    state.phase = "mission";

    state.currentBlock = 0;

    render();
}

/* =========================
   NEXT BLOCK
========================= */

function nextBlock() {

    state.currentBlock++;

    render();
}

/* =========================
   NEXT STORY
========================= */

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
   NARRATION
========================= */

function narrate(text, callback=null) {

    if (!text) {

        if (callback) callback();

        return;
    }

    state.speechLocked = true;

    speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-US";

    speech.rate = 0.9;
    speech.pitch = 0.9;
    speech.volume = 1;

    if (state.selectedVoice) {
        speech.voice = state.selectedVoice;
    }

    speech.onend = ()=>{

        state.speechLocked = false;

        if (callback) callback();
    };

    speech.onerror = ()=>{

        state.speechLocked = false;

        if (callback) callback();
    };

    speechSynthesis.speak(speech);
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
   BREATHING
========================= */

function clearBreathing() {

    if (state.breathingInterval) {

        clearInterval(state.breathingInterval);

        state.breathingInterval = null;
    }
}

function startBreathingAnimation() {

    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");

    if (!circle || !label) return;

    let inhale = true;

    circle.style.transition = "all 4s ease-in-out";

    function animate() {

        if (!document.getElementById("breathCircle")) {
            clearBreathing();
            return;
        }

        if (inhale) {

            label.innerText = "INHALE";

            circle.style.transform = "scale(1.2)";

            circle.style.boxShadow =
                "0 0 35px rgba(59,130,246,.6)";

        } else {

            label.innerText = "EXHALE";

            circle.style.transform = "scale(.82)";

            circle.style.boxShadow =
                "0 0 35px rgba(34,197,94,.6)";
        }

        inhale = !inhale;
    }

    animate();

    state.breathingInterval =
        setInterval(animate, 4000);
}
