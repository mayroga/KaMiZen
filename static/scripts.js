// ===============================
// KAMIZEN LIFE ENGINE - CINEMATIC CORE v3.1 (FIXED)
// ===============================

window.currentEvent = null;
let paused = false;
let isGameOver = false;
let sessionActive = false;

// ===============================
// START SYSTEM
// ===============================
async function startLifeFlow() {

    try {

        const profile = JSON.parse(localStorage.getItem("profile")) || {
            age: 18,
            difficulty: 1,
            emotion: "neutral"
        };

        const res = await fetch("/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile })
        });

        const data = await res.json();

        if (!data.session_id) {
            console.error("No session_id received");
            return;
        }

        localStorage.setItem("session_id", data.session_id);
        localStorage.setItem("state", JSON.stringify(data.state || {}));

        window.currentEvent = data.next_event || "start";
        sessionActive = true;

        showMessage(data.narrative || "Sistema iniciado");

        processEvent(window.currentEvent);

    } catch (e) {
        console.error("START ERROR:", e);
        showMessage("Error al iniciar sistema");
    }
}

// ===============================
// 🎬 CINEMATIC EVENT ENGINE (SESIONES 3–10)
// ===============================
function processEvent(event) {

    if (paused || isGameOver || !sessionActive) return;

    const state = JSON.parse(localStorage.getItem("state") || "{}");

    let msg = "";

    // ===============================
    // EVENTOS PRINCIPALES TVID
    // ===============================
    switch (event) {

        case "tentacion":
            msg = "Alguien te pide algo que parece pequeño… pero puede cambiar tu equilibrio.";
            break;

        case "crisis":
            msg = "El entorno se vuelve tenso. Sientes presión inmediata.";
            break;

        case "conflicto":
            msg = "Una decisión social exige reacción inmediata.";
            break;

        case "dinero":
            msg = "Una oportunidad financiera aparece frente a ti.";
            break;

        case "amor":
            msg = "Una conexión emocional se activa en tu entorno.";
            break;

        case "oportunidad":
            msg = "El sistema detecta una posibilidad de avance.";
            break;

        default:
            msg = "Estás dentro de una decisión que forma tu carácter.";
    }

    // ===============================
    // FILTRO PSICOLÓGICO (FASE 6 BACKEND)
    // ===============================
    const psy = state.psychology || {};
    const identity = state.identity || {};

    if (psy.stress_memory > 70 || psy.stress > 70) {
        msg = "Tu mente está saturada. No es el evento… eres tu reacción acumulada.";
    }

    if (psy.trauma_index > 60) {
        msg = "Experiencias pasadas están influyendo en tu decisión actual.";
    }

    if (identity.core_state === "fragmentado") {
        msg = "Tu identidad se está dividiendo en múltiples respuestas automáticas.";
    }

    if (identity.core_state === "colapsando" || identity.core === "survival") {
        msg = "Estás en modo supervivencia emocional.";
    }

    showMessage(msg);
    renderButtons();

    // ===============================
    // AUTO DECISION (IA SIMULADA)
    // ===============================
    clearTimeout(window.autoDecision);

    window.autoDecision = setTimeout(() => {

        if (!paused && !isGameOver && sessionActive) {
            sendDecision("TDM");
        }

    }, 8000);
}

// ===============================
// DECISION ENGINE (BACKEND REAL)
// ===============================
async function sendDecision(decision) {

    if (!sessionActive || isGameOver) return;

    const session_id = localStorage.getItem("session_id");

    if (!session_id) {
        showMessage("Error: sesión no encontrada");
        return;
    }

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
            showMessage("🔴 SISTEMA TERMINADO: CICLO HUMANO CERRADO");
            return;
        }

        if (data.narrative) {
            showMessage(data.narrative);
        }

        window.currentEvent = data.next_event || "neutral";

        processEvent(window.currentEvent);

    } catch (err) {
        console.error("DECISION ERROR:", err);
        showMessage("Error de conexión con el sistema");
    }
}

// ===============================
// UI SYSTEM
// ===============================
function showMessage(text) {
    const el = document.getElementById("text-content");
    if (el) el.innerText = text;
}

// ===============================
// BUTTON RENDER (TVID SYSTEM)
// ===============================
function renderButtons() {

    const container = document.getElementById("options");
    if (!container) return;

    container.innerHTML = "";

    // TVID CORE SYSTEM
    const decisions = ["TDB", "TDM", "TDN", "TDP", "TDG", "TDK"];

    decisions.forEach(d => {
        const btn = document.createElement("button");
        btn.innerText = d;
        btn.onclick = () => sendDecision(d);
        container.appendChild(btn);
    });

    // CONTROL BUTTONS
    const pauseBtn = document.createElement("button");
    pauseBtn.innerText = "PAUSA";
    pauseBtn.onclick = () => paused = true;

    const resumeBtn = document.createElement("button");
    resumeBtn.innerText = "CONTINUAR";
    resumeBtn.onclick = () => paused = false;

    container.appendChild(pauseBtn);
    container.appendChild(resumeBtn);
}

// ===============================
// INIT
// ===============================
window.onload = () => startLifeFlow();
