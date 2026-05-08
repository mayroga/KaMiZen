/* =========================================================
   KAMIZEN ENGINE V12 - FULL EXPERT EDITION (VOICE FIXED)
   Persistencia Local (LocalStorage)
   Narración Total: Preguntas + Opciones + Feedback
   Guía Vocal de Respiración SIN CORTES
   Botón JUMP/SKIP para navegación directa
   Soporte completo: v, h, story, br, sil, d, r, c
   ========================================================= */

let state = {
    stories: [],
    missions: [],
    currentIndex: 0,
    currentBlock: 0,
    phase: "loading",
    speechLocked: false,
    initialized: false,
    timer: null,
    timeLeft: 0,
    breathingInterval: null,
    breathingTimeout: null
};

/* =========================
   SISTEMA DE PERSISTENCIA
========================= */
function saveProgress() {
    localStorage.setItem('kamizen_save', JSON.stringify({
        currentIndex: state.currentIndex,
        currentBlock: state.currentBlock
    }));
}

function loadProgress() {
    const saved = localStorage.getItem('kamizen_save');

    if (saved) {
        const data = JSON.parse(saved);

        state.currentIndex = data.currentIndex || 0;
        state.currentBlock = data.currentBlock || 0;
    }
}

/* =========================
   INICIALIZACIÓN
========================= */
window.addEventListener("load", async () => {
    loadProgress();
    await loadAllData();
    showIntro();
});

async function loadAllData() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h2>SYSTEM BOOTING...</h2>
            <p>Loading Data...</p>
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

        console.error(err);

        app.innerHTML = `
            <div class="card">
                <h2>BOOT ERROR</h2>
                <p>Check API Connection</p>
            </div>
        `;
    }
}

/* =========================
   CONTROLES
========================= */
function jumpToBlock() {

    const targetMissionId = prompt(
        "Enter the MISSION ID to jump to:"
    );

    if (targetMissionId !== null && targetMissionId !== "") {

        const idx = state.missions.findIndex(
            m => m.id === Number(targetMissionId)
        );

        if (idx !== -1) {

            stopAllSpeech();

            state.currentIndex = idx;
            state.currentBlock = 0;
            state.phase = "story";

            render();

        } else {

            alert("Mission ID not found.");
        }
    }
}

function goBack() {

    stopAllSpeech();

    if (state.currentBlock > 0) {

        state.currentBlock--;

    } else if (state.currentIndex > 0) {

        state.currentIndex--;
        state.currentBlock = 0;
        state.phase = "story";
    }

    render();
}

function restartSystem() {

    if (confirm("RESET ALL PROGRESS?")) {

        stopAllSpeech();

        localStorage.clear();

        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "story";

        render();
    }
}

/* =========================
   LIMPIEZA TOTAL
========================= */
function stopAllSpeech() {

    window.speechSynthesis.cancel();

    clearInterval(state.timer);

    clearInterval(state.breathingInterval);

    clearTimeout(state.breathingTimeout);

    state.speechLocked = false;
}

