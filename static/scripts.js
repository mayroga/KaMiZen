// ===============================
// scripts.js (FASE 3 + MOTOR PSICOLÓGICO + NARRATIVA REAL)
// ===============================

window.currentEvent = null;
let paused = false;
let isGameOver = false;
let currentPhase = 1;
let sessionActive = false;

// ===============================
// START SYSTEM
// ===============================
async function startLifeFlow(){

    try{

        let profile = JSON.parse(localStorage.getItem("profile")) || {
            age:18,
            difficulty:1,
            emotion:"neutral"
        };

        const res = await fetch("/start",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({profile})
        });

        const data = await res.json();

        if(data.session_id){
            localStorage.setItem("session_id", data.session_id);
        }

        localStorage.setItem("state", JSON.stringify(data.state));

        window.currentEvent = data.next_event;
        sessionActive = true;

        showMessage(data.narrative || "Sistema activo. Iniciando simulación humana...");

        processEvent(data.next_event);

    }catch(e){
        console.error(e);
    }
}


// =========================================
// 🧠 PROCESS EVENT (FASE 3 - PSICOLOGÍA REAL)
// =========================================
function processEvent(event){

    if(paused || isGameOver || !sessionActive) return;

    const state = JSON.parse(localStorage.getItem("state") || "{}");

    const identity = state.identity || {};
    const psychology = state.psychology || {};
    const memory = state.memory || {};

    let msg = "";

    // ===============================
    // 🧠 ESTADO PSICOLÓGICO REAL
    // ===============================

    if(psychology.stress_memory > 70){
        msg = "Tu sistema nervioso está saturado. No es el evento: eres tú acumulando presión.";
    }
    else if(psychology.trauma_index > 60){
        msg = "Hay experiencias que aún no has procesado. Tu mente las repite sin control.";
    }
    else if(psychology.self_control < 40){
        msg = "Estás reaccionando más de lo que decides. El impulso está ganando.";
    }
    else if(identity.core_state === "fragmentado"){
        msg = "Tu identidad está operando en partes separadas. No hay una sola versión de ti.";
    }
    else if(identity.core_state === "colapsando"){
        msg = "Estás en modo supervivencia emocional. Todo se siente más intenso de lo real.";
    }

    // ===============================
    // EVENTOS VIVOS
    // ===============================
    else if(event === "crisis"){
        msg = "La presión externa está activando tu mundo interno.";
    }
    else if(event === "tentacion"){
        msg = "No es deseo. Es un patrón repetido buscando control.";
    }
    else if(event === "conflicto"){
        msg = "Tu respuesta emocional está definiendo el resultado más que el evento.";
    }
    else{
        msg = "El sistema está observando cómo te conviertes en tu patrón.";
    }

    showMessage(msg);
    renderButtons();

    clearTimeout(window.autoDecision);

    window.autoDecision = setTimeout(()=>{
        if(!paused && !isGameOver){
            sendDecision("TDM");
        }
    }, 8000);
}


// =========================================
// DECISION ENGINE
// =========================================
async function sendDecision(decision){

    if(paused || isGameOver || !sessionActive) return;

    const session_id = localStorage.getItem("session_id");

    const res = await fetch("/judge",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            session_id,
            decision,
            context:window.currentEvent || "neutral"
        })
    });

    const data = await res.json();

    if(data.state){
        localStorage.setItem("state", JSON.stringify(data.state));
    }

    if(data.status === "end"){
        isGameOver = true;
        showMessage("SISTEMA COLAPSADO: fin del ciclo humano");
        return;
    }

    if(data.narrative){
        showMessage(data.narrative);
    }

    window.currentEvent = data.next_event;
    processEvent(data.next_event);
}


// =========================================
// UI SISTEMA
// =========================================
function showMessage(text){
    const el = document.getElementById("text-content");
    if(el) el.innerText = text;
}

function renderButtons(){

    const container = document.getElementById("options");
    if(!container) return;

    container.innerHTML = "";

    const decisions = ["TDB","TDM","TDN","TDP","TDG","TDMM"];

    decisions.forEach(d=>{
        const btn = document.createElement("button");
        btn.innerText = d;
        btn.onclick = ()=>sendDecision(d);
        container.appendChild(btn);
    });

    const pauseBtn = document.createElement("button");
    pauseBtn.innerText = "PAUSA";
    pauseBtn.onclick = ()=>paused = true;

    const resumeBtn = document.createElement("button");
    resumeBtn.innerText = "CONTINUAR";
    resumeBtn.onclick = ()=>paused = false;

    container.appendChild(pauseBtn);
    container.appendChild(resumeBtn);
}


// =========================================
// AUTO START
// =========================================
window.onload = ()=>startLifeFlow();
