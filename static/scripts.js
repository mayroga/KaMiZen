// ===============================
// KAMIZEN LIFE ENGINE - CINEMATIC CORE v3.2 (UNIFIED)
// FULL STABLE ENGINE - NO CONFLICTS
// ===============================

window.currentEvent = null;

let paused = false;
let isGameOver = false;
let sessionActive = false;
let autoLock = false;
let systemReady = false;

// ===============================
// START SYSTEM
// ===============================
async function startLifeFlow() {

    if (systemReady) return;
    systemReady = true;

    try {

        const profile = JSON.parse(localStorage.getItem("profile")) || {
            age: 18,
            difficulty: 1,
            emotion: "neutral",
            name: "PLAYER"
        };

        const res = await fetch("/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile })
        });

        const data = await res.json();

        if (!data.session_id) {
            showMessage("SYSTEM ERROR: Missing session ID");
            return;
        }

        localStorage.setItem("session_id", data.session_id);
        localStorage.setItem("state", JSON.stringify(data.state || {}));

        window.currentEvent = data.next_event || "start";
        sessionActive = true;

        showMessage(data.narrative || "KAMIZEN SYSTEM INITIALIZED");

        renderButtons();
        processEvent(window.currentEvent);

    } catch (e) {
        console.error("START ERROR:", e);
        showMessage("CONNECTION ERROR: SERVER NOT RESPONDING");
    }
}

// ===============================
// 🎬 EVENT ENGINE (TVID CORE + PSYCHOLOGICAL FILTER)
// ===============================
function processEvent(event) {

    if (paused || isGameOver || !sessionActive) return;

    const state = JSON.parse(localStorage.getItem("state") || "{}");
    const psy = state.psychology || {};
    const identity = state.identity || {};

    let msg = "";

    // ===============================
    // CORE EVENTS
    // ===============================
    switch (event) {

        case "tentacion":
            msg = "Someone requests something small… but it affects your balance.";
            break;

        case "crisis":
            msg = "Environmental pressure increases. Stability is tested.";
            break;

        case "conflicto":
            msg = "A social decision demands immediate response.";
            break;

        case "dinero":
            msg = "A financial opportunity appears in your system.";
            break;

        case "amor":
            msg = "An emotional connection activates internal response.";
            break;

        case "oportunidad":
            msg = "System detects potential growth pathway.";
            break;

        default:
            msg = "You are inside a decision that shapes identity.";
    }

    // ===============================
    // PSYCHOLOGICAL OVERRIDE LAYER
    // ===============================
    if (psy.stress_memory > 70) {
        msg = "MENTAL OVERLOAD: Your reaction is stronger than the event itself.";
    }

    if (psy.trauma_index > 60) {
        msg = "PAST INFLUENCE DETECTED: Old patterns affecting present decision.";
    }

    if (identity.core_state === "fragmentado") {
        msg = "IDENTITY FRACTURE: Automatic responses overriding consciousness.";
    }

    if (identity.core_state === "colapsando") {
        msg = "SURVIVAL MODE ACTIVE: Emotional collapse in progress.";
    }

    showMessage(msg);

    renderButtons();

    // ===============================
    // AUTO DECISION SYSTEM (REAL HUMAN BEHAVIOR SIMULATION)
    // ===============================
    clearTimeout(window.autoDecision);

    window.autoDecision = setTimeout(() => {

        if (!paused && !isGameOver && sessionActive) {
            sendDecision("TDM"); // default stress reaction
        }

    }, 9000);
}

// ===============================
// DECISION ENGINE (BACKEND COMMUNICATION)
// ===============================
async function sendDecision(decision) {

    if (!sessionActive || isGameOver || autoLock) return;

    const session_id = localStorage.getItem("session_id");

    if (!session_id) {
        showMessage("SYSTEM ERROR: Session not found");
        return;
    }

    autoLock = true;

    try {

        const res = await fetch("/judge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id,
                decision,
                context: window.currentEvent || "neutral"
            })
        });

        const data = await res.json();

        if (data.state) {
            localStorage.setItem("state", JSON.stringify(data.state));
        }

        if (data.status === "end") {
            isGameOver = true;
            showMessage("🔴 SYSTEM TERMINATED: HUMAN CYCLE COMPLETED");
            return;
        }

        if (data.narrative) {
            showMessage(data.narrative);
        }

        window.currentEvent = data.next_event || "neutral";

        processEvent(window.currentEvent);

    } catch (err) {
        console.error("DECISION ERROR:", err);
        showMessage("CONNECTION ERROR: DECISION ENGINE FAILURE");
    }

    setTimeout(() => autoLock = false, 700);
}

// ===============================
// UI SYSTEM
// ===============================
function showMessage(text) {
    const el = document.getElementById("text-content");
    if (el) el.innerText = text;
}

// ===============================
// BUTTON SYSTEM (TVID CORE INTERFACE)
// ===============================
function renderButtons() {

    const container = document.getElementById("options");
    if (!container) return;

    container.innerHTML = "";

    const decisions = ["TDB", "TDM", "TDN", "TDP", "TDG", "TDK"];

    decisions.forEach(d => {
        const btn = document.createElement("button");
        btn.innerText = d;
        btn.onclick = () => sendDecision(d);
        container.appendChild(btn);
    });

    const pauseBtn = document.createElement("button");
    pauseBtn.innerText = "PAUSE";
    pauseBtn.onclick = () => paused = true;

    const resumeBtn = document.createElement("button");
    resumeBtn.innerText = "RESUME";
    resumeBtn.onclick = () => paused = false;

    container.appendChild(pauseBtn);
    container.appendChild(resumeBtn);
}

// ===============================
// SYSTEM INIT
// ===============================
window.onload = () => startLifeFlow();
