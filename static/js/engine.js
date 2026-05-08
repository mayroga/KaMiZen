/* =========================================================
   KAMIZEN ENGINE V13 - PROFESSIONAL ADVISORY EDITION
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
    timeLeft: 0
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
   INICIALIZACIÓN DEL SISTEMA
========================= */
window.addEventListener("load", async () => {
    loadProgress();
    await loadAllData();
    showIntro();
});

async function loadAllData() {
    const app = document.getElementById("app");
    app.innerHTML = `<div class="card"><h2>SYSTEM BOOTING...</h2><p>Loading Data...</p></div>`;
    try {
        const [storiesReq, missionsReq] = await Promise.all([
            fetch("/api/stories"),
            fetch("/api/missions")
        ]);
        const storiesData = await storiesReq.json();
        const missionsData = await missionsReq.json();

        state.stories = Array.isArray(storiesData.stories) ? storiesData.stories.sort((a, b) => a.id - b.id) : [];
        state.missions = Array.isArray(missionsData.missions) ? missionsData.missions.sort((a, b) => a.id - b.id) : [];
        state.initialized = true;
    } catch (err) {
        app.innerHTML = `<div class="card"><h2>BOOT ERROR</h2><p>Check API Connection</p></div>`;
    }
}

/* =========================
   CONTROLES DE NAVEGACIÓN
========================= */
function jumpToBlock() {
    const targetMissionId = prompt("Enter MISSION ID:");
    if (targetMissionId) {
        const idx = state.missions.findIndex(m => m.id === Number(targetMissionId));
        if (idx !== -1) {
            window.speechSynthesis.cancel();
            clearInterval(state.timer);
            state.currentIndex = idx;
            state.currentBlock = 0;
            state.phase = "story";
            render();
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
    if(confirm("RESTART SYSTEM?")) {
        localStorage.clear();
        state.currentIndex = 0;
        state.currentBlock = 0;
        state.phase = "story";
        render();
    }
}

/* =========================
   MOTOR DE RENDERIZADO
========================= */
function showIntro() {
    state.phase = "intro";
    document.getElementById("app").innerHTML = `
        <div class="card center">
            <h1>AL CIELO</h1>
            <p>Training • Awareness • Control</p>
            <button onclick="startSystem()">CONTINUE MISSION</button>
            <button onclick="restartSystem()" style="background:var(--danger);margin-top:10px;">RESET PROGRESS</button>
        </div>
    `;
}

function startSystem() {
    state.phase = "story";
    render();
}

function render() {
    if (!state.initialized) return;
    saveProgress();
    const app = document.getElementById("app");
    const story = state.stories[state.currentIndex];
    const mission = state.missions[state.currentIndex];

    if (!story || !mission) {
        state.currentIndex = 0; state.currentBlock = 0;
        state.phase = "story"; return render();
    }

    let navHeader = `
        <div style="display:flex;gap:5px;margin-bottom:10px;">
            <button onclick="goBack()" style="flex:1;padding:8px;font-size:11px;background:#334155;">BACK</button>
            <button onclick="jumpToBlock()" style="flex:1;padding:8px;font-size:11px;background:#0ea5e9;">JUMP</button>
            <button onclick="restartSystem()" style="flex:1;padding:8px;font-size:11px;background:var(--danger);">RESET</button>
        </div>
    `;

    if (state.phase === "story") {
        app.innerHTML = navHeader + `
            <div class="card">
                <h2 style="color:var(--primary)">STORY ${story.id}</h2>
                <h3>${story.t || ""}</h3>
                <p>${story.en || ""}</p>
            </div>
            <button id="continueBtn" disabled>NARRATING...</button>
        `;
        narrate(`${story.t}. ${story.en}`, () => { setTimeout(startMission, 1000); });
    } else {
        const block = mission.b[state.currentBlock];
        if (!block) { nextStory(); return; }
        renderBlock(block, navHeader);
    }
}

function renderBlock(block, navHeader) {
    const app = document.getElementById("app");
    let html = navHeader;
    let textToRead = "";

    if (block.t === "v" || block.t === "h" || block.t === "c") {
        html += `<div class="card"><h2>${block.tx?.en || ""}</h2></div>`;
        textToRead = block.tx?.en;
    }

    if (block.story) {
        html += `<div class="card"><p>${block.story.en || ""}</p></div>`;
        textToRead = block.story.en;
    }

    if (block.t === "br" || block.t === "breath_auto") {
        html += `
            <div class="card center">
                <div class="breath-circle" id="breathCircle"><span id="breathLabel">...</span></div>
                <h3>${block.tx?.en || ""}</h3>
                <p>${block.inf?.en || ""}</p>
            </div>`;
        textToRead = `${block.tx?.en || ""}. ${block.inf?.en || ""}`;
    }

    if (block.t === "sil") {
        html += `<div class="card center"><h3>${block.tx?.en || ""}</h3><p>${block.inf?.en || ""}</p></div>`;
        textToRead = `${block.tx?.en}. ${block.inf?.en}`;
    }

    if (block.t === "d") {
        html += `<div class="card"><h3>${block.q?.en || ""}</h3>`;
        block.op?.forEach((opt, i) => {
            html += `<div class="answer" onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})">${opt}</div>`;
        });
        html += `</div>`;
        textToRead = `${block.q?.en}. ${block.op.join(". ")}`;
    }

    if (block.t === "r") {
        html += `<div class="card center"><h2>⭐ ${block.tx || "REWARD"}</h2><p>+${block.p || 0} XP</p></div>`;
        textToRead = `${block.tx}. Points earned: ${block.p}`;
    }

    if (block.t !== "d") {
        html += `<button id="continueBtn" disabled>NARRATING...</button>`;
    }

    app.innerHTML = html;

    narrate(textToRead, () => {
        if (block.t === "br" || block.t === "breath_auto") {
            startAutonomousBreathing();
            unlockContinue("CONTINUE", nextBlock);
        } else if (block.t === "sil") {
            unlockContinue("CONTINUE", nextBlock);
        } else if (block.t !== "d") {
            unlockContinue("CONTINUE", nextBlock);
        }
    });
}

/* =========================
   FUNCIONES DE VOZ Y ACCIÓN
========================= */
function narrate(text, callback) {
    if (!text) { if (callback) callback(); return; }
    state.speechLocked = true;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 0.95;
    speech.onend = () => { state.speechLocked = false; if (callback) callback(); };
    window.speechSynthesis.speak(speech);
}

function startAutonomousBreathing() {
    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");
    if (!circle || !label) return;

    let inhale = true;
    const cycle = () => {
        if (!document.getElementById("breathCircle")) return;
        label.innerText = inhale ? "INHALE" : "EXHALE";
        circle.style.transform = inhale ? "scale(1.4)" : "scale(0.8)";
        circle.style.transition = "transform 4s ease-in-out";
        inhale = !inhale;
        setTimeout(cycle, 4000);
    };
    cycle();
}

function selectAnswer(index, correct, explanations) {
    if (state.speechLocked) return;
    const explanation = explanations?.[index] || "";
    const feedback = document.createElement("div");
    feedback.innerHTML = `
        <div class="card">
            <h3 style="color:${index === correct ? '#22c55e' : '#ef4444'}">${index === correct ? "EXCELLENT" : "ADVISORY"}</h3>
            <p>${explanation}</p>
        </div>
        <button id="continueBtn" disabled>NARRATING...</button>`;
    document.getElementById("app").appendChild(feedback);
    narrate(explanation, () => { unlockContinue("NEXT STEP", nextBlock); });
}

function nextBlock() { clearInterval(state.timer); state.currentBlock++; render(); }
function startMission() { state.phase = "mission"; state.currentBlock = 0; render(); }
function nextStory() { state.currentIndex++; state.phase = "story"; state.currentBlock = 0; render(); }

function unlockContinue(label, action) {
    const btn = document.getElementById("continueBtn");
    if (btn) { btn.disabled = false; btn.innerText = label; btn.onclick = action; }
}
