// =====================================
// MAYKAMI V2 - LIFE REALITY ENGINE
// Simulador de vida + decisiones humanas
// =====================================

let missions = [];
let lang = "en";

let state = {
    money: 1000,
    mental: 100,
    moral: 50,
    stress: 0,
    streak: 0,
    level: 1
};

let iMission = 0;
let iBlock = 0;

// UI
const textContent = document.getElementById("text-content");
const mainBtn = document.getElementById("main-btn");
const breathCircle = document.getElementById("breath-circle");
const timerDisplay = document.getElementById("timer-display");
const streakDisplay = document.getElementById("streak-display");
const levelDisplay = document.getElementById("level-display");

// ===============================
// LOAD SYSTEM
// ===============================
async function loadGame() {
    try {
        const res = await fetch("/static/kamizen_content.json");
        const data = await res.json();
        missions = data.missions || [];
        render();
    } catch (e) {
        textContent.innerText = "SYSTEM ERROR - MAYKAMI CORE FAILED";
    }
}

// ===============================
// CORE RENDER
// ===============================
function render() {
    const m = missions[iMission];
    if (!m) return endGame();

    const b = m.blocks[iBlock];
    if (!b) {
        iMission++;
        iBlock = 0;
        return render();
    }

    levelDisplay.innerText = "LEVEL " + m.level;

    switch (b.type) {

        case "voice":
        case "story":
        case "strategy":
            textContent.innerText = b.text?.[lang] || "NO DATA";
            setBtn("CONTINUE");
            break;

        case "breathing":
            runBreathing(b);
            break;

        case "quiz":
            runQuiz(b);
            break;

        default:
            textContent.innerText = "UNKNOWN EVENT → AUTO FIXED";
            setBtn("CONTINUE");
            break;
    }
}

// ===============================
// BUTTON CONTROL
// ===============================
function setBtn(t) {
    if (mainBtn) mainBtn.innerText = t;
}

// ===============================
// NEXT FLOW
// ===============================
function next() {
    iBlock++;
    render();
}

// ===============================
// BREATHING SYSTEM
// ===============================
function runBreathing(b) {
    let t = b.duration || 5;

    breathCircle.style.display = "flex";
    timerDisplay.innerText = t;
    textContent.innerText = b.text?.[lang] || "";

    setBtn("BREATH CONTROL");

    let interval = setInterval(() => {
        t--;
        timerDisplay.innerText = t;

        if (t <= 0) {
            clearInterval(interval);
            breathCircle.style.display = "none";
            next();
        }
    }, 1000);
}

// ===============================
// QUIZ + LIFE DECISION ENGINE
// ===============================
function runQuiz(b) {
    textContent.innerHTML = "";

    const q = document.createElement("div");
    q.innerText = b.question?.[lang];
    textContent.appendChild(q);

    (b.options?.[lang] || []).forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.innerText = opt;
        btn.style.margin = "8px";
        btn.onclick = () => judge(idx === b.correct, b);
        textContent.appendChild(btn);
    });

    setBtn("DECIDE");
}

// ===============================
// JUDGE ENGINE (MAYKAMI CORE)
// ===============================
function judge(success, block) {

    let eventType = success ? "SUCCESS" : "FAIL";

    // --- PSYCHOLOGICAL IMPACT SYSTEM ---
    if (!success) {
        state.stress += 10;
        state.mental -= 5;
        state.moral -= 2;
        logEvent("CRITICAL FAILURE → Emotional impact detected");
    } else {
        state.money += 20;
        state.streak += 5;
        state.mental += 2;
        logEvent("STABLE DECISION → Adaptation successful");
    }

    applyStressEffects();
    syncHUD();

    // SEND TO BACKEND IA JUDGE
    fetch("/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            success,
            blockType: block.type,
            level: iMission,
            state
        })
    }).catch(() => {});

    next();
}

// ===============================
// STRESS SYSTEM (REAL LIFE LOGIC)
// ===============================
function applyStressEffects() {
    if (state.stress > 70) {
        state.mental -= 5;
        logEvent("HIGH STRESS → Cognitive distortion active");
    }

    if (state.mental <= 0) {
        logEvent("SYSTEM COLLAPSE → Mental reset required");
        resetGame();
    }
}

// ===============================
// HUD
// ===============================
function syncHUD() {
    if (streakDisplay) {
        streakDisplay.innerText = "SYNC " + Math.max(0, state.streak) + "%";
    }
}

// ===============================
// LOG SYSTEM
// ===============================
function logEvent(msg) {
    console.log("[MAYKAMI]", msg);
}

// ===============================
// RESET
// ===============================
function resetGame() {
    state = {
        money: 1000,
        mental: 100,
        moral: 50,
        stress: 0,
        streak: 0,
        level: 1
    };

    iMission = 0;
    iBlock = 0;

    render();
}

// ===============================
// BUTTON ACTION
// ===============================
mainBtn.onclick = () => next();

// ===============================
// INIT
// ===============================
loadGame();

// ===============================
// END GAME
// ===============================
function endGame() {
    textContent.innerText =
        lang === "en"
            ? "SIMULATION COMPLETE - YOU HAVE BEEN EVALUATED"
            : "SIMULACIÓN COMPLETA - HAS SIDO EVALUADO";

    setBtn("RESTART");

    mainBtn.onclick = resetGame;
}
