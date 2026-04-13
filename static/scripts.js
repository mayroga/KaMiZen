// ===============================
// KAMIZEN LIFE ENGINE - CINEMATIC CORE v3.1
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

        localStorage.setItem("session_id", data.session_id);
        localStorage.setItem("state", JSON.stringify(data.state));

        window.currentEvent = data.next_event;
        sessionActive = true;

        showMessage(data.narrative);

        processEvent(data.next_event);

    } catch (e) {
        console.error("START ERROR:", e);
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
    // EVENTOS DEL NUEVO KAMIZEN CONTENT
    // ===============================

    switch (event) {

        case "tentacion":
            msg = "Alguien te pide algo que parece pequeño… pero no lo es.";
            break;

        case "crisis":
            msg = "Un momento de presión aparece en tu entorno.";
            break;

        case "conflicto":
            msg = "Una situación social exige una reacción inmediata.";
            break;

        default:
            msg = "Estás dentro de una decisión que forma tu carácter.";
    }

    // ===============================
    // FILTRO PSICOLÓGICO
    // ===============================
    if (state.psychology?.stress_memory > 70) {
        msg = "Tu mente está saturada. Este no es el evento… eres tú reaccionando.";
    }

    if (state.identity?.core_state === "fragmentado") {
        msg = "Tu identidad no es una sola. Estás actuando por partes.";
    }

    showMessage(msg);
    renderButtons();

    clearTimeout(window.autoDecision);

    window.autoDecision = setTimeout(() => {
        if (!paused && !isGameOver) {
            sendDecision("TDM");
        }
    }, 8000);
}

// ===============================
// DECISION ENGINE
// ===============================
async function sendDecision(decision) {

    if (!sessionActive || isGameOver) return;

    const session_id = localStorage.getItem("session_id");

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
        showMessage("SISTEMA TERMINADO: CICLO CERRADO");
        return;
    }

    if (data.narrative) {
        showMessage(data.narrative);
    }

    window.currentEvent = data.next_event;
    processEvent(data.next_event);
}

// ===============================
// UI
// ===============================
function showMessage(text) {
    const el = document.getElementById("text-content");
    if (el) el.innerText = text;
}

function renderButtons() {

    const container = document.getElementById("options");
    if (!container) return;

    container.innerHTML = "";

    // TVID SYSTEM COHERENTE CON TU JSON
    const decisions = ["TDB", "TDM", "TDN", "TDP", "TDG", "TDK"];

    decisions.forEach(d => {
        const btn = document.createElement("button");
        btn.innerText = d;
        btn.onclick = () => sendDecision(d);
        container.appendChild(btn);
    });

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
window.onload = () => startLifeFlow();
