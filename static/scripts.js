let currentEvent = null;
let gameState = null;
let playerAge = 18;
let timer = null;

// =========================
// 🔊 VOZ
// =========================
function speak(text){
    window.speechSynthesis.cancel();

    let u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    window.speechSynthesis.speak(u);
}

// =========================
// 🚀 INICIO
// =========================
function start(){

    playerAge = parseInt(document.getElementById("age").value || 18);

    fetch("/start",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({age:playerAge})
    })
    .then(r=>r.json())
    .then(data=>{

        gameState = data.state;
        loadEvent(data.next_event);
    });
}

// =========================
// 🎮 CARGAR EVENTO
// =========================
function loadEvent(eventName){

    currentEvent = eventName;

    let desc = buildEvent(eventName);

    document.getElementById("text-content").innerText = desc;

    speak(desc);

    renderOptions();

    startTimer();
}

// =========================
// 🧠 EVENTOS DINÁMICOS
// =========================
function buildEvent(name){

    switch(name){

        case "rechazo":
            return "Alguien te ignora. Tu reacción define tu futuro.";

        case "amor":
            return "Una conexión emocional aparece en tu vida.";

        case "dinero":
            return "Oportunidad económica detectada.";

        case "crisis":
            return "Problema financiero crítico aparece.";

        case "tentacion":
            return "Una tentación intenta controlarte.";

        case "soledad":
            return "Sientes aislamiento social profundo.";

        case "ansiedad":
            return "Tu mente entra en presión interna.";

        case "enfermedad":
            return "Tu cuerpo muestra debilidad.";

        default:
            return "La vida continúa...";
    }
}

// =========================
// 🎯 OPCIONES TVID
// =========================
function renderOptions(){

    const box = document.getElementById("options");
    box.innerHTML = "";

    const choices = ["TDB","TDM","TDN","TDP","TDG","TDK"];

    choices.forEach(c=>{

        let btn = document.createElement("button");
        btn.innerText = c;

        btn.onclick = ()=>{

            clearTimeout(timer);
            sendDecision(c);
        };

        box.appendChild(btn);
    });
}

// =========================
// ⏳ TIMER (DECIDE POR TI)
// =========================
function startTimer(){

    clearTimeout(timer);

    timer = setTimeout(()=>{

        speak("No decidiste. La vida decide por ti.");

        sendDecision("TDM");

    }, 6000);
}

// =========================
// 🧠 MOTOR REAL
// =========================
function sendDecision(decision){

    fetch("/judge",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            decision:decision,
            context:currentEvent
        })
    })
    .then(r=>r.json())
    .then(data=>{

        gameState = data.state;

        showState(data.state);

        if(data.status === "end"){
            endGame(data.type);
            return;
        }

        setTimeout(()=>{
            loadEvent(data.next_event);
        }, 1200);
    });
}

// =========================
// 📊 UI VIDA
// =========================
function showState(s){

    document.getElementById("text-content").innerText =
        `MENTAL:${s.mental}
SALUD:${s.health}
DINERO:${s.money}
SOCIAL:${s.social}
DISCIPLINA:${s.discipline}
EDAD:${s.age.toFixed(1)}`;
}

// =========================
// 💀 FINAL
// =========================
function endGame(type){

    let msg = "";

    if(type==="muerte_fisica") msg="Tu vida terminó.";
    if(type==="colapso_mental") msg="Tu mente colapsó.";
    if(type==="aislamiento_total") msg="Te desconectaste del mundo.";

    document.getElementById("text-content").innerText = msg;

    speak(msg);

    document.getElementById("options").innerHTML = "";

    let btn = document.createElement("button");
    btn.innerText = "REINICIAR";
    btn.onclick = ()=>location.reload();

    document.getElementById("options").appendChild(btn);
}