/* =========================
   TIMER
========================= */
function startCountdown(seconds, onComplete) {

    clearInterval(state.timer);

    state.timeLeft = seconds;

    const timerDisplay = document.getElementById("timerDisplay");

    state.timer = setInterval(() => {

        state.timeLeft--;

        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;

        if (timerDisplay) {

            timerDisplay.innerText =
                `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }

        if (state.timeLeft <= 0) {

            clearInterval(state.timer);

            if (onComplete) onComplete();
        }

    }, 1000);
}

/* =========================
   INTRO
========================= */
function showIntro() {

    state.phase = "intro";

    document.getElementById("app").innerHTML = `
        <div class="card center">

            <h1>KAMIZEN LIFE SYSTEM</h1>

            <p>Training • Awareness • Control</p>

            <button onclick="startSystem()">
                CONTINUE MISSION
            </button>

            <button
                onclick="restartSystem()"
                style="background:var(--danger);margin-top:10px;"
            >
                RESET PROGRESS
            </button>

        </div>
    `;
}

function startSystem() {

    state.phase = "story";

    render();
}

/* =========================
   RENDER
========================= */
function render() {

    if (!state.initialized) return;

    saveProgress();

    const app = document.getElementById("app");

    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    if (!story || !mission) {

        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "story";

        return render();
    }

    let navHeader = `
        <div style="display:flex;gap:5px;margin-bottom:10px;">

            <button
                onclick="goBack()"
                style="flex:1;padding:8px;font-size:12px;background:#334155;"
            >
                BACK
            </button>

            <button
                onclick="jumpToBlock()"
                style="flex:1;padding:8px;font-size:12px;background:#0ea5e9;"
            >
                JUMP/SKIP
            </button>

            <button
                onclick="restartSystem()"
                style="flex:1;padding:8px;font-size:12px;background:var(--danger);"
            >
                RESET
            </button>

        </div>
    `;

    if (state.phase === "story") {

        app.innerHTML = navHeader + `
            <div class="card">

                <h2 style="color:var(--primary)">
                    STORY ${story.id}
                </h2>

                <h3>${story.t || ""}</h3>

                <p style="font-size:1.1rem; line-height:1.6;">
                    ${story.en || ""}
                </p>

            </div>

            <button id="continueBtn" disabled>
                NARRATING...
            </button>
        `;

        narrate(`${story.t}. ${story.en}`, () => {

            setTimeout(() => {

                startMission();

            }, 1500);
        });

    } else {

        const block = mission.b[state.currentBlock];

        if (!block) {

            nextStory();

            return;
        }

        renderBlock(block, navHeader);
    }
}

/* =========================
   RENDER BLOCK
========================= */
function renderBlock(block, navHeader) {

    const app = document.getElementById("app");

    let html = navHeader;

    let textToRead = "";

    const timerUI = `
        <div class="card center"
            style="border:3px solid var(--primary);background:#0f172a;">

            <h1 id="timerDisplay"
                style="font-size:4rem;margin:0;font-family:monospace;">
                00:00
            </h1>

            <p style="color:var(--primary);letter-spacing:2px;">
                STAY FOCUSED
            </p>

        </div>
    `;

    /* =========================
       VOICE / HEADER
    ========================= */

    if (block.t === "v" || block.t === "h") {

        html += `
            <div class="card">
                <h2>${block.tx?.en || ""}</h2>
            </div>
        `;

        textToRead = block.tx?.en || "";
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

        textToRead = block.story.en || "";
    }

    /* =========================
       BREATHING
    ========================= */

    if (block.t === "br" || block.t === "breath_auto") {

        html += timerUI + `

            <div class="card center">

                <div class="breath-circle" id="breathCircle">
                    <span id="breathLabel">READY</span>
                </div>

                <h3>${block.tx?.en || ""}</h3>

                <p>${block.inf?.en || ""}</p>

            </div>
        `;

        textToRead =
            `${block.tx?.en || ""}. ${block.inf?.en || ""}`;
    }

    /* =========================
       SILENCE
    ========================= */

    if (block.t === "sil") {

        html += timerUI + `
            <div class="card">

                <h3>${block.tx?.en || ""}</h3>

                <p>${block.inf?.en || ""}</p>

            </div>
        `;

        textToRead =
            `${block.tx?.en || ""}. ${block.inf?.en || ""}`;
    }

    /* =========================
       QUESTIONS
    ========================= */

    if (block.t === "d") {

        html += `<div class="card">`;

        html += `<h3>${block.q?.en || ""}</h3>`;

        block.op?.forEach((opt, i) => {

            html += `
                <div
                    class="answer"
                    id="opt-${i}"
                    onclick="selectAnswer(
                        ${i},
                        ${block.c},
                        ${JSON.stringify(block.ex).replace(/"/g, '&quot;')}
                    )"
                >
                    ${opt}
                </div>
            `;
        });

        html += `</div>`;

        textToRead =
            `${block.q?.en}. Your options are: ${block.op.join(". ")}`;
    }

    /* =========================
       REWARD
    ========================= */

    if (block.t === "r") {

        html += `
            <div class="card center">

                <h2>⭐ ${block.tx || "REWARD"}</h2>

                <p style="font-size:1.5rem;">
                    +${block.p || 0} XP
                </p>

            </div>
        `;

        textToRead =
            `${block.tx}. You have earned ${block.p} experience points.`;
    }

    /* =========================
       CONTENT
    ========================= */

    if (block.t === "c") {

        html += `
            <div class="card">
                <p>${block.tx?.en || ""}</p>
            </div>
        `;

        textToRead = block.tx?.en || "";
    }

    if (block.t !== "d") {

        html += `
            <button id="continueBtn" disabled>
                NARRATING...
            </button>
        `;
    }

    app.innerHTML = html;

    /* =========================
       NARRATION
    ========================= */

    narrate(textToRead, () => {

        /* =========================
           BREATHING FLOW FIXED
        ========================= */

        if (
            block.t === "br" ||
            block.t === "breath_auto"
        ) {

            startGuidedBreathing(block);

        }

        else if (block.t === "sil") {

            const duration = block.d || 15;

            startCountdown(duration, nextBlock);
        }

        else if (block.t !== "d") {

            unlockContinue("CONTINUE", nextBlock);
        }
    });
}

/* =========================
   VOICE SYSTEM
========================= */
function narrate(text, callback) {

    if (!text || text.trim() === "") {

        if (callback) callback();

        return;
    }

    state.speechLocked = true;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-US";

    speech.rate = 0.88;

    speech.pitch = 1;

    speech.volume = 1;

    speech.onend = () => {

        state.speechLocked = false;

        if (callback) callback();
    };

    window.speechSynthesis.speak(speech);
}

/* =========================
   GUIDED BREATHING FIXED
========================= */

function startGuidedBreathing(block) {

    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");

    if (!circle || !label) return;

    const totalDuration = block.d || 16;

    startCountdown(totalDuration, () => {

        clearInterval(state.breathingInterval);

        nextBlock();
    });

    let inhale = true;

    function breathingCycle() {

        if (state.timeLeft <= 0) return;

        const currentText = block.tx?.en || "Breathe";

        const guideText = block.inf?.en || "";

        /* =========================
           VISUAL
        ========================= */

        label.innerText = inhale ? "INHALE" : "EXHALE";

        circle.style.transition = "transform 4s ease-in-out";

        circle.style.transform =
            inhale ? "scale(1.35)" : "scale(0.85)";

        /* =========================
           JSON VOICE GUIDE
           USA EXACTAMENTE EL TEXTO
           DEL JSON
        ========================= */

        const voiceText = inhale
            ? `Inhale. ${currentText}. ${guideText}`
            : `Exhale. ${currentText}. ${guideText}`;

        narrate(voiceText);

        inhale = !inhale;
    }

    breathingCycle();

    state.breathingInterval = setInterval(() => {

        breathingCycle();

    }, 4000);
}

/* =========================
   ANSWERS
========================= */

function selectAnswer(index, correct, explanations) {

    if (state.speechLocked) return;

    const isCorrect = index === correct;

    const explanation = explanations?.[index] || "";

    const feedbackWrap = document.createElement("div");

    feedbackWrap.innerHTML = `

        <div class="card">

            <h3 style="color:${isCorrect ? '#22c55e' : '#ef4444'}">

                ${isCorrect ? "EXCELLENT!" : "KEEP LEARNING"}

            </h3>

            <p>${explanation}</p>

        </div>

        <button id="continueBtn" disabled>
            NARRATING...
        </button>
    `;

    document.getElementById("app")
        .appendChild(feedbackWrap);

    narrate(explanation, () => {

        unlockContinue("NEXT STEP", nextBlock);
    });
}

/* =========================
   FLOW
========================= */

function nextBlock() {

    stopAllSpeech();

    state.currentBlock++;

    render();
}

function startMission() {

    state.phase = "mission";

    state.currentBlock = 0;

    render();
}

function nextStory() {

    stopAllSpeech();

    state.currentIndex++;

    if (state.currentIndex >= state.stories.length) {

        state.currentIndex = 0;
    }

    state.phase = "story";

    state.currentBlock = 0;

    render();
}

/* =========================
   BUTTON
========================= */

function unlockContinue(label, action) {

    const btn = document.getElementById("continueBtn");

    if (btn) {

        btn.disabled = false;

        btn.innerText = label;

        btn.onclick = action;
    }
}
