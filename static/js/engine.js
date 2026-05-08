/* =========================================================
   KAMIZEN ENGINE V13.5 - FULL ADVISORY EDITION
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
});

async function loadAllData() {
    const surface = document.getElementById("engine-surface");
    if (surface) surface.innerHTML = `<div class="card"><h2>SYSTEM BOOTING...</h2><p>Loading Data...</p></div>`;
    
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
        showIntro();
    } catch (err) {
        if (surface) surface.innerHTML = `<div class="card"><h2>BOOT ERROR</h2><p>Check API Connection</p></div>`;
    }
}

/* =========================
   MOTOR DE RENDERIZADO
========================= */
function showIntro() {
    state.phase = "intro";
    const surface = document.getElementById("engine-surface");
    if (!surface) return;

    surface.innerHTML = `
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
    const surface = document.getElementById("engine-surface");
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
            <button onclick="goBack()" style="flex:1;padding:8px;font-size:11px;background:#334155;">BACK</button>
            <button onclick="restartSystem()" style="flex:1;padding:8px;font-size:11px;background:var(--danger);">RESET</button>
        </div>
    `;

    if (state.phase === "story") {
        surface.innerHTML = navHeader + `
            <div class="card">
                <h2 style="color:var(--primary)">STORY ${story.id}</h2>
                <h3>${story.t || ""}</h3>
                <p>${story.en || ""}</p>
            </div>
            <button id="continueBtn" disabled>NARRATING...</button>
        `;
        narrate(`${story.t}. ${story.en}`, () => { 
            setTimeout(() => {
                state.phase = "mission";
                state.currentBlock = 0;
                render();
            }, 1500); 
        });
    } else {
        const block = mission.b[state.currentBlock];
        if (!block) { nextStory(); return; }
        renderBlock(block, navHeader);
    }
}

function renderBlock(block, navHeader) {
    const surface = document.getElementById("engine-surface");
    let content = "";
    let textToRead = "";

    if (block.t === "v" || block.t === "h" || block.t === "c") {
        content = `<h2>${block.tx?.en || ""}</h2>`;
        textToRead = block.tx?.en;
    }

    if (block.story) {
        content = `<p>${block.story.en || ""}</p>`;
        textToRead = block.story.en;
    }

    if (block.t === "br" || block.t === "breath_auto") {
        content = `
            <div class="center">
                <div class="breath-circle" id="breathCircle"><span id="breathLabel">...</span></div>
                <h3>${block.tx?.en || ""}</h3>
                <p>${block.inf?.en || ""}</p>
            </div>`;
        textToRead = `${block.tx?.en || ""}. ${block.inf?.en || ""}`;
    }

    if (block.t === "sil") {
        content = `<div class="center"><h3>${block.tx?.en || ""}</h3><p>${block.inf?.en || ""}</p></div>`;
        textToRead = `${block.tx?.en}. ${block.inf?.en}`;
    }

    if (block.t === "d") {
        content = `<h3>${block.q?.en || ""}</h3>`;
        block.op?.forEach((opt, i) => {
            content += `<div class="answer" onclick="selectAnswer(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})">${opt}</div>`;
        });
        textToRead = `${block.q?.en}. ${block.op.join(". ")}`;
    }

    if (block.t === "r") {
        content = `<div class="center"><h2>⭐ ${block.tx || "REWARD"}</h2><p>+${block.p || 0} XP</p></div>`;
        textToRead = `${block.tx}. Points earned: ${block.p}`;
    }

    surface.innerHTML = navHeader + `<div class="card" id="currentCard">${content}</div>` + (block.t !== "d" ? `<button id="continueBtn" disabled>NARRATING...</button>` : "");

    narrate(textToRead, () => {
        if (block.t === "br" || block.t === "breath_auto") {
            startAutonomousBreathing();
        }
        if (block.t !== "d") {
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
    speech.onend = () => { 
        state.speechLocked = false; 
        if (callback) callback(); 
    };
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
    const card = document.getElementById("currentCard");
    const isCorrect = index === correct;
    const explanation = explanations?.[index] || "";

    card.innerHTML = `
        <div class="center">
            <h3 style="color:${isCorrect ? 'var(--success)' : 'var(--danger)'}">
                ${isCorrect ? "EXCELLENT" : "ADVISORY"}
            </h3>
            <p>${explanation}</p>
        </div>
        <button id="continueBtn" disabled>NARRATING...</button>
    `;

    narrate(explanation, () => {
        unlockContinue("NEXT STEP", nextBlock);
    });
}

function nextBlock() {
    state.currentBlock++;
    render();
}

function nextStory() {
    state.currentIndex++;
    state.phase = "story";
    state.currentBlock = 0;
    render();
}

function goBack() {
    window.speechSynthesis.cancel();
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
        location.reload();
    }
}

function unlockContinue(label, action) {
    const btn = document.getElementById("continueBtn");
    if (btn) {
        btn.disabled = false;
        btn.innerText = label;
        btn.onclick = action;
    }
}
