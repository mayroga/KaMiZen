// =========================
// 🌐 CONFIG GLOBAL
// =========================
let currentLang = 'en';
let music = document.getElementById("bg-music");

let currentEvent = null;
let gameState = null;
let profile = null;

// =========================
// 🌍 TRADUCCIONES
// =========================
const translations = {
    en: {
        start: "START SESSION",
        langBtn: "ESPAÑOL",
        back: "← BACK",
        inhale: "Breathe In",
        exhale: "Exhale",
        continue: "CONTINUE",
        finish: "FINISH SESSION"
    },
    es: {
        start: "INICIAR SESIÓN",
        langBtn: "ENGLISH",
        back: "← ATRÁS",
        inhale: "Inhala",
        exhale: "Exhala",
        continue: "CONTINUAR",
        finish: "FINALIZAR SESIÓN"
    }
};

// =========================
// 🌄 IMÁGENES DINÁMICAS
// =========================
const natureImages = Array.from(
    { length: 100 },
    (_, i) => `https://picsum.photos/id/${i + 20}/1200/800`
);

// =========================
// 🔊 VOZ
// =========================
function speak(text) {

    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    if (music) music.volume = 0.1;

    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = currentLang === 'en' ? 'en-US' : 'es-ES';

    ut.onend = () => {
        if (music) music.volume = 0.4;
    };

    window.speechSynthesis.speak(ut);
}

// =========================
// 🌄 BACKGROUND
// =========================
function updateBackground() {

    const container = document.getElementById("bg-container");
    if (!container) return;

    const imgUrl = natureImages[Math.floor(Math.random() * natureImages.length)];

    const slide = document.createElement("div");
    slide.className = "bg-slide";
    slide.style.backgroundImage = `url('${imgUrl}')`;

    container.appendChild(slide);

    setTimeout(() => slide.style.opacity = "0.7", 100);

    if (container.children.length > 2) {
        container.removeChild(container.children[0]);
    }
}

// =========================
// 🌐 CAMBIO DE IDIOMA
// =========================
function toggleLanguage() {

    currentLang = currentLang === 'en' ? 'es' : 'en';

    document.getElementById("btn-start").innerText = translations[currentLang].start;
    document.getElementById("lang-toggle").innerText = translations[currentLang].langBtn;
    document.getElementById("back-btn").innerText = translations[currentLang].back;

    if (currentEvent) loadEvent(currentEvent);
}

// =========================
// ▶️ START REAL (CONECTA CON BACKEND)
// =========================
async function start() {

    const age = document.getElementById("age").value || 25;

    const res = await fetch("/start", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ age })
    });

    const data = await res.json();

    profile = data.profile;
    gameState = data.state;

    localStorage.setItem("profile", JSON.stringify(profile));
    localStorage.setItem("state", JSON.stringify(gameState));

    // música
    if (music) {
        music.play();
        music.volume = 0.4;
    }

    // UI
    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "block";
    document.getElementById("back-btn").style.display = "block";

    updateBackground();

    // 🔥 iniciar flujo real
    requestNextEvent();
}

// =========================
// 🔙 RESET
// =========================
function resetApp() {

    window.speechSynthesis.cancel();

    document.getElementById("game").style.display = "none";
    document.getElementById("setup").style.display = "block";
    document.getElementById("back-btn").style.display = "none";

    currentEvent = null;
    gameState = null;
    profile = null;

    localStorage.clear();
}

// =========================
// 🌍 PEDIR EVENTO
// =========================
function requestNextEvent() {

    fetch("/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            decision: "INIT",
            context: "start"
        })
    })
    .then(res => res.json())
    .then(data => {

        gameState = data.state;

        if (data.profile) {
            profile = data.profile;
        }

        localStorage.setItem("state", JSON.stringify(gameState));

        loadEvent(data.next_event);
    });
}

// =========================
// 🔥 CARGAR EVENTO
// =========================
function loadEvent(eventName) {

    currentEvent = eventName;

    const eventData = buildEvent(eventName);

    document.getElementById("text-content").innerText = eventData.desc;

    speak(eventData.desc);

    renderOptions(eventData);
}

// =========================
// 🧩 EVENTOS REALES
// =========================
function buildEvent(name) {

    let stage = profile?.stage || "adulto";

    // 🔥 descripciones adaptadas por edad
    const adapt = {
        nino: {
            rechazo: "Alguien no quiere jugar contigo.",
            conflicto: "Alguien discute contigo.",
        },
        adulto: {
            rechazo: "Alguien te ignora completamente.",
            conflicto: "Se genera una confrontación directa.",
        },
        anciano: {
            rechazo: "Sientes abandono emocional.",
            conflicto: "Una tensión emocional aparece.",
        }
    };

    switch(name){

        case "rechazo":
            return {
                desc: adapt[stage]?.rechazo || "Rechazo social detectado.",
                context: "rechazo",
                decisions: ["TDB","TDM","TDG"]
            };

        case "conflicto":
            return {
                desc: adapt[stage]?.conflicto || "Conflicto detectado.",
                context: "conflicto",
                decisions: ["TDB","TDM","TDG"]
            };

        case "perdida":
            return {
                desc: "Pierdes algo importante.",
                context: "perdida",
                decisions: ["TDB","TDM","TDN"]
            };

        case "oportunidad":
            return {
                desc: "Una oportunidad aparece.",
                context: "oportunidad",
                decisions: ["TDB","TDG"]
            };

        case "tentacion":
            return {
                desc: "Sientes una tentación o vicio.",
                context: "tentacion",
                decisions: ["TDB","TDM","TDN"]
            };

        default:
            return {
                desc: "La vida continúa...",
                context: "neutral",
                decisions: ["TDB","TDM","TDN"]
            };
    }
}

// =========================
// 🎮 BOTONES
// =========================
function renderOptions(eventData) {

    const container = document.getElementById("options");
    container.innerHTML = "";

    eventData.decisions.forEach(dec => {

        const btn = document.createElement("button");
        btn.className = "action-btn";
        btn.innerText = dec;

        btn.onclick = () => sendDecision(dec, eventData.context);

        container.appendChild(btn);
    });
}

// =========================
// 🧠 IA CONECTADA
// =========================
function sendDecision(decision, context) {

    document.getElementById("options").innerHTML = "";

    fetch("/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            decision,
            context
        })
    })
    .then(res => res.json())
    .then(data => {

        gameState = data.state;
        localStorage.setItem("state", JSON.stringify(gameState));

        updateBackground();

        // siguiente evento
        loadEvent(data.next_event);
    });
}

// =========================
// 🌬️ RESPIRACIÓN
// =========================
function showBreathCycle() {

    const circle = document.getElementById("breath-circle");
    if (!circle) return;

    const instruction = document.getElementById("breath-instruction");
    const timerDisp = document.getElementById("timer");

    circle.style.display = "flex";

    let time = 4;
    let inhale = true;

    function cycle(){

        instruction.innerText = inhale
            ? translations[currentLang].inhale
            : translations[currentLang].exhale;

        let interval = setInterval(()=>{

            time--;
            timerDisp.innerText = time;

            if(time <= 0){

                clearInterval(interval);

                inhale = !inhale;
                time = 4;

                circle.classList.toggle("inhale");
                circle.classList.toggle("exhale");

                cycle();
            }

        },1000);
    }

    cycle();
}
