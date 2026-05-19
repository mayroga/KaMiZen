/* =========================================================
   KAMIZEN ENGINE V15 - FULL MULTILANGUAGE VERSION
   ✔ Persistencia Local (LocalStorage)
   ✔ Narración Total
   ✔ Traducción Inglés ⇄ Español en Tiempo Real
   ✔ Voz Automática en Español/Inglés
   ✔ Botón Language Toggle
   ✔ JSON 100% ENGLISH
   ✔ Perfecto para Miami Latino Parents
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
    sessionStartTime: null,

    /* LANGUAGE */
    language: localStorage.getItem("kamizen_lang") || "en"
};

/* =========================
   LANGUAGE SYSTEM
========================= */

function toggleLanguage() {
    state.language = state.language === "en" ? "es" : "en";
    localStorage.setItem("kamizen_lang", state.language);
    render();
}

/* =========================
   REALTIME TRANSLATION
========================= */

async function tr(text) {

    if (!text) return "";

    if (state.language === "en") {
        return text;
    }

    try {

        const res = await fetch(
            "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=" +
            encodeURIComponent(text)
        );

        const data = await res.json();

        return data[0].map(x => x[0]).join("");

    } catch (err) {

        console.error("Translation Error:", err);

        return text;
    }
}

/* =========================
   SAVE SYSTEM
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
   INIT SYSTEM
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
   MASTER TIMER
========================= */

function startMasterTimer() {

    state.sessionStartTime = Date.now();

    setTimeout(() => {
        finishSession();
    }, 15 * 60 * 1000);
}

function finishSession() {

    window.speechSynthesis.cancel();

    clearInterval(state.timer);

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card center">
            <h2>🌟 GREAT JOB TODAY</h2>

            <p>You completed your KAMIZEN session.</p>

            <button onclick="location.reload()">
                FINISH SESSION
            </button>
        </div>
    `;

    narrate("Great job today. You completed your Kamizen session.");
}

/* =========================
   NAVIGATION
========================= */

function jumpToBlock() {

    const targetMissionId = prompt("Enter Mission ID");

    if (targetMissionId !== null && targetMissionId !== "") {

        const idNum = Number(targetMissionId);

        const idx = state.missions.findIndex(m => m.id === idNum);

        if (idx !== -1) {

            window.speechSynthesis.cancel();

            clearInterval(state.timer);

            state.currentIndex = idx;

            state.currentBlock = 0;

            state.phase = "story";

            render();

        } else {

            alert("Mission not found.");
        }
    }
}

function goBack() {

    window.speechSynthesis.cancel();

    clearInterval(state.timer);

    state.speechLocked = false;

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

    if (confirm("Restart all progress?")) {

        localStorage.clear();

        state.currentIndex = 0;

        state.currentBlock = 0;

        state.phase = "story";

        render();
    }
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
                CONTINUE
            </button>

            <button onclick="toggleLanguage()"
            style="background:#16a34a;margin-top:10px;">

                ${state.language === "en" ? "ESPAÑOL" : "ENGLISH"}

            </button>

        </div>
    `;
}

/* =========================
   START
========================= */

function startSystem() {

    startMasterTimer();

    state.phase = "story";

    render();
}

/* =========================
   RENDER
========================= */

async function render() {

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

            <button onclick="goBack()"
            style="flex:1;">
                BACK
            </button>

            <button onclick="jumpToBlock()"
            style="flex:1;">
                JUMP
            </button>

            <button onclick="toggleLanguage()"
            style="flex:1;background:#16a34a;">

                ${state.language === "en" ? "ESPAÑOL" : "ENGLISH"}

            </button>

        </div>
    `;

    if (state.phase === "story") {

        app.innerHTML = navHeader + `

            <div class="card">

                <h2>
                    STORY ${story.id}
                </h2>

                <h3>
                    ${await tr(story.t || "")}
                </h3>

                <p>
                    ${await tr(story.en || "")}
                </p>

            </div>

            <button id="continueBtn" disabled>
                NARRATING...
            </button>
        `;

        narrate(`${story.t}. ${story.en}`, () => {

            setTimeout(startMission, 1500);
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
   BLOCK RENDER
========================= */

async function renderBlock(block, navHeader) {

    const app = document.getElementById("app");

    let html = navHeader;

    let textToRead = "";

    if (block.t === "v" || block.t === "h") {

        html += `
            <div class="card">
                <h2>${await tr(block.tx?.en || "")}</h2>
            </div>
        `;

        textToRead = block.tx?.en;
    }

    if (block.story) {

        html += `
            <div class="card">
                <p>${await tr(block.story.en || "")}</p>
            </div>
        `;

        textToRead = block.story.en;
    }

    if (block.t === "c") {

        html += `
            <div class="card">
                <p>${await tr(block.tx?.en || "")}</p>
            </div>
        `;

        textToRead = block.tx?.en;
    }

    if (block.t !== "d") {

        html += `
            <button id="continueBtn" disabled>
                NARRATING...
            </button>
        `;
    }

    app.innerHTML = html;

    narrate(textToRead, () => {

        setTimeout(nextBlock, 1500);
    });
}

/* =========================
   NARRATION
========================= */

async function narrate(text, callback) {

    if (!text) {

        if (callback) callback();

        return;
    }

    state.speechLocked = true;

    window.speechSynthesis.cancel();

    const finalText = await tr(text);

    const speech = new SpeechSynthesisUtterance(finalText);

    speech.lang =
        state.language === "es"
        ? "es-US"
        : "en-US";

    speech.rate = 0.9;

    speech.onend = () => {

        state.speechLocked = false;

        if (callback) callback();
    };

    window.speechSynthesis.speak(speech);
}

/* =========================
   BREATHING
========================= */

function startGuidedBreathing() {

    const circle = document.getElementById("breathCircle");

    const label = document.getElementById("breathLabel");

    if (!circle || !label) return;

    let inhale = true;

    const step = () => {

        if (!document.getElementById("breathCircle")) return;

        label.innerText =
            inhale
            ? "INHALE"
            : "EXHALE";

        circle.style.transition =
            "transform 4000ms ease-in-out";

        circle.style.transform =
            inhale
            ? "scale(1.4)"
            : "scale(0.8)";

        inhale = !inhale;
    };

    step();

    const aniInterval = setInterval(() => {

        if (!document.getElementById("breathCircle")) {

            clearInterval(aniInterval);

            return;
        }

        step();

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

            <h3>
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

        unlockContinue("NEXT", nextBlock);
    });
}

/* =========================
   FLOW
========================= */

function nextBlock() {

    clearInterval(state.timer);

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

    if (state.currentIndex >= state.missions.length) {

        state.currentIndex = 0;
    }

    state.phase = "story";

    state.currentBlock = 0;

    render();
}

/* =========================
   BUTTON UNLOCK
========================= */

function unlockContinue(label, action) {

    const btn = document.getElementById("continueBtn");

    if (btn) {

        btn.disabled = false;

        btn.innerText = label;

        btn.onclick = action;
    }
}
