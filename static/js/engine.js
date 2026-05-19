# KAMIZEN ENGINE V15 — FULL MULTILANGUAGE REALTIME TRANSLATION

```javascript
/* =========================================================
   KAMIZEN ENGINE V15 - FULL MULTILANGUAGE VERSION
   =========================================================
   ✔ JSON BASE ONLY IN ENGLISH
   ✔ REALTIME AUTO-TRANSLATION (English -> Spanish)
   ✔ Miami / Latino Parent Friendly
   ✔ Persistencia Local (LocalStorage)
   ✔ Narración Total
   ✔ Narración dinámica según idioma
   ✔ Traducción automática de Stories + Missions
   ✔ Traducción automática de preguntas/opciones
   ✔ Auto Language Detection
   ✔ Botón Language Toggle
   ✔ PDF Report Compatible
   ✔ Voice Narration System
   ✔ Guided Breathing System
   ✔ Jump / Skip Navigation
   ✔ 15 Minute Master Session
   ✔ Full Support:
      v, h, story, br, breath_auto,
      sil, d, r, c
   ✔ Missions 1-63 Ready
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

    // MULTILANGUAGE
    language: "en",
    translationCache: {}
};

/* =========================================================
   LANGUAGE SYSTEM
========================================================= */

function detectLanguage() {
    const saved = localStorage.getItem("kamizen_language");
    if (saved) {
        state.language = saved;
        return;
    }

    const browserLang = navigator.language || "en";

    // Miami Latino priority
    if (browserLang.toLowerCase().includes("es")) {
        state.language = "es";
    } else {
        state.language = "en";
    }
}

function saveLanguage() {
    localStorage.setItem("kamizen_language", state.language);
}

function toggleLanguage() {
    state.language = state.language === "en" ? "es" : "en";
    saveLanguage();
    render();
}

/* =========================================================
   REALTIME TRANSLATION SYSTEM
========================================================= */

async function translateText(text) {

    if (!text) return "";

    // English mode = original
    if (state.language === "en") {
        return text;
    }

    // CACHE
    const cacheKey = `${state.language}_${text}`;

    if (state.translationCache[cacheKey]) {
        return state.translationCache[cacheKey];
    }

    try {

        /* =============================================
           FREE GOOGLE TRANSLATE ENDPOINT
           NO API KEY REQUIRED
        ============================================= */

        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${state.language}&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(url);
        const data = await response.json();

        let translated = text;

        if (Array.isArray(data)) {
            translated = data[0]
                .map(item => item[0])
                .join("");
        }

        state.translationCache[cacheKey] = translated;

        return translated;

    } catch (err) {
        console.warn("Translation error:", err);
        return text;
    }
}

/* =========================================================
   HELPER TRANSLATION
========================================================= */

async function T(value) {

    if (!value) return "";

    // STRING
    if (typeof value === "string") {
        return await translateText(value);
    }

    // MULTILANGUAGE OBJECT
    if (typeof value === "object") {

        // Native language exists
        if (value[state.language]) {
            return value[state.language];
        }

        // fallback english
        if (value.en) {
            return await translateText(value.en);
        }
    }

    return value;
}

/* =========================================================
   PERSISTENCE SYSTEM
========================================================= */

function saveProgress() {

    localStorage.setItem("kamizen_save", JSON.stringify({
        currentIndex: state.currentIndex,
        currentBlock: state.currentBlock,
        language: state.language
    }));
}

function loadProgress() {

    const saved = localStorage.getItem("kamizen_save");

    if (!saved) return;

    try {

        const data = JSON.parse(saved);

        state.currentIndex = data.currentIndex || 0;
        state.currentBlock = data.currentBlock || 0;

        if (data.language) {
            state.language = data.language;
        }

    } catch (err) {
        console.warn(err);
    }
}

/* =========================================================
   INITIALIZATION
========================================================= */

window.addEventListener("load", async () => {

    detectLanguage();
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
        <div class="card center fadeIn">
            <h2>SYSTEM BOOTING...</h2>
            <p>Loading Missions 1-63...</p>
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
            <div class="card center">
                <h2>BOOT ERROR</h2>
                <p>Could not connect to API.</p>
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

/* =========================================================
   FINISH SESSION
========================================================= */

async function finishSession() {

    window.speechSynthesis.cancel();
    clearInterval(state.timer);

    const app = document.getElementById("app");

    const title = await T("GREAT JOB TODAY");
    const line1 = await T("You completed your KAMIZEN session.");
    const line2 = await T("Now you are ready to start your class.");
    const line3 = await T("Come back tomorrow stronger.");
    const buttonText = await T("FINISH SESSION");

    app.innerHTML = `
        <div class="card center fadeIn">
            <h2>${title}</h2>
            <p>${line1}</p>
            <p>${line2}</p>
            <p>${line3}</p>

            <button onclick="location.reload()">
                ${buttonText}
            </button>
        </div>
    `;

    narrate(`${title}. ${line1}. ${line2}. ${line3}`);
}

/* =========================================================
   INTRO SCREEN
========================================================= */

async function showIntro() {

    state.phase = "intro";

    const title = await T("KAMIZEN LIFE SYSTEM");
    const subtitle = await T("Training • Awareness • Control");
    const range = await T("Range: Missions 1-63 Loaded");
    const continueText = await T("CONTINUE MISSION");
    const resetText = await T("RESET PROGRESS");
    const langText = state.language === "en"
        ? "ESPAÑOL"
        : "ENGLISH";

    document.getElementById("app").innerHTML = `

        <div class="card center fadeIn">

            <h1>${title}</h1>
            <p>${subtitle}</p>
            <p class="small">${range}</p>

            <button onclick="startSystem()">
                ${continueText}
            </button>

            <button
                onclick="toggleLanguage()"
                style="margin-top:10px;background:#0ea5e9;"
            >
                ${langText}
            </button>

            <button
                onclick="restartSystem()"
                style="background:var(--danger);margin-top:10px;"
            >
                ${resetText}
            </button>

        </div>
    `;
}

/* =========================================================
   START SYSTEM
========================================================= */

function startSystem() {

    startMasterTimer();

    state.phase = "story";

    render();
}

/* =========================================================
   NAVIGATION
========================================================= */

async function jumpToBlock() {

    const message = await T("Enter Mission ID (1-63)");

    const target = prompt(message);

    if (!target) return;

    const idNum = Number(target);

    const idx = state.missions.findIndex(m => m.id === idNum);

    if (idx === -1) {
        alert("Mission not found");
        return;
    }

    window.speechSynthesis.cancel();
    clearInterval(state.timer);

    state.currentIndex = idx;
    state.currentBlock = 0;
    state.phase = "story";

    render();
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

async function restartSystem() {

    const question = await T("Are you sure you want to restart?");

    if (!confirm(question)) return;

    localStorage.clear();

    state.currentIndex = 0;
    state.currentBlock = 0;
    state.phase = "story";

    render();
}

/* =========================================================
   TIMER SYSTEM
========================================================= */

function startCountdown(seconds, onComplete) {

    clearInterval(state.timer);

    state.timeLeft = seconds;

    const timerDisplay = document.getElementById("timerDisplay");

    state.timer = setInterval(() => {

        state.timeLeft--;

        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;

        if (timerDisplay) {
            timerDisplay.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }

        if (state.timeLeft <= 0) {

            clearInterval(state.timer);

            if (onComplete) onComplete();
        }

    }, 1000);
}

/* =========================================================
   MAIN RENDER
========================================================= */

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

    const backText = await T("BACK");
    const jumpText = await T("JUMP / SKIP");
    const resetText = await T("RESET");

    const navHeader = `

        <div style="display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap;">

            <button
                onclick="goBack()"
                style="flex:1;padding:8px;font-size:12px;background:#334155;"
            >
                ${backText}
            </button>

            <button
                onclick="jumpToBlock()"
                style="flex:1;padding:8px;font-size:12px;background:#0ea5e9;"
            >
                ${jumpText}
            </button>

            <button
                onclick="toggleLanguage()"
                style="flex:1;padding:8px;font-size:12px;background:#8b5cf6;"
            >
                ${state.language === "en" ? "ES" : "EN"}
            </button>

            <button
                onclick="restartSystem()"
                style="flex:1;padding:8px;font-size:12px;background:var(--danger);"
            >
                ${resetText}
            </button>

        </div>
    `;

    /* =========================================
       STORY MODE
    ========================================= */

    if (state.phase === "story") {

        const title = await T(story.t);
        const text = await T(story.en);
        const storyLabel = await T("STORY");
        const narratingText = await T("NARRATING...");

        app.innerHTML = navHeader + `

            <div class="card fadeIn">

                <h2 style="color:var(--primary)">
                    ${storyLabel} ${story.id}
                </h2>

                <h3>${title}</h3>

                <p style="font-size:1.1rem;line-height:1.7;">
                    ${text}
                </p>

            </div>

            <button id="continueBtn" disabled>
                ${narratingText}
            </button>
        `;

        narrate(`${title}. ${text}`, () => {
            setTimeout(startMission, 1200);
        });

        return;
    }

    /* =========================================
       MISSION MODE
    ========================================= */

    const block = mission.b[state.currentBlock];

    if (!block) {
        nextStory();
        return;
    }

    renderBlock(block, navHeader);
}

/* =========================================================
   BLOCK RENDERER
========================================================= */

async function renderBlock(block, navHeader) {

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

        </div>
    `;

    /* =========================================
       TITLE BLOCKS
    ========================================= */

    if (block.t === "v" || block.t === "h") {

        const text = await T(block.tx);

        html += `
            <div class="card fadeIn">
                <h2>${text}</h2>
            </div>
        `;

        textToRead = text;
    }

    /* =========================================
       STORY BLOCK
    ========================================= */

    if (block.story) {

        const storyText = await T(block.story);

        html += `
            <div class="card fadeIn">
                <p>${storyText}</p>
            </div>
        `;

        textToRead = storyText;
    }

    /* =========================================
       BREATHING BLOCK
    ========================================= */

    if (block.t === "breath_auto" || block.t === "br") {

        const tx = await T(block.tx);
        const inf = await T(block.inf);

        html += timerUI + `

            <div class="card center fadeIn">

                <div class="breath-circle" id="breathCircle">
                    <span id="breathLabel">READY</span>
                </div>

                <h3>${tx}</h3>
                <p>${inf}</p>

            </div>
        `;

        textToRead = `${tx}. ${inf}`;
    }

    /* =========================================
       SILENCE BLOCK
    ========================================= */

    if (block.t === "sil") {

        const tx = await T(block.tx);
        const inf = await T(block.inf);

        html += timerUI + `
            <div class="card fadeIn">
                <h3>${tx}</h3>
                <p>${inf}</p>
            </div>
        `;

        textToRead = `${tx}. ${inf}`;
    }

    /* =========================================
       QUESTION BLOCK
    ========================================= */

    if (block.t === "d") {

        const question = await T(block.q);

        html += `<div class="card fadeIn"><h3>${question}</h3>`;

        let optionsForNarration = [];

        for (let i = 0; i < block.op.length; i++) {

            const translatedOption = await T(block.op[i]);

            optionsForNarration.push(translatedOption);

            html += `
                <div
                    class="answer"
                    id="opt-${i}"
                    onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})"
                >
                    ${translatedOption}
                </div>
            `;
        }

        html += `</div>`;

        textToRead = `${question}. ${optionsForNarration.join('. ')}`;
    }

    /* =========================================
       REWARD BLOCK
    ========================================= */

    if (block.t === "r") {

        const tx = await T(block.tx);
        const earned = await T("You earned");

        html += `
            <div class="card center fadeIn">
                <h2>⭐ ${tx}</h2>
                <p style="font-size:1.5rem;">+${block.p || 0} XP</p>
            </div>
        `;

        textToRead = `${tx}. ${earned} ${block.p} XP`;
    }

    /* =========================================
       CONCLUSION BLOCK
    ========================================= */

    if (block.t === "c") {

        const tx = await T(block.tx);

        html += `
            <div class="card fadeIn">
                <p>${tx}</p>
            </div>
        `;

        textToRead = tx;
    }

    /* =========================================
       CONTINUE BUTTON
    ========================================= */

    if (block.t !== "d") {

        const narrating = await T("NARRATING...");

        html += `
            <button id="continueBtn" disabled>
                ${narrating}
            </button>
        `;
    }

    app.innerHTML = html;

    /* =========================================
       NARRATION FLOW
    ========================================= */

    narrate(textToRead, async () => {

        if (block.t === "breath_auto" || block.t === "br") {

            startCountdown(block.d || 24, nextBlock);

            startGuidedBreathing();

            unlockContinue(await T("SKIP"), nextBlock);

        } else if (block.t === "sil") {

            startCountdown(block.d || 24, nextBlock);

            unlockContinue(await T("SKIP"), nextBlock);

        } else if (block.t === "d") {

            // WAIT FOR USER

        } else {

            setTimeout(nextBlock, 1500);
        }
    });
}

