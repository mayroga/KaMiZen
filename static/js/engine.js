/* =========================================================
   KAMIZEN ENGINE V15 FULL MULTILANGUAGE
   ✔ Real-Time Auto Translation System
   ✔ English JSON Core (NO duplicated ES JSON needed)
   ✔ Miami Latino Parent Friendly
   ✔ Persistent Language Selection
   ✔ Auto Narration Translation
   ✔ Story + Mission + Quiz Translation
   ✔ Smart Browser Language Detection
   ✔ Fallback Safe Translation
   ✔ Voice Language Auto-Switch
   ✔ Full Compatibility With V14
   ✔ Missions 1-63 Ready
   ✔ PDF Integration Safe
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

    /* =========================
       MULTILANGUAGE STATE
    ========================= */
    lang: "en",
    translations: {},
    translating: false
};

/* =========================================================
   LANGUAGE SYSTEM
========================================================= */

const SUPPORTED_LANGS = {
    en: {
        name: "English",
        voice: "en-US"
    },
    es: {
        name: "Español",
        voice: "es-US"
    }
};

/* =========================
   SAVE / LOAD LANGUAGE
========================= */

function saveLanguage() {
    localStorage.setItem("kamizen_lang", state.lang);
}

function loadLanguage() {
    const saved = localStorage.getItem("kamizen_lang");

    if (saved && SUPPORTED_LANGS[saved]) {
        state.lang = saved;
        return;
    }

    /* AUTO DETECT FOR MIAMI LATINO FAMILIES */
    const browserLang = navigator.language || navigator.userLanguage;

    if (browserLang.toLowerCase().includes("es")) {
        state.lang = "es";
    } else {
        state.lang = "en";
    }
}

/* =========================================================
   REAL-TIME TRANSLATION ENGINE
========================================================= */

