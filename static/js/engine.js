/* =========================================================
   KAMIZEN ENGINE V14 - FULL VERSION WITH PDF REPORT
   ✔ Persistencia Local (LocalStorage)
   ✔ Narración Total: Preguntas + Opciones + Feedback
   ✔ Guía Vocal de Respiración (Visual)
   ✔ Botón JUMP/SKIP para navegación directa
   ✔ Soporte completo: v, h, story, br, sil, d, r, c
   ✔ Master Timer: 15 Minutes
   ✔ Auto-Flow: Solo para historias y bloques de texto
   ✔ REPORT INTEGRATION: PDF Result generation
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
    language: localStorage.getItem("kamizen_lang") || "en"
};

/* =========================
   LANGUAGE TOGGLE SYSTEM (ADDED)
========================= */

function toggleLanguage() {
    state.language = state.language === "en" ? "es" : "en";
    localStorage.setItem("kamizen_lang", state.language);
    render();
}

async function tr(text) {
    if (!text) return "";
    if (state.language === "en") return text;

    try {
        const res = await fetch(
            "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=" +
            encodeURIComponent(text)
        );
        const data = await res.json();
        return data[0].map(x => x[0]).join("");
    } catch (e) {
        return text;
    }
}

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
   INICIALIZACIÓN DEL SISTEMA
========================= */

window.addEventListener("load", async () => {
    loadProgress();
    await loadAllData();
    showIntro();
});

async function loadAllData() {
    const app = document.getElementById("app");
    app.innerHTML = `<div class="card"><h2>SYSTEM BOOTING...</h2><p>Loading Data (Missions 1-63)...</p></div>`;
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
        app.innerHTML = `<div class="card"><h2>BOOT ERROR</h2><p>Check API Connection</p></div>`;
    }
}

/* =========================
   TIMER
========================= */

function startMasterTimer() {
    state.sessionStartTime = Date.now();
    setTimeout(() => finishSession(), 15 * 60 * 1000);
}

function finishSession() {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);

    const currentMissionId = state.missions[state.currentIndex]?.id || 0;

    if (typeof renderValidationScreen === "function") {
        renderValidationScreen(currentMissionId, {
            timeSpent: "15:00",
            status: "Complete"
        });
    } else {
        const app = document.getElementById("app");
        const notes = `
        <h2>🌟 GREAT JOB TODAY</h2>
        <p>You completed your KAMIZEN session.</p>
        <p>Small daily training creates powerful minds.</p>
        <button onclick="location.reload()">FINISH SESSION</button>
        `;
        app.innerHTML = `<div class="card center animated fadeIn">${notes}</div>`;
        narrate("Session complete");
    }
}

/* =========================
   NAVIGATION
========================= */

function jumpToBlock() {
    const targetMissionId = prompt("Enter the MISSION ID (1-63):");
    const idNum = Number(targetMissionId);
    const idx = state.missions.findIndex(m => m.id === idNum);
    if (idx !== -1) {
        window.speechSynthesis.cancel();
        clearInterval(state.timer);
        state.currentIndex = idx;
        state.currentBlock = 0;
        state.phase = "story";
        render();
    }
}

function goBack() {
    window.speechSynthesis.cancel();
    clearInterval(state.timer);
    state.speechLocked = false;

    if (state.currentBlock > 0) state.currentBlock--;
    else if (state.currentIndex > 0) {
        state.currentIndex--;
        state.currentBlock = 0;
    }
    render();
}

function restartSystem() {
    if (confirm("Restart?")) {
        localStorage.clear();
        state.currentIndex = 0;
        state.currentBlock = 0;
        render();
    }
}

/* =========================
   RENDER
========================= */

function showIntro() {
    state.phase = "intro";
    document.getElementById("app").innerHTML = `
        <div class="card center">
            <h1>KAMIZEN LIFE SYSTEM</h1>
            <button onclick="startSystem()">CONTINUE</button>
        </div>
    `;
}

function startSystem() {
    startMasterTimer();
    state.phase = "story";
    render();
}

function render() {
    if (!state.initialized) return;
    saveProgress();

    const app = document.getElementById("app");
    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    let navHeader = `
        <div style="display:flex;gap:5px;margin-bottom:10px;">
            <button onclick="goBack()">BACK</button>
            <button onclick="jumpToBlock()">JUMP</button>
            <button onclick="restartSystem()">RESET</button>

            <!-- ⭐ LANGUAGE BUTTON ADDED -->
            <button onclick="toggleLanguage()" style="background:#16a34a;">
                ${state.language === "en" ? "ESPAÑOL" : "ENGLISH"}
            </button>
        </div>
    `;

    if (state.phase === "story") {
        app.innerHTML = navHeader + `
            <div class="card">
                <h2>${story.t || ""}</h2>
                <p>${story.en || ""}</p>
            </div>
            <button id="continueBtn" disabled>NARRATING...</button>
        `;

        narrate(`${story.t}. ${story.en}`, () => {
            setTimeout(startMission, 1200);
        });

    } else {
        const block = mission.b[state.currentBlock];
        if (!block) return nextStory();
        renderBlock(block, navHeader);
    }
}

/* =========================
   BLOCKS
========================= */

function renderBlock(block, navHeader) {
    const app = document.getElementById("app");
    let html = navHeader;
    let textToRead = "";

    const t = (txt) => state.language === "en" ? txt : txt;

    if (block.t === "v" || block.t === "h") {
        html += `<div class="card"><h2>${block.tx?.en}</h2></div>`;
        textToRead = block.tx?.en;
    }

    if (block.story) {
        html += `<div class="card"><p>${block.story.en}</p></div>`;
        textToRead = block.story.en;
    }

    if (block.t === "d") {
        html += `<div class="card"><h3>${block.q?.en}</h3>`;
        block.op?.forEach((opt, i) => {
            html += `<div class="answer">${opt}</div>`;
        });
        html += `</div>`;
        textToRead = block.q?.en;
    }

    if (block.t !== "d") {
        html += `<button id="continueBtn" disabled>NARRATING...</button>`;
    }

    app.innerHTML = html;

    narrate(textToRead, () => nextBlock());
}

/* =========================
   NARRATION (UPDATED ONLY HERE)
========================= */

async function narrate(text, callback) {
    if (!text) return callback?.();

    state.speechLocked = true;
    window.speechSynthesis.cancel();

    const finalText = await tr(text);

    const speech = new SpeechSynthesisUtterance(finalText);
    speech.lang = state.language === "es" ? "es-US" : "en-US";
    speech.rate = 0.9;

    speech.onend = () => {
        state.speechLocked = false;
        callback?.();
    };

    window.speechSynthesis.speak(speech);
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
    state.currentBlock = 0;
    state.phase = "story";
    render();
}
