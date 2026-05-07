/* =========================================================
   KAMIZEN ENGINE V12 - FULL STABLE + EXAM MODE
   ✔ Core System 1–35
   ✔ Optional Exam System 36–49
   ✔ Male Voice Restored
   ✔ Green/Red Answers Restored
   ✔ No Frozen Buttons
   ✔ No UI Conflicts
   ✔ Stable Breathing Engine
   ✔ Intro Screen Fixed
========================================================= */

/* =========================
   GLOBAL STATE
========================= */

let state = {

    /* CORE */
    stories: [],
    missions: [],

    currentIndex: 0,
    currentBlock: 0,

    phase: "loading",

    speechLocked: false,
    initialized: false,

    /* EXAM MODE */
    examMode: false,
    examData: [],
    examIndex: 0,
    examBlock: 0,

    /* BREATHING */
    breathingInterval: null
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

    preloadVoices();

    showIntro();
});

/* =========================
   PRELOAD VOICES
========================= */

function preloadVoices() {

    speechSynthesis.getVoices();

    window.speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices();
    };
}

/* =========================
   LOAD CORE DATA
========================= */

async function loadAllData() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card center">
            <h2>LOADING SYSTEM...</h2>
            <p class="small">
                Initializing neural training modules
            </p>
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
            ? storiesData.stories.sort((a, b) => a.id - b.id)
            : [];

        state.missions = Array.isArray(missionsData.missions)
            ? missionsData.missions.sort((a, b) => a.id - b.id)
            : [];

        state.initialized = true;

    } catch (err) {

        console.error("LOAD ERROR:", err);

        app.innerHTML = `
            <div class="card center">
                <h2>SYSTEM ERROR</h2>
                <p class="small">
                    Failed loading missions
                </p>
            </div>
        `;
    }
}

/* =========================
   INTRO SCREEN
========================= */

function showIntro() {

    state.phase = "intro";

    clearBreathing();

    const app = document.getElementById("app");

    app.innerHTML = `

        <div class="card center">

            <h1 style="color:#3b82f6;">
                KAMIZEN LIFE SYSTEM
            </h1>

            <p>
                Awareness • Control • Focus • Discipline
            </p>

            <div style="margin-top:20px;">
                <h3 style="color:#22c55e;">
                    CORE SYSTEM READY
                </h3>

                <p class="small">
                    35 Life Missions • 35 Stories • Optional Exam Mode
                </p>
            </div>

        </div>

        <button onclick="startSystem()">
            START CORE SYSTEM
        </button>

        <button
            onclick="loadExamMode()"
            style="
                margin-top:12px;
                background:#22c55e;
            "
        >
            HOW TO REACT BEFORE & DURING EXAMS
        </button>

        <div class="card center">

            <h3>
                Breathing System
            </h3>

            <div class="breath-circle">

                <span>
                    FOCUS
                </span>

            </div>

            <p class="small">
                Controlled by engine.js (auto regulation system)
            </p>

        </div>
    `;
}

/* =========================
   START CORE SYSTEM
========================= */

function startSystem() {

    speechSynthesis.cancel();

    state.examMode = false;

    state.currentIndex = 0;
    state.currentBlock = 0;

    state.phase = "story";

    render();
}

/* =========================
   CORE RENDER
========================= */