/* =========================================================
   VOICE SYSTEM
========================================================= */

function getVoiceLanguage() {

    if (state.language === "es") {
        return "es-US";
    }

    return "en-US";
}

function narrate(text, callback) {

    if (!text) {
        if (callback) callback();
        return;
    }

    state.speechLocked = true;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = getVoiceLanguage();
    speech.rate = 0.92;
    speech.pitch = 1;
    speech.volume = 1;

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

    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");

    if (!circle || !label) return;

    let inhale = true;

    const inhaleText = await T("INHALE");
    const exhaleText = await T("EXHALE");

    const step = () => {

        if (!document.getElementById("breathCircle")) return;

        label.innerText = inhale
            ? inhaleText
            : exhaleText;

        circle.style.transition = "transform 4000ms ease-in-out";

        circle.style.transform = inhale
            ? "scale(1.4)"
            : "scale(0.8)";

        inhale = !inhale;
    };

    step();

    const aniInterval = setInterval(() => {

        if (!document.getElementById("breathCircle") || state.timeLeft <= 0) {
            clearInterval(aniInterval);
            return;
        }

        step();

    }, 4000);
}

/* =========================================================
   ANSWER SYSTEM
========================================================= */

async function selectAnswer(index, correct, explanations) {

    if (state.speechLocked) return;

    const isCorrect = index === correct;

    const explanation = explanations?.[index] || "";

    const translatedExplanation = await T(explanation);

    const excellent = await T("EXCELLENT!");
    const learning = await T("KEEP LEARNING");
    const narrating = await T("NARRATING...");

    const feedbackWrap = document.createElement("div");

    feedbackWrap.innerHTML = `

        <div class="card fadeIn">

            <h3 style="color:${isCorrect ? '#22c55e' : '#ef4444'}">
                ${isCorrect ? excellent : learning}
            </h3>

            <p>${translatedExplanation}</p>

        </div>

        <button id="continueBtn" disabled>
            ${narrating}
        </button>
    `;

    document.getElementById("app").appendChild(feedbackWrap);

    narrate(translatedExplanation, async () => {

        unlockContinue(await T("NEXT STEP"), nextBlock);
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

    if (state.currentIndex >= state.missions.length) {
        state.currentIndex = 0;
    }

    state.phase = "story";
    state.currentBlock = 0;

    render();
}

/* =========================================================
   BUTTON UNLOCK
========================================================= */

function unlockContinue(label, action) {

    const btn = document.getElementById("continueBtn");

    if (!btn) return;

    btn.disabled = false;
    btn.innerText = label;
    btn.onclick = action;
}

/* =========================================================
   OPTIONAL PERFORMANCE BOOST
========================================================= */

// Pre-cache translations for smoother experience
async function precacheCurrentMission() {

    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    if (!story || !mission) return;

    const texts = [];

    texts.push(story.t);
    texts.push(story.en);

    mission.b.forEach(block => {

        if (block.tx?.en) texts.push(block.tx.en);
        if (block.story?.en) texts.push(block.story.en);
        if (block.inf?.en) texts.push(block.inf.en);
        if (block.q?.en) texts.push(block.q.en);

        if (Array.isArray(block.op)) {
            texts.push(...block.op);
        }

        if (Array.isArray(block.ex)) {
            texts.push(...block.ex);
        }
    });

    for (const txt of texts) {
        await translateText(txt);
    }
}

/* =========================================================
   END ENGINE
========================================================= */
```

# RESULT

Ahora puedes:

* Mantener TODOS los JSON solo en inglés
* Traducir automáticamente en tiempo real
* Narrar automáticamente en español o inglés
* Detectar idioma automáticamente
* Cambiar idioma en vivo
* Reducir muchísimo tamaño del JSON
* Evitar duplicar contenido `en/es`
* Optimizar mantenimiento
* Escalar fácilmente a:

  * Español
  * Portugués
  * Francés
  * Creole
  * Etc

# RECOMENDACIÓN IMPORTANTE

Ahora tus JSON deberían verse así:

```json
{
  "id":1,
  "t":"The Hidden Roots of Growth",
  "en":"A tiny seed carries a mighty oak inside."
}
```

NO necesitas:

```json
"es":"..."
```

porque el engine ya traduce automáticamente.
