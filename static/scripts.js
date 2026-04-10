// =====================================
// MAYKAMI V3 FINAL - HYBRID ENGINE
// REFLEJO + DECISIÓN + VIDA REAL + IA
// =====================================

let missions = [];
let lang = "es";

let state = {
    money: 1000,
    mental: 100,
    moral: 50,
    stress: 0,
    sync: 100,
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
// LOAD
// ===============================
async function loadGame() {
    try {
        const res = await fetch("/static/kamizen_content.json");
        const data = await res.json();
        missions = data.missions || [];
        render();
    } catch (e) {
        textContent.innerText = "ERROR CARGANDO SISTEMA";
    }
}

// ===============================
// RENDER
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
            textContent.innerText = b.text?.[lang] || "";
            setBtn("CONTINUE");
            break;

        case "breathing":
            runBreathing(b);
            break;

        case "quiz":
            runDecision(b);
            break;

        default:
            textContent.innerText = "EVENTO DESCONOCIDO";
            setBtn("CONTINUE");
            break;
    }
}

// ===============================
// BOTÓN
// ===============================
function setBtn(t) {
    mainBtn.innerText = t;
}

// ===============================
// NEXT
// ===============================
function next() {
    iBlock++;
    render();
}

// ===============================
// RESPIRACIÓN
// ===============================
function runBreathing(b) {
    let t = b.duration || 5;

    breathCircle.style.display = "flex";
    breathCircle.classList.add("breathing-anim");

    textContent.innerText = b.text?.[lang] || "";
    timerDisplay.innerText = t;

    let interval = setInterval(() => {
        t--;
        timerDisplay.innerText = t;

        if (t <= 0) {
            clearInterval(interval);
            breathCircle.style.display = "none";
            breathCircle.classList.remove("breathing-anim");

            state.stress = Math.max(0, state.stress - 10);
            syncHUD();
            next();
        }
    }, 1000);
}

// ===============================
// DECISION + IA
// ===============================
function runDecision(b) {
    textContent.innerHTML = "";

    const q = document.createElement("div");
    q.innerText = b.question?.[lang];
    textContent.appendChild(q);

    (b.options?.[lang] || []).forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.innerText = opt;
        btn.style.margin = "8px";

        btn.onclick = () => judge(idx === b.correct, idx);

        textContent.appendChild(btn);
    });

    setBtn("DECIDE");
}

// ===============================
// JUEZ IA + VIDA REAL
// ===============================
function judge(correct, choiceIndex) {

    let decisionType = correct ? "avoid" : "engage";

    if (correct) {
        state.sync += 5;
        state.mental += 2;
        state.money += 10;
    } else {
        state.sync -= 10;
        state.stress += 10;
        state.mental -= 5;
    }

    applyReality();

    fetch("/judge", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
            decision: decisionType,
            state: state
        })
    })
    .then(r => r.json())
    .then(d => {
        log(`IA: ${d.message} (${d.score})`);
    })
    .catch(()=>{});

    syncHUD();

    // 🔥 ACTIVAR MODO REFLEJO (JET)
    if (Math.random() > 0.6) {
        localStorage.setItem("syncScore", state.sync);
        window.location.href = "/jet";
        return;
    }

    next();
}

// ===============================
// REALIDAD
// ===============================
function applyReality() {

    if (state.stress > 60) {
        state.mental -= 3;
        log("ALTO ESTRÉS → deterioro mental");
    }

    if (state.mental <= 0) {
        log("COLAPSO → reinicio");
        resetGame();
    }
}

// ===============================
// HUD
// ===============================
function syncHUD() {
    streakDisplay.innerText = "SYNC: " + Math.max(0, state.sync) + "%";
}

// ===============================
// LOG
// ===============================
function log(msg) {
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
        sync: 100,
        level: 1
    };

    iMission = 0;
    iBlock = 0;
    render();
}

// ===============================
mainBtn.onclick = () => next();

// ===============================
function endGame() {
    textContent.innerText = "SIMULACIÓN COMPLETA";
    setBtn("RESTART");
    mainBtn.onclick = resetGame;
}

// ===============================
loadGame();