async function translateText(text) {

    if (!text) return "";

    /* ENGLISH MODE = NO TRANSLATION */
    if (state.lang === "en") return text;

    /* CACHE */
    const cacheKey = `${state.lang}_${text}`;

    if (state.translations[cacheKey]) {
        return state.translations[cacheKey];
    }

    try {

        state.translating = true;

        /* =========================
           GOOGLE TRANSLATE FREE API
        ========================= */

        const url =
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${state.lang}&dt=t&q=${encodeURIComponent(text)}`;

        const res = await fetch(url);

        const data = await res.json();

        let translated = text;

        if (Array.isArray(data)) {
            translated = data[0]
                .map(x => x[0])
                .join("");
        }

        state.translations[cacheKey] = translated;

        state.translating = false;

        return translated;

    } catch (err) {

        console.warn("Translation Error:", err);

        state.translating = false;

        return text;
    }
}

/* =========================================================
   TRANSLATION HELPERS
========================================================= */

async function T(text) {
    return await translateText(text || "");
}

async function translateArray(arr = []) {

    const translated = [];

    for (const item of arr) {
        translated.push(await T(item));
    }

    return translated;
}

/* =========================
   PERSISTENCIA
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

/* =========================================================
   INIT SYSTEM
========================================================= */

window.addEventListener("load", async () => {

    loadLanguage();
    loadProgress();

    await loadAllData();

    showIntro();
});

/* =========================================================
   LOAD DATA
========================================================= */

async function loadAllData() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h2>SYSTEM BOOTING...</h2>
            <p>Loading Data (Missions 1-63)...</p>
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

/* =========================================================
   MASTER TIMER
========================================================= */

function startMasterTimer() {

    state.sessionStartTime = Date.now();

    setTimeout(() => {
        finishSession();
    }, 15 * 60 * 1000);
}

async function finishSession() {

    window.speechSynthesis.cancel();

    clearInterval(state.timer);

    const currentMissionId =
        state.missions[state.currentIndex]?.id || 0;

    if (typeof renderValidationScreen === "function") {

        renderValidationScreen(currentMissionId, {
            timeSpent: "15:00",
            status: "Complete"
        });

    } else {

        const app = document.getElementById("app");

        const title = await T("GREAT JOB TODAY");

        const body = await T(
            "You completed your KAMIZEN session."
        );

        const extra = await T(
            "Now you are ready to start your class."
        );

        app.innerHTML = `
            <div class="card center animated fadeIn">
                <h2>${title}</h2>
                <p>${body}</p>
                <p>${extra}</p>

                <button onclick="location.reload()"
                style="margin-top:20px;">
                FINISH SESSION
                </button>
            </div>
        `;

        narrate(`${title}. ${body}. ${extra}`);
    }
}

/* =========================================================
   NAVIGATION
========================================================= */

function jumpToBlock() {

    const targetMissionId =
        prompt("Enter the MISSION ID to jump to (1-63):");

    if (
        targetMissionId !== null &&
        targetMissionId !== ""
    ) {

        const idNum = Number(targetMissionId);

        const idx =
            state.missions.findIndex(m => m.id === idNum);

        if (idx !== -1) {

            window.speechSynthesis.cancel();

            clearInterval(state.timer);

            state.currentIndex = idx;

            state.currentBlock = 0;

            state.phase = "story";

            render();

        } else {

            alert("Mission ID " + idNum + " not found.");
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

    if (confirm("Are you sure you want to RESTART from zero?")) {

        localStorage.clear();

        state.currentIndex = 0;

        state.currentBlock = 0;

        state.phase = "story";

        render();
    }
}

/* =========================================================
   LANGUAGE SWITCHER
========================================================= */

function switchLanguage(lang) {

    if (!SUPPORTED_LANGS[lang]) return;

    state.lang = lang;

    saveLanguage();

    render();
}

/* =========================================================
   TIMER
========================================================= */

function startCountdown(seconds, onComplete) {

    clearInterval(state.timer);

    state.timeLeft = seconds;

    const timerDisplay =
        document.getElementById("timerDisplay");

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

/* =========================================================
   INTRO
========================================================= */

async function showIntro() {

    state.phase = "intro";

    const title =
        await T("KAMIZEN LIFE SYSTEM");

    const sub =
        await T("Training • Awareness • Control");

    const range =
        await T("Range: Missions 1 - 63 Loaded");

    const cont =
        await T("CONTINUE MISSION");

    const reset =
        await T("RESET PROGRESS");

    document.getElementById("app").innerHTML = `

        <div class="card center">

            <div style="display:flex;gap:10px;justify-content:center;margin-bottom:20px;">

                <button onclick="switchLanguage('en')">
                    ENGLISH
                </button>

                <button onclick="switchLanguage('es')">
                    ESPAÑOL
                </button>

            </div>

            <h1>${title}</h1>

            <p>${sub}</p>

            <p class="small">${range}</p>

            <button onclick="startSystem()">
                ${cont}
            </button>

            <button
                onclick="restartSystem()"
                style="background:var(--danger);margin-top:10px;">

                ${reset}

            </button>

        </div>
    `;
}

function startSystem() {

    startMasterTimer();

    state.phase = "story";

    render();
}

/* =========================================================
   MAIN RENDER
========================================================= */

async function render() {

    if (!state.initialized) return;

    saveProgress();

    const app =
        document.getElementById("app");

    const story =
        state.stories[state.currentIndex];

    const mission =
        state.missions[state.currentIndex];

    if (!story || !mission) {

        state.currentIndex = 0;

        state.currentBlock = 0;

        state.phase = "story";

        return render();
    }

    const backTxt = await T("BACK");

    const jumpTxt = await T("JUMP/SKIP");

    const resetTxt = await T("RESET");

    let navHeader = `

        <div style="display:flex;gap:5px;margin-bottom:10px;">

            <button onclick="goBack()"
            style="flex:1;padding:8px;font-size:12px;background:#334155;">
                ${backTxt}
            </button>

            <button onclick="jumpToBlock()"
            style="flex:1;padding:8px;font-size:12px;background:#0ea5e9;">
                ${jumpTxt}
            </button>

            <button onclick="restartSystem()"
            style="flex:1;padding:8px;font-size:12px;background:var(--danger);">
                ${resetTxt}
            </button>

        </div>
    `;

    /* =========================
       STORY MODE
    ========================= */

    if (state.phase === "story") {

        const storyTitle =
            await T(story.t || "");

        const storyBody =
            await T(story.en || "");

        const storyWord =
            await T("STORY");

        const narrating =
            await T("NARRATING...");

        app.innerHTML = `

            ${navHeader}

            <div class="card">

                <h2 style="color:var(--primary)">
                    ${storyWord} ${story.id}
                </h2>

                <h3>${storyTitle}</h3>

                <p style="font-size:1.1rem;line-height:1.6;">
                    ${storyBody}
                </p>

            </div>

            <button id="continueBtn" disabled>
                ${narrating}
            </button>
        `;

        narrate(
            `${storyTitle}. ${storyBody}`,
            () => {
                setTimeout(startMission, 1500);
            }
        );

    } else {

        const block =
            mission.b[state.currentBlock];

        if (!block) {

            nextStory();

            return;
        }

        renderBlock(block, navHeader);
    }
}

/* =========================================================
   BLOCK RENDER
========================================================= */

async function renderBlock(block, navHeader) {

    const app =
        document.getElementById("app");

    let html = navHeader;

    let textToRead = "";

    const stayFocused =
        await T("STAY FOCUSED");

    const narrating =
        await T("NARRATING...");

    const timerUI = `

        <div class="card center"
        style="border:3px solid var(--primary);background:#0f172a;">

            <h1 id="timerDisplay"
            style="font-size:4rem;margin:0;font-family:monospace;">
                00:00
            </h1>

            <p style="color:var(--primary);letter-spacing:2px;">
                ${stayFocused}
            </p>

        </div>
    `;

    /* =========================
       TITLE BLOCK
    ========================= */

    if (block.t === "v" || block.t === "h") {

        const txt =
            await T(block.tx?.en || "");

        html += `
            <div class="card">
                <h2>${txt}</h2>
            </div>
        `;

        textToRead = txt;
    }

    /* =========================
       STORY BLOCK
    ========================= */

    if (block.story) {

        const txt =
            await T(block.story.en || "");

        html += `
            <div class="card">
                <p>${txt}</p>
            </div>
        `;

        textToRead = txt;
    }

    /* =========================
       BREATHING
    ========================= */

    if (
        block.t === "breath_auto" ||
        block.t === "br"
    ) {

        const tx =
            await T(block.tx?.en || "");

        const inf =
            await T(block.inf?.en || "");

        const ready =
            await T("READY");

        html += timerUI + `

            <div class="card center">

                <div class="breath-circle"
                id="breathCircle">

                    <span id="breathLabel">
                        ${ready}
                    </span>

                </div>

                <h3>${tx}</h3>

                <p>${inf}</p>

            </div>
        `;

        textToRead =
            `${tx}. ${inf}`;
    }

    /* =========================
       SILENCE
    ========================= */

    if (block.t === "sil") {

        const tx =
            await T(block.tx?.en || "");

        const inf =
            await T(block.inf?.en || "");

        html += timerUI + `

            <div class="card">

                <h3>${tx}</h3>

                <p>${inf}</p>

            </div>
        `;

        textToRead = `${tx}. ${inf}`;
    }

    /* =========================
       QUESTIONS
    ========================= */

    if (block.t === "d") {

        const question =
            await T(block.q?.en || "");

        const translatedOptions =
            await translateArray(block.op || []);

        html += `
            <div class="card">
                <h3>${question}</h3>
        `;

        translatedOptions.forEach((opt, i) => {

            html += `

                <div
                class="answer"
                id="opt-${i}"
                onclick="selectAnswer(
                    ${i},
                    ${block.c},
                    ${JSON.stringify(block.ex).replace(/"/g, '&quot;')}
                )">

                    ${opt}

                </div>
            `;
        });

        html += `</div>`;

        textToRead =
            `${question}. ${translatedOptions.join(". ")}`;
    }

    /* =========================
       REWARD
    ========================= */

    if (block.t === "r") {

        const reward =
            await T(block.tx || "REWARD");

        const xp =
            await T("experience points");

        html += `
            <div class="card center">
                <h2>⭐ ${reward}</h2>
                <p style="font-size:1.5rem;">
                    +${block.p || 0} XP
                </p>
            </div>
        `;

        textToRead =
            `${reward}. ${block.p} ${xp}`;
    }

    /* =========================
       COMMENT
    ========================= */

    if (block.t === "c") {

        const txt =
            await T(block.tx?.en || "");

        html += `
            <div class="card">
                <p>${txt}</p>
            </div>
        `;

        textToRead = txt;
    }

    if (block.t !== "d") {

        html += `
            <button id="continueBtn" disabled>
                ${narrating}
            </button>
        `;
    }

    app.innerHTML = html;

    narrate(textToRead, async () => {

        if (
            block.t === "breath_auto" ||
            block.t === "br"
        ) {

            startCountdown(24, nextBlock);

            startGuidedBreathing();

            unlockContinue(
                await T("SKIP"),
                nextBlock
            );

        } else if (block.t === "sil") {

            startCountdown(24, nextBlock);

            unlockContinue(
                await T("SKIP"),
                nextBlock
            );

        } else if (block.t === "d") {

        } else {

            setTimeout(nextBlock, 1500);
        }
    });
}

/* =========================================================
   NARRATION SYSTEM
========================================================= */

function narrate(text, callback) {

    if (!text) {

        if (callback) callback();

        return;
    }

    state.speechLocked = true;

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.lang =
        SUPPORTED_LANGS[state.lang]?.voice || "en-US";

    speech.rate = 0.9;

    speech.pitch = 1;

    speech.onend = () => {

        state.speechLocked = false;

        if (callback) callback();
    };

    window.speechSynthesis.speak(speech);
}

/* =========================================================
   GUIDED BREATHING
========================================================= */

async function startGuidedBreathing() {

    const circle =
        document.getElementById("breathCircle");

    const label =
        document.getElementById("breathLabel");

    if (!circle || !label) return;

    let inhale = true;

    const inhaleTxt =
        await T("INHALE");

    const exhaleTxt =
        await T("EXHALE");

    const step = () => {

        if (
            !document.getElementById("breathCircle") ||
            state.timeLeft <= 0
        ) return;

        label.innerText =
            inhale ? inhaleTxt : exhaleTxt;

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

        if (
            !document.getElementById("breathCircle") ||
            state.timeLeft <= 0
        ) {

            clearInterval(aniInterval);

            return;
        }

        step();

    }, 4000);
}

/* =========================================================
   ANSWER SYSTEM
========================================================= */

async function selectAnswer(
    index,
    correct,
    explanations
) {

    if (state.speechLocked) return;

    const isCorrect =
        index === correct;

    const explanationRaw =
        explanations?.[index] || "";

    const explanation =
        await T(explanationRaw);

    const excellent =
        await T("EXCELLENT!");

    const keepLearning =
        await T("KEEP LEARNING");

    const nextStep =
        await T("NEXT STEP");

    const feedbackWrap =
        document.createElement("div");

    feedbackWrap.innerHTML = `

        <div class="card">

            <h3 style="color:${
                isCorrect
                    ? '#22c55e'
                    : '#ef4444'
            }">

                ${
                    isCorrect
                        ? excellent
                        : keepLearning
                }

            </h3>

            <p>${explanation}</p>

        </div>

        <button id="continueBtn" disabled>
            ...
        </button>
    `;

    document
        .getElementById("app")
        .appendChild(feedbackWrap);

    narrate(explanation, () => {

        unlockContinue(
            nextStep,
            nextBlock
        );
    });
}

/* =========================================================
   FLOW CONTROL
========================================================= */

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

    if (
        state.currentIndex >=
        state.missions.length
    ) {

        state.currentIndex = 0;
    }

    state.phase = "story";

    state.currentBlock = 0;

    render();
}

/* =========================================================
   CONTINUE BUTTON
========================================================= */

function unlockContinue(label, action) {

    const btn =
        document.getElementById("continueBtn");

    if (btn) {

        btn.disabled = false;

        btn.innerText = label;

        btn.onclick = action;
    }
}
