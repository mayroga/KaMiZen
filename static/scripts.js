// ===============================
// scripts.js (ACTUALIZADO COMPLETO)
// ===============================

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

        showMessage("Sistema activo. Iniciando simulación humana...");

        processEvent(data.next_event);

    }catch(e){
        console.error(e);
    }
}

// =========================================
// 🧠 PROCESS EVENT (HUMANO DINÁMICO)
// =========================================
function processEvent(event){

    if(paused || isGameOver || !sessionActive) return;

    const state = JSON.parse(localStorage.getItem("state") || "{}");
    const identity = state.identity_profile || {};
    const em = state.emotional_memory || {};

    let msg = "";

    if(em.stress > 70){
        msg = "Tu mente está bajo presión constante... no estás descansando internamente.";
    }
    else if(em.loneliness > 60){
        msg = "Hay un patrón silencioso en ti: te estás alejando emocionalmente.";
    }
    else if(identity.archetype === "reactivo"){
        msg = "Tu forma de reaccionar está dominando tus decisiones.";
    }
    else if(event === "crisis"){
        msg = "No es el evento... eres tú frente al evento.";
    }
    else if(event === "tentacion"){
        msg = "No es deseo... es impulso sin control.";
    }
    else{
        msg = "El sistema está reconstruyendo tu patrón interno...";
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
// RESTO SIN CAMBIOS (COMPATIBILIDAD)
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
        showMessage("SISTEMA COLAPSADO");
        return;
    }

    window.currentEvent = data.next_event;
    processEvent(data.next_event);
}

// UI
function showMessage(text){
    const el = document.getElementById("text-content");
    if(el) el.innerText = text;
}

function renderButtons(){
    const container = document.getElementById("options");
    if(!container) return;

    container.innerHTML = "";

    ["TDB","TDM","TDN","TDP","TDG"].forEach(d=>{
        const btn = document.createElement("button");
        btn.innerText = d;
        btn.onclick = ()=>sendDecision(d);
        container.appendChild(btn);
    });
}

// AUTO START
window.onload = ()=>startLifeFlow();