function render() {

    if (!state.initialized) return;

    const app = document.getElementById("app");

    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    if (!story || !mission) {

        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "story";

        return render();
    }

    /* =========================
       STORY
    ========================= */

    if (state.phase === "story") {

        app.innerHTML = `

            <div class="card">

                <h2>
                    STORY ${story.id}
                </h2>

                <h3>
                    ${story.t || ""}
                </h3>

                <p>
                    ${story.en || ""}
                </p>

            </div>

            <button id="continueBtn" disabled>
                NARRATING...
            </button>
        `;

        narrate(

            `${story.t || ""}. ${story.en || ""}`,

            () => {

                unlockContinue(
                    "START MISSION",
                    startMission
                );
            }
        );

        return;
    }

    /* =========================
       MISSION
    ========================= */

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

    clearBreathing();

    const app = document.getElementById("app");

    let html = "";
    let narration = "";

    /* =========================
       TITLE
    ========================= */

    if (block.t === "v") {

        html += `
            <div class="card">
                <h2>${block.tx?.en || ""}</h2>
            </div>
        `;

        narration += `${block.tx?.en || ""}. `;
    }

    /* =========================
       HEADER
    ========================= */

    if (block.t === "h") {

        html += `
            <div class="card">
                <p>${block.tx?.en || ""}</p>
            </div>
        `;

        narration += `${block.tx?.en || ""}. `;
    }

    /* =========================
       STORY
    ========================= */

    if (block.story) {

        html += `
            <div class="card">
                <p>${block.story.en || ""}</p>
            </div>
        `;

        narration += `${block.story.en || ""}. `;
    }

    /* =========================
       BREATHING
    ========================= */

    if (
        block.t === "breath_auto" ||
        block.t === "br"
    ) {

        html += `

            <div class="card center">

                <div
                    class="breath-circle"
                    id="breathCircle"
                >

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

            </div>
        `;

        narration += `
            ${block.tx?.en || ""}.
            ${block.inf?.en || ""}.
        `;
    }

    /* =========================
       DECISION
    ========================= */

    if (block.t === "d") {

        html += `
            <div class="card">

                <h3>
                    ${block.q?.en || ""}
                </h3>
        `;

        narration += `${block.q?.en || ""}. `;

        block.op.forEach((option, index) => {

            html += `
                <div
                    class="answer"
                    onclick='selectAnswer(
                        ${index},
                        ${block.c},
                        ${JSON.stringify(block.ex)}
                    )'
                >
                    ${option}
                </div>
            `;

            narration += `${option}. `;
        });

        html += `</div>`;
    }

    /* =========================
       SILENCE
    ========================= */

    if (block.t === "sil") {

        html += `
            <div class="card">

                <h3>
                    ${block.tx?.en || ""}
                </h3>

                <p class="small">
                    ${block.inf?.en || ""}
                </p>

            </div>
        `;

        narration += `
            ${block.tx?.en || ""}.
            ${block.inf?.en || ""}.
        `;
    }

    /* =========================
       REWARD
    ========================= */

    if (block.t === "r") {

        html += `
            <div class="card center">

                <h2 style="color:#22c55e;">
                    ⭐ ${block.tx || ""}
                </h2>

                <p>
                    +${block.p || 0} XP
                </p>

            </div>
        `;

        narration += `
            ${block.tx || ""}.
            ${block.p || 0} experience points.
        `;
    }

    /* =========================
       CONCLUSION
    ========================= */

    if (block.t === "c") {

        html += `
            <div class="card">
                <p>${block.tx?.en || ""}</p>
            </div>
        `;

        narration += `${block.tx?.en || ""}. `;
    }

    /* =========================
       CONTINUE BUTTON
    ========================= */

    if (block.t !== "d") {

        html += `
            <button id="continueBtn" disabled>
                NARRATING...
            </button>
        `;
    }

    app.innerHTML = html;

    /* =========================
       BREATHING START
    ========================= */

    if (
        block.t === "breath_auto" ||
        block.t === "br"
    ) {

        startBreathingAnimation();
    }

    /* =========================
       NARRATION
    ========================= */

    narrate(narration, () => {

        if (block.t !== "d") {

            unlockContinue(
                "CONTINUE",
                nextBlock
            );
        }
    });
}

/* =========================
   ANSWERS
========================= */

function selectAnswer(index, correct, explanations) {

    if (state.speechLocked) return;

    const app = document.getElementById("app");

    const ok = index === correct;

    const explanation = explanations?.[index] || "";

    app.innerHTML += `

        <div class="card">

            <h3 style="
                color:${ok ? '#22c55e' : '#ef4444'};
            ">

                ${ok ? "CORRECT" : "WRONG"}

            </h3>

            <p>
                ${explanation}
            </p>

        </div>

        <button id="continueBtn" disabled>
            NARRATING...
        </button>
    `;

    narrate(explanation, () => {

        unlockContinue(
            "CONTINUE",
            nextBlock
        );
    });
}

/* =========================
   EXAM MODE
========================= */

async function loadExamMode() {

    try {

        speechSynthesis.cancel();

        clearBreathing();

        const app = document.getElementById("app");

        app.innerHTML = `
            <div class="card center">
                <h2>LOADING EXAM MODE...</h2>
            </div>
        `;

        const [a, b] = await Promise.all([

            fetch("/exam36-42.json"),
            fetch("/exam43-49.json")
        ]);

        const d1 = await a.json();
        const d2 = await b.json();

        state.examMode = true;

        state.examData = [
            ...d1.missions,
            ...d2.missions
        ];

        state.examIndex = 0;
        state.examBlock = 0;

        renderExam();

    } catch (err) {

        console.error("EXAM LOAD ERROR:", err);

        showIntro();
    }
}

/* =========================
   EXAM RENDER
========================= */

