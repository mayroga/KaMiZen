window.currentEvent = null;
let paused = false;
let isGameOver = false;
let currentPhase = 1;
let sessionActive = false;

// =========================================
// START SYSTEM
// =========================================
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

        showMessage("Sistema activo. Iniciando simulación de vida.");

        processEvent(data.next_event);

        // 🔥 FASE 2 AUTOMÁTICA (7 min)
        setTimeout(()=>{
            activatePhase2();
        }, 7 * 60 * 1000);

        // 🔥 FASE 3 AUTOMÁTICA (12 min total)
        setTimeout(()=>{
            activatePhase3();
        }, 12 * 60 * 1000);

    }catch(e){
        console.error("Error inicio:", e);
        showMessage("ERROR: No se pudo iniciar el sistema");
    }
}

// =========================================
// EVENT SYSTEM
// =========================================
function processEvent(event){

    if(paused || isGameOver || !sessionActive) return;

    window.currentEvent = event;

    const msg = {
        crisis:"Presión económica detectada",
        amor:"Interacción emocional activa",
        tentacion:"Impulso de control interno",
        oportunidad:"Momento de expansión",
        conflicto:"Tensión externa activa",
        enfermedad:"Alerta biológica del sistema",
        dinero:"Flujo de recursos activo"
    };

    showMessage(msg[event] || "Evento activo en el sistema");

    renderButtons();

    clearTimeout(window.autoDecision);

    window.autoDecision = setTimeout(()=>{
        if(!paused && !isGameOver){
            sendDecision("TDM");
        }
    }, 8000);
}

// =========================================
// JUEZ (BACKEND TVID ENGINE)
// =========================================
async function sendDecision(decision){

    if(paused || isGameOver || !sessionActive) return;

    const session_id = localStorage.getItem("session_id");

    try{

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

        if(data.status === "cooldown") return;

        if(data.status === "recovery"){
            showMessage("FASE DE RECUPERACIÓN ACTIVA");
            return;
        }

        if(data.status === "end"){
            gameOver(data.type);
            return;
        }

        window.currentEvent = data.next_event;

        processEvent(data.next_event);

    }catch(e){
        console.error("Error juez:", e);
        showMessage("ERROR DE CONEXIÓN CON EL JUEZ");
    }
}

// =========================================
// BOTONES TVID
// =========================================
function renderButtons(){

    const container = document.getElementById("options");
    if(!container) return;

    container.innerHTML = "";

    const decisions = ["TDB","TDM","TDN","TDP","TDG"];

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
    resumeBtn.onclick = ()=>{ paused = false; processEvent(window.currentEvent); };

    const resetBtn = document.createElement("button");
    resetBtn.innerText = "REINICIAR";
    resetBtn.onclick = ()=>location.reload();

    container.appendChild(pauseBtn);
    container.appendChild(resumeBtn);
    container.appendChild(resetBtn);
}

// =========================================
// MENSAJES
// =========================================
function showMessage(text){
    const el = document.getElementById("text-content");
    if(el) el.innerText = text;
    speak(text);
}

// =========================================
// VOZ
// =========================================
function speak(text){
    if(!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "es-ES";
    msg.rate = 1;
    window.speechSynthesis.speak(msg);
}

// =========================================
// GAME OVER
// =========================================
function gameOver(reason){

    isGameOver = true;

    showMessage("SISTEMA COLAPSADO: " + reason);

    const container = document.getElementById("options");
    if(container){
        container.innerHTML = '<button onclick="location.reload()">REINICIAR SISTEMA</button>';
    }
}

// =========================================
// FASE 2: RESPIRACIÓN (7 min)
// =========================================
function activatePhase2(){

    currentPhase = 2;

    showMessage("FASE 2 ACTIVADA: RESPIRACIÓN CONSCIENTE");

    let cycle = 0;

    window.phase2Interval = setInterval(()=>{

        if(isGameOver) return clearInterval(window.phase2Interval);

        const steps = [
            "INSPIRA... control",
            "RETÉN... conciencia",
            "EXHALA... libera",
            "OBSERVA... calma"
        ];

        showMessage(steps[cycle % steps.length]);
        cycle++;

    }, 4000);
}

// =========================================
// FASE 3: SILENCIO + MEDITACIÓN (5–9 min)
// =========================================
function activatePhase3(){

    currentPhase = 3;

    showMessage("FASE 3: SILENCIO Y MEDITACIÓN");

    clearInterval(window.phase2Interval);

    let t = 0;

    window.phase3Interval = setInterval(()=>{

        if(isGameOver) return clearInterval(window.phase3Interval);

        const steps = [
            "SILENCIO",
            "RESPIRA LENTO",
            "NO REACCIONES",
            "OBSERVA TU MENTE",
            "PAZ INTERNA"
        ];

        showMessage(steps[t % steps.length]);
        t++;

        if(t > 75){
            endCycle();
        }

    }, 4000);
}

// =========================================
// FIN CICLO
// =========================================
function endCycle(){

    clearInterval(window.phase3Interval);

    showMessage("CICLO COMPLETO. REINICIO.");

    setTimeout(()=>location.reload(), 5000);
}

// =========================================
// AUTO START
// =========================================
window.onload = ()=>startLifeFlow();


// ===================================================================
// ===================== 🔥 AGREGADO TVID SYSTEM 🔥 ===================
// ===================================================================

// TVID TACTICAL GUIDE (NUEVO)
const TacticalGuide = {
    "crisis": "TDP",
    "conflicto": "TDG",
    "amor": "TDK",
    "enfermedad": "TDMM",
    "oportunidad": "TDB"
};

// HANDLE ACTION (TVID INTELIGENTE)
async function handleAction(userDecision){

    const event = window.currentEvent;
    const session_id = localStorage.getItem("session_id");

    let finalDecision = userDecision;

    if (TacticalGuide[event] === userDecision) {
        console.log("TVID sincronizado: +Karma");
    }

    const res = await fetch("/judge", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            session_id,
            decision: finalDecision,
            context: event
        })
    });

    const data = await res.json();

    if(data.state){
        localStorage.setItem("state", JSON.stringify(data.state));
    }

    if(data.status === "end"){
        gameOver(data.type);
        return;
    }

    if(data.status === "recovery"){
        showMessage("FASE DE RECUPERACIÓN ACTIVA");
        return;
    }

    window.currentEvent = data.next_event;
    processEvent(data.next_event);

    if(data.phase_alert === 3){
        activatePhase3();
    }
}
