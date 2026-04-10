/* =========================================
   MAYKAMI / VIA REAL - FULL ENGINE STABLE
========================================= */

const mainBtn = document.getElementById("main-btn");
const textContent = document.getElementById("text-content");
const breathCircle = document.getElementById("breath-circle");
const timerDisplay = document.getElementById("timer-display");
const syncDisplay = document.getElementById("streak-display");
const levelDisplay = document.getElementById("level-display");

let missions = [];
let currentMission = 0;
let currentBlock = 0;

let state = {
    sync: 100,
    stress: 0,
    focus: 100,
    karma: 0,
    level: 1,
    language: "es"
};

/* =========================
   INIT LOAD
========================= */
async function loadContent() {
    try {
        const res = await fetch("/static/kamizen_content.json");
        const data = await res.json();
        missions = data.missions || [];

        textContent.innerText = "PRESS START TO BEGIN SIMULATION";
        mainBtn.innerText = "START";
        mainBtn.onclick = startGame;

    } catch (e) {
        textContent.innerText = "SYSTEM ERROR: CONTENT NOT FOUND";
        console.error(e);
    }
}

function startGame() {
    currentMission = 0;
    currentBlock = 0;
    state.level = 1;

    mainBtn.innerText = "NEXT";
    mainBtn.onclick = nextBlock;

    renderBlock();
}

/* =========================
   CORE RENDER ENGINE
========================= */
function renderBlock() {
    const mission = missions[currentMission];

    if (!mission) {
        finishGame();
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

    levelDisplay.innerText = "NODE: " + state.level;

    switch (block.type) {

        case "voice":
            showVoice(block);
            break;

        case "breathing":
            showBreathing(block);
            break;

        case "quiz":
            showQuiz(block);
            break;

        case "strategy":
            showStrategy(block);
            break;

        case "story":
            showStory(block);
            break;

        default:
            showUnknown(block);
    }
}

/* =========================
   VOICE
========================= */
function showVoice(block) {
    textContent.innerText = block.text?.[state.language] || "";

    mainBtn.style.display = "block";
    mainBtn.innerText = "CONTINUE";
    mainBtn.onclick = nextBlock;
}

/* =========================
   BREATHING
========================= */
function showBreathing(block) {
    breathCircle.style.display = "flex";

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
}

/* =========================
   QUIZ (DECISION ENGINE)
========================= */
function showQuiz(block) {
    textContent.innerText = block.question?.[state.language];

    mainBtn.innerText = "CHOOSE";
    mainBtn.onclick = () => renderOptions(block);
}

function renderOptions(block) {
    const options = block.options?.[state.language] || [];

    textContent.innerHTML = "";

    options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.innerText = opt.toUpperCase();
        btn.style.margin = "8px 0";
        btn.style.width = "100%";
        btn.style.padding = "14px";

        btn.onclick = () => evaluateQuiz(block, i);
        textContent.appendChild(btn);
    });

    mainBtn.style.display = "none";
}

function evaluateQuiz(block, index) {
    mainBtn.style.display = "block";

    if (index === block.correct) {
        state.sync += 5;
        state.focus += 3;
        state.karma += 2;
        textContent.innerText = "✔ CORRECT DECISION";
    } else {
        state.sync -= 10;
        state.stress += 10;
        state.karma -= 3;
        textContent.innerText = "✖ IMPACT DETECTED";
    }

    clamp();
    updateHUD();

    mainBtn.innerText = "NEXT";
    mainBtn.onclick = nextBlock;
}

/* =========================
   STRATEGY NODE
========================= */
function showStrategy(block) {
    textContent.innerText = block.text?.[state.language];

    mainBtn.innerText = "ACKNOWLEDGE";
    mainBtn.onclick = () => {
        state.sync += 2;
        state.stress = Math.max(0, state.stress - 1);
        nextBlock();
    };
}

/* =========================
   STORY NODE
========================= */
function showStory(block) {
    textContent.innerText = block.text?.[state.language];

    mainBtn.innerText = "CONTINUE STORY";
    mainBtn.onclick = () => {
        state.karma += 1;
        nextBlock();
    };
}

/* =========================
   UNKNOWN SAFE FALLBACK
========================= */
function showUnknown(block) {
    textContent.innerText = "UNKNOWN NODE: " + block.type;

    mainBtn.innerText = "CONTINUE";
    mainBtn.onclick = nextBlock;
}

/* =========================
   FLOW CONTROL
========================= */
function nextBlock() {
    currentBlock++;
    renderBlock();
}

function finishGame() {
    textContent.innerText = "SIMULATION COMPLETE";
    mainBtn.innerText = "RESTART";
    mainBtn.onclick = () => location.reload();
}

/* =========================
   HUD
========================= */
function updateHUD() {
    syncDisplay.innerText = "SYNC: " + state.sync + "%";
}

function clamp() {
    state.sync = Math.max(0, Math.min(100, state.sync));
    state.stress = Math.max(0, Math.min(100, state.stress));
    state.focus = Math.max(0, Math.min(100, state.focus));
}

/* =========================
   START
========================= */
loadContent();