function renderExam() {

    clearBreathing();

    const app = document.getElementById("app");

    const mission = state.examData[state.examIndex];

    if (!mission) {

        state.examMode = false;

        return showIntro();
    }

    const block = mission.b[state.examBlock];

    if (!block) {

        state.examIndex++;
        state.examBlock = 0;

        return renderExam();
    }

    let html = "";
    let narration = "";

    if (block.t === "v") {

        html += `
            <div class="card">
                <h2>${block.tx?.en || ""}</h2>
            </div>
        `;

        narration += `${block.tx?.en || ""}. `;
    }

    if (block.t === "h") {

        html += `
            <div class="card">
                <p>${block.tx?.en || ""}</p>
            </div>
        `;

        narration += `${block.tx?.en || ""}. `;
    }

    if (block.story) {

        html += `
            <div class="card">
                <p>${block.story.en || ""}</p>
            </div>
        `;

        narration += `${block.story.en || ""}. `;
    }

    if (
        block.t === "breath_auto" ||
        block.t === "br"
    ) {

        html += `

            <div class="card center">

                <div
                    class="breath-circle"
                    id="breathCircle"
                >

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

            </div>
        `;

        narration += `
            ${block.tx?.en || ""}.
            ${block.inf?.en || ""}.
        `;
    }

    if (block.t === "d") {

        html += `
            <div class="card">

                <h3>
                    ${block.q?.en || ""}
                </h3>
        `;

        block.op.forEach((o, i) => {

            html += `
                <div
                    class="answer"
                    onclick='selectExamAnswer(
                        ${i},
                        ${block.c},
                        ${JSON.stringify(block.ex)}
                    )'
                >
                    ${o}
                </div>
            `;
        });

        html += `</div>`;
    }

    if (block.t === "sil") {

        html += `
            <div class="card">

                <h3>
                    ${block.tx?.en || ""}
                </h3>

                <p class="small">
                    ${block.inf?.en || ""}
                </p>

            </div>
        `;

        narration += `
            ${block.tx?.en || ""}.
            ${block.inf?.en || ""}.
        `;
    }

    if (block.t !== "d") {

        html += `
            <button id="continueBtn" disabled>
                NARRATING...
            </button>
        `;
    }

    app.innerHTML = html;

    if (
        block.t === "breath_auto" ||
        block.t === "br"
    ) {

        startBreathingAnimation();
    }

    narrate(narration, () => {

        if (block.t !== "d") {

            unlockContinue(
                "CONTINUE",
                nextExamBlock
            );
        }
    });
}

/* =========================
   EXAM ANSWERS
========================= */

function selectExamAnswer(index, correct, explanations) {

    const app = document.getElementById("app");

    const ok = index === correct;

    const explanation = explanations?.[index] || "";

    app.innerHTML += `

        <div class="card">

            <h3 style="
                color:${ok ? '#22c55e' : '#ef4444'};
            ">

                ${ok ? "GOOD RESPONSE" : "TRY AGAIN"}

            </h3>

            <p>
                ${explanation}
            </p>

        </div>

        <button id="continueBtn" disabled>
            NARRATING...
        </button>
    `;

    narrate(explanation, () => {

        unlockContinue(
            "CONTINUE",
            nextExamBlock
        );
    });
}

/* =========================
   EXAM NEXT BLOCK
========================= */

function nextExamBlock() {

    state.examBlock++;

    renderExam();
}

/* =========================
   CORE HELPERS
========================= */

function startMission() {

    if (state.speechLocked) return;

    state.phase = "mission";
    state.currentBlock = 0;

    render();
}

function nextBlock() {

    if (state.speechLocked) return;

    state.currentBlock++;

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
   NARRATOR
========================= */

function narrate(text, callback = null) {

    if (!text) {

        if (callback) callback();

        return;
    }

    state.speechLocked = true;

    speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-US";

    speech.rate = 0.9;
    speech.pitch = 0.8;
    speech.volume = 1;

    /* =========================
       MALE VOICE
    ========================= */

    const voices = speechSynthesis.getVoices();

    const maleVoice = voices.find(v =>

        v.lang.includes("en") && (

            v.name.toLowerCase().includes("david") ||
            v.name.toLowerCase().includes("mark") ||
            v.name.toLowerCase().includes("male") ||
            v.name.toLowerCase().includes("guy")
        )
    );

    if (maleVoice) {

        speech.voice = maleVoice;
    }

    speech.onend = () => {

        state.speechLocked = false;

        if (callback) callback();
    };

    speech.onerror = () => {

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
   BREATHING ENGINE
========================= */

function clearBreathing() {

    if (state.breathingInterval) {

        clearInterval(state.breathingInterval);

        state.breathingInterval = null;
    }
}

function startBreathingAnimation() {

    clearBreathing();

    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");

    if (!circle || !label) return;

    let inhale = true;

    circle.style.transition =
        "all 4s ease-in-out";

    function animate() {

        if (!document.getElementById("breathCircle")) {

            clearBreathing();

            return;
        }

        if (inhale) {

            label.innerText = "INHALE";

            circle.style.transform =
                "scale(1.2)";

            circle.style.boxShadow =
                "0 0 40px rgba(59,130,246,0.6)";

        } else {

            label.innerText = "EXHALE";

            circle.style.transform =
                "scale(0.82)";

            circle.style.boxShadow =
                "0 0 10px rgba(34,197,94,0.3)";
        }

        inhale = !inhale;
    }

    animate();

    state.breathingInterval =
        setInterval(animate, 4000);
}
