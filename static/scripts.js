let currentLang = 'en';
let music = document.getElementById("bg-music");

let currentEvent = null;
let gameState = null;

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

const natureImages = Array.from(
    { length: 100 },
    (_, i) => `https://picsum.photos/id/${i + 20}/1200/800`
);

// =========================
// 🔊 VOZ
// =========================
function speak(text) {
    window.speechSynthesis.cancel();
    music.volume = 0.1;

    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = currentLang === 'en' ? 'en-US' : 'es-ES';

    ut.onend = () => {
        music.volume = 0.4;
    };

    window.speechSynthesis.speak(ut);
}

// =========================
// 🌄 BACKGROUND
// =========================
function updateBackground() {
    const container = document.getElementById("bg-container");

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
// ▶️ INICIO
// =========================
function start() {
    music.play();
    music.volume = 0.4;

    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "block";
    document.getElementById("back-btn").style.display = "block";

    updateBackground();

    requestNextEvent(); // 🔥 empieza el motor real
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
}

// =========================
// 🌍 PEDIR EVENTO INICIAL
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
        loadEvent(data.next_event);
    });
}

// =========================
// 🔥 CARGAR EVENTO
// =========================
function loadEvent(eventName) {

    currentEvent = eventName;

    let eventData = buildEvent(eventName);

    document.getElementById("text-content").innerText = eventData.desc;
    speak(eventData.desc);

    renderOptions(eventData);
}

// =========================
// 🧩 CONSTRUCTOR DE EVENTOS
// =========================
function buildEvent(name) {

    switch(name) {

        case "rechazo":
            return {
                name: "RECHAZO",
                desc: currentLang === 'en'
                    ? "Someone ignores you completely."
                    : "Alguien te ignora completamente.",
                context: "rechazo",
                decisions: ["TDB", "TDM", "TDG"]
            };

        case "conflicto":
            return {
                name: "CONFLICTO",
                desc: currentLang === 'en'
                    ? "A direct confrontation happens."
                    : "Ocurre un conflicto directo.",
                context: "conflicto",
                decisions: ["TDB", "TDM", "TDG"]
            };

        case "perdida":
            return {
                name: "PÉRDIDA",
                desc: currentLang === 'en'
                    ? "You lose something valuable."
                    : "Pierdes algo importante.",
                context: "perdida",
                decisions: ["TDB", "TDM", "TDN"]
            };

        case "oportunidad":
            return {
                name: "OPORTUNIDAD",
                desc: currentLang === 'en'
                    ? "A new opportunity appears."
                    : "Aparece una oportunidad.",
                context: "oportunidad",
                decisions: ["TDB", "TDG"]
            };

        case "tentacion":
            return {
                name: "TENTACIÓN",
                desc: currentLang === 'en'
                    ? "You feel an impulse toward a vice."
                    : "Sientes una tentación o impulso.",
                context: "tentacion",
                decisions: ["TDB", "TDM", "TDN"]
            };

        default:
            return {
                name: "NEUTRAL",
                desc: "Life continues...",
                context: "neutral",
                decisions: ["TDB", "TDM", "TDN"]
            };
    }
}

// =========================
// 🎮 RENDER OPCIONES
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
// 🧠 MOTOR REAL CONECTADO
// =========================
function sendDecision(decision, context) {

    document.getElementById("options").innerHTML = "";

    fetch("/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            decision: decision,
            context: context
        })
    })
    .then(res => res.json())
    .then(data => {

        gameState = data.state;

        updateBackground();

        // 💀 FINAL
        if (data.status === "end") {
            showFinalScreen(data.type);
            return;
        }

        // 🔄 SIGUIENTE EVENTO
        loadEvent(data.next_event);
    });
}

// =========================
// 💀 FINAL DEL SISTEMA
// =========================
function showFinalScreen(type) {

    document.getElementById("text-content").innerText =
        "END: " + type;

    document.getElementById("options").innerHTML = "";

    speak("System ended: " + type);
}

// =========================
// 🌬️ UI BREATH (OPCIONAL)
// =========================
function showBreathCycle() {

    const circle = document.getElementById("breath-circle");
    const instruction = document.getElementById("breath-instruction");
    const timerDisp = document.getElementById("timer");

    circle.style.display = "flex";

    let time = 4;
    let inhale = true;

    function cycle() {

        instruction.innerText = inhale
            ? translations[currentLang].inhale
            : translations[currentLang].exhale;

        let interval = setInterval(() => {

            time--;
            timerDisp.innerText = time;

            if (time <= 0) {
                clearInterval(interval);

                inhale = !inhale;
                time = 4;

                if (!circle.isConnected) return;

                circle.classList.toggle("inhale");
                circle.classList.toggle("exhale");

                cycle();
            }

        }, 1000);
    }

    cycle();
}
