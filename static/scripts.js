// =========================
// 🌍 ESTADO GLOBAL
// =========================
let currentLang = 'es';
let music = document.getElementById("bg-music");

let currentEvent = null;
let gameState = null;
let playerAge = 25;
let decisionTimer = null;

// =========================
// 🌐 TRADUCCIÓN
// =========================
const translations = {
    es: {
        start: "INICIAR VIDA",
        back: "← ATRÁS",
        continue: "CONTINUAR",
        finish: "FINALIZAR",
        noDecision: "No decidiste... la vida decidió por ti."
    },
    en: {
        start: "START LIFE",
        back: "← BACK",
        continue: "CONTINUE",
        finish: "FINISH",
        noDecision: "You didn't choose... life chose for you."
    }
};

// =========================
// 🔊 VOZ
// =========================
function speak(text){
    window.speechSynthesis.cancel();

    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = currentLang === 'es' ? 'es-ES' : 'en-US';

    window.speechSynthesis.speak(ut);
}

// =========================
// 🎯 CLASIFICACIÓN POR EDAD
// =========================
function getAgeGroup(age){
    if(age < 13) return "child";
    if(age < 25) return "young";
    if(age < 60) return "adult";
    return "elder";
}

// =========================
// ▶️ INICIO REAL
// =========================
function start(){

    playerAge = parseInt(document.getElementById("age").value) || 25;

    music.play().catch(()=>{});
    music.volume = 0.4;

    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "block";
    document.getElementById("back-btn").style.display = "block";

    requestNextEvent();
}

// =========================
// 🔁 RESET
// =========================
function resetApp(){

    window.speechSynthesis.cancel();

    clearTimeout(decisionTimer);

    document.getElementById("game").style.display = "none";
    document.getElementById("setup").style.display = "block";

    currentEvent = null;
    gameState = null;
}

// =========================
// 🌍 PEDIR EVENTO AL BACKEND
// =========================
function requestNextEvent(){

    fetch("/judge",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
            decision:"INIT",
            context:"life"
        })
    })
    .then(res=>res.json())
    .then(data=>{
        gameState = data.state;
        loadEvent(data.next_event);
    });
}

// =========================
// 🧠 CREAR EVENTO DINÁMICO
// =========================
function buildEvent(name){

    const ageGroup = getAgeGroup(playerAge);

    const base = {
        context:name,
        decisions:["TDB","TDM","TDN","TDP","TDG"]
    };

    // =========================
    // EVENTOS POSITIVOS + NEGATIVOS
    // =========================

    if(name === "oportunidad"){
        return {
            ...base,
            desc: ageGroup === "child"
                ? "Una oportunidad divertida aparece."
                : ageGroup === "young"
                ? "Una oportunidad puede cambiar tu futuro."
                : "Una oportunidad económica aparece.",
        };
    }

    if(name === "amor"){
        return {
            ...base,
            desc: "Sientes conexión emocional con alguien."
        };
    }

    if(name === "dinero"){
        return {
            ...base,
            desc: "Posibilidad de ganar dinero aparece."
        };
    }

    if(name === "rechazo"){
        return {
            ...base,
            desc: "Alguien te ignora completamente."
        };
    }

    if(name === "crisis"){
        return {
            ...base,
            desc: "Problema fuerte afecta tu estabilidad."
        };
    }

    if(name === "tentacion"){
        return {
            ...base,
            desc: "Aparece una tentación peligrosa."
        };
    }

    return {
        ...base,
        desc: "La vida continúa..."
    };
}

// =========================
// 🎮 MOSTRAR EVENTO
// =========================
function loadEvent(eventName){

    currentEvent = buildEvent(eventName);

    document.getElementById("text-content").innerText = currentEvent.desc;

    speak(currentEvent.desc);

    renderOptions(currentEvent);

    startDecisionTimer();
}

// =========================
// ⏳ DECISIÓN AUTOMÁTICA
// =========================
function startDecisionTimer(){

    clearTimeout(decisionTimer);

    decisionTimer = setTimeout(()=>{

        document.getElementById("text-content").innerText =
            translations[currentLang].noDecision;

        speak(translations[currentLang].noDecision);

        sendDecision("TDM", currentEvent.context);

    }, 5000); // 5 segundos para decidir
}

// =========================
// 🎮 OPCIONES (7 TVid)
// =========================
function renderOptions(eventData){

    const container = document.getElementById("options");
    container.innerHTML = "";

    eventData.decisions.forEach(dec=>{

        const btn = document.createElement("button");
        btn.className = "action-btn";
        btn.innerText = dec;

        btn.onclick = ()=>{
            clearTimeout(decisionTimer);
            sendDecision(dec, eventData.context);
        };

        container.appendChild(btn);
    });
}

// =========================
// 🧠 MOTOR REAL
// =========================
function sendDecision(decision, context){

    document.getElementById("options").innerHTML = "";

    fetch("/judge",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
            decision:decision,
            context:context,
            age: playerAge
        })
    })
    .then(res=>res.json())
    .then(data=>{

        gameState = data.state;

        showImpact(data.state);

        if(data.status === "end"){
            showFinal(data.type);
            return;
        }

        // ⏳ tiempo avanza
        playerAge++;

        setTimeout(()=>{
            loadEvent(data.next_event);
        },1500);

    });
}

// =========================
// 📊 CONSECUENCIAS VISUALES
// =========================
function showImpact(state){

    const text = `
    Mental: ${state.mental}
    Salud: ${state.health}
    Dinero: ${state.money}
    Social: ${state.social}
    Disciplina: ${state.discipline}
    `;

    document.getElementById("text-content").innerText = text;
}

// =========================
// 💀 FINAL
// =========================
function showFinal(type){

    let msg = "";

    if(type === "muerte_fisica") msg = "Tu cuerpo no resistió.";
    if(type === "colapso_mental") msg = "Tu mente colapsó.";
    if(type === "equilibrio") msg = "Lograste equilibrio en la vida.";

    document.getElementById("text-content").innerText = msg;

    speak(msg);

    document.getElementById("options").innerHTML = "";

    const btn = document.createElement("button");
    btn.innerText = translations[currentLang].finish;
    btn.onclick = resetApp;

    document.getElementById("options").appendChild(btn);
}
