/* static/scripts.js — MAYKAMI / VIA REAL / NEURAL SIMULATOR CORE ENGINE */

const sessionApp = document.getElementById("app");
const mainBtn = document.getElementById("main-btn");
const textContent = document.getElementById("text-content");
const breathCircle = document.getElementById("breath-circle");
const timerDisplay = document.getElementById("timer-display");
const syncDisplay = document.getElementById("streak-display");
const levelDisplay = document.getElementById("level-display");
const bgMusic = document.getElementById("bg-music");

let missions = [];
let currentMission = 0;
let currentBlock = 0;

let state = {
    sync: 100,
    level: 1,
    stress: 0,
    focus: 100,
    karma: 0,
    mode: "idle",
    language: "es"
};

async function loadContent() {
    try {
        const res = await fetch("/static/kamizen_content.json");
        const data = await res.json();
        missions = data.missions || [];
        renderBlock();
    } catch (e) {
        textContent.innerText = "SYSTEM ERROR: CONTENT NOT LOADED";
        console.error(e);
    }
}

function renderBlock() {
    const mission = missions[currentMission];
    if (!mission) {
        textContent.innerText = "SIMULATION COMPLETE";
        mainBtn.innerText = "RESTART";
        mainBtn.onclick = restartSystem;
        return;
    }

    const block = mission.blocks[currentBlock];
    if (!block) {
        currentMission++;
        currentBlock = 0;
        state.level++;
        updateHUD();
        return renderBlock();
    }

    levelDisplay.innerText = `NODE: ${state.level}`;

    switch (block.type) {
        case "voice":
            showVoice(block);
            break;
        case "breathing":
            startBreathing(block);
            break;
        case "quiz":
            showQuiz(block);
            break;
        default:
            textContent.innerText = "UNKNOWN BLOCK TYPE";
    }
}

function showVoice(block) {
    textContent.innerText = block.text?.[state.language] || "";
    mainBtn.innerText = "CONTINUE";
    mainBtn.onclick = nextBlock;
}

function startBreathing(block) {
    breathCircle.style.display = "flex";
    breathCircle.classList.add("breathing-anim");

    let time = block.duration || 5;
    timerDisplay.innerText = time;

    mainBtn.innerText = "SKIP";
    mainBtn.onclick = () => {
        endBreathing();
        nextBlock();
    };

    const interval = setInterval(() => {
        time--;
        timerDisplay.innerText = time;

        state.stress = Math.max(0, state.stress - 2);
        state.sync = Math.min(100, state.sync + 1);
        updateHUD();

        if (time <= 0) {
            clearInterval(interval);
            endBreathing();
            nextBlock();
        }
    }, 1000);
}

function endBreathing() {
    breathCircle.style.display = "none";
    breathCircle.classList.remove("breathing-anim");
}

function showQuiz(block) {
    textContent.innerText = block.question?.[state.language] || "";

    mainBtn.innerText = "ANSWER";

    mainBtn.onclick = () => {
        renderOptions(block);
    };
}

function renderOptions(block) {
    const options = block.options?.[state.language] || [];

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";

    options.forEach((opt, index) => {
        const btn = document.createElement("button");
        btn.innerText = opt;

        btn.onclick = () => evaluateAnswer(block, index);

        container.appendChild(btn);
    });

    textContent.innerHTML = "";
    textContent.appendChild(container);
}

function evaluateAnswer(block, index) {
    const correct = block.correct;

    if (index === correct) {
        state.sync += 5;
        state.focus += 3;
        state.karma += 2;
        textContent.innerText = "✔ CORRECT DECISION";
    } else {
        state.sync -= 10;
        state.stress += 10;
        state.karma -= 5;
        textContent.innerText = "✖ WRONG DECISION — SYSTEM PENALTY";
    }

    clampState();
    updateHUD();

    setTimeout(nextBlock, 1200);
}

function nextBlock() {
    currentBlock++;
    renderBlock();
}

function updateHUD() {
    syncDisplay.innerText = `SYNC: ${state.sync}%`;
}

function clampState() {
    state.sync = Math.max(0, Math.min(100, state.sync));
    state.focus = Math.max(0, Math.min(100, state.focus));
    state.stress = Math.max(0, Math.min(100, state.stress));
}

function restartSystem() {
    currentMission = 0;
    currentBlock = 0;
    state.sync = 100;
    state.stress = 0;
    state.focus = 100;
    state.karma = 0;
    state.level = 1;
    loadContent();
}

/* =========================
   IA JUDGE ENGINE (CORE IDEA)
   =========================
   Esto simula el "juez IA":
   - Python backend puede validar decisiones reales
   - Frontend simula consecuencias inmediatas
*/

async function judgeDecision(payload) {
    try {
        // futuro backend (FastAPI / Python)
        const res = await fetch("/judge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("No judge response");

        return await res.json();
    } catch (e) {
        // fallback local judge (simulación)
        return {
            score: Math.random() > 0.5 ? 1 : -1,
            message: "LOCAL JUDGE MODE"
        };
    }
}

/* integración futura:
   cada quiz puede llamar judgeDecision()
   para evaluación real del backend Python
*/

mainBtn.addEventListener("click", () => {
    if (state.mode === "idle") {
        state.mode = "running";
    }
});

/* INIT */
loadContent();
