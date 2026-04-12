// ==========================================
// MAYKAMI - MOTOR NEURAL LIMPIO Y ESTABLE
// ==========================================

// ESTADO GLOBAL
window.currentEvent = null;
let decisionTimer = null;
let startTime = null;
let paused = false;
let isGameOver = false;

// ==========================================
// INICIO DEL SISTEMA
// ==========================================
async function startLifeFlow(){

    console.log("Iniciando sistema MAYKAMI...");

    let profile = JSON.parse(localStorage.getItem("profile")) || {
        age:18,
        difficulty:1,
        emotion:"neutral"
    };

    startTime = Date.now();

    try{

        const res = await fetch("/start",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({profile})
        });

        const data = await res.json();

        if(data.state){
            localStorage.setItem("state", JSON.stringify(data.state));
            if(window.updateSimState) window.updateSimState(data.state);
        }

        window.currentEvent = data.next_event;

        showMessage("Sistema activo. La vida comienza ahora.");
        processEvent(data.next_event);

    }catch(e){
        showMessage("ERROR CONECTANDO CON MOTOR");
        console.error(e);
    }
}

// ==========================================
// PROCESAR EVENTO
// ==========================================
function processEvent(event){

    if(paused || isGameOver) return;

    window.currentEvent = event;

    const messages = {
        crisis:"Presión económica detectada",
        amor:"Interacción emocional activa",
        enfermedad:"Alerta física del sistema",
        oportunidad:"Momento de crecimiento",
        conflicto:"Tensión externa detectada",
        tentacion:"Impulso de evasión",
        dinero:"Flujo financiero activo"
    };

    showMessage(messages[event] || "Evento desconocido");

    renderButtons();

    // TIMER DE DECISIÓN (EVITA FREEZE)
    clearTimeout(decisionTimer);

    decisionTimer = setTimeout(()=>{
        if(!paused && !isGameOver){
            sendDecision("TDM"); // inacción
        }
    },8000);
}

// ==========================================
// ENVIAR DECISIÓN
// ==========================================
async function sendDecision(decision){

    if(paused || isGameOver) return;

    clearTimeout(decisionTimer);

    try{

        const res = await fetch("/judge",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
                decision:decision,
                context:window.currentEvent || "neutral"
            })
        });

        const data = await res.json();

        if(data.state){
            localStorage.setItem("state", JSON.stringify(data.state));
            if(window.updateSimState) window.updateSimState(data.state);
        }

        if(data.status === "end"){
            gameOver(data.type);
            return;
        }

        processEvent(data.next_event);

    }catch(e){
        console.error("Error juez:",e);
    }
}

// ==========================================
// COLISIONES DESDE EL CANVAS
// ==========================================
function handleCollision(type){

    if(paused || isGameOver) return;

    // impacto directo
    showMessage("Impacto: " + type);

    // ENVÍA COMO EVENTO REAL
    sendDecision("ataque_enemigo");
}

// ==========================================
// BOTONES TVID + CONTROL
// ==========================================
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

    // CONTROL
    const pauseBtn = document.createElement("button");
    pauseBtn.innerText = "PARAR";
    pauseBtn.onclick = ()=>paused = true;

    const resumeBtn = document.createElement("button");
    resumeBtn.innerText = "SEGUIR";
    resumeBtn.onclick = ()=>{
        if(paused){
            paused = false;
            processEvent(window.currentEvent);
        }
    };

    const resetBtn = document.createElement("button");
    resetBtn.innerText = "REINICIAR";
    resetBtn.onclick = ()=>location.reload();

    container.appendChild(pauseBtn);
    container.appendChild(resumeBtn);
    container.appendChild(resetBtn);
}

// ==========================================
// MENSAJES
// ==========================================
function showMessage(text){

    const el = document.getElementById("text-content");
    if(el) el.innerText = text;

    speak(text);
}

// ==========================================
// VOZ (SIN BLOQUEAR)
// ==========================================
function speak(text){

    if(!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "es-ES";
    msg.rate = 1;

    window.speechSynthesis.speak(msg);
}

// ==========================================
// GAME OVER
// ==========================================
function gameOver(reason){

    isGameOver = true;

    showMessage("COLAPSO: " + (reason || "FIN"));

    const container = document.getElementById("options");
    if(container){
        container.innerHTML = '<button onclick="location.reload()">REINICIAR</button>';
    }
}

// ==========================================
// TIEMPO REAL (EVITA CONGELAMIENTO)
// ==========================================
setInterval(()=>{
    if(paused || isGameOver) return;

    let state = JSON.parse(localStorage.getItem("state"));
    if(!state) return;

    state.age += 0.01;
    localStorage.setItem("state", JSON.stringify(state));

},2000);

// ==========================================
// AUTO INICIO
// ==========================================
window.onload = ()=>{

    let tries = 0;

    const wait = setInterval(()=>{

        if(typeof startLifeFlow === "function"){
            startLifeFlow();
            clearInterval(wait);
        }

        tries++;
        if(tries > 10){
            console.error("No se pudo iniciar");
            clearInterval(wait);
        }

    },300);
};
