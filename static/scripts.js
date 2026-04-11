// =====================================
// CONFIGURACIÓN INICIAL
// =====================================
let currentLang = 'en'; // Inglés por defecto
let music = document.getElementById("bg-music");
let voiceEnabled = true;

const translations = {
    en: {
        start: "START SESSION",
        langBtn: "ESPAÑOL",
        inhale: "Breathe In",
        exhale: "Exhale",
        hold: "Hold",
        soledad: "Today no one called. The silence feels heavier than usual.",
        perdida: "You think of someone who is no longer here. The void appears.",
        estres: "You feel pressure in your chest. Your mind doesn't stop.",
        confusion: "Everything seems blurred. You don't know which way to go.",
        tdb: "Breathe... and smile softly. Everything is fine for now.",
        tdm: "Even when escaping... smile. Observe without judging.",
        tdn: "Remember something simple... smile like a child.",
        tdg: "Feel the intensity... now release it with a short laugh."
    },
    es: {
        start: "INICIAR SESIÓN",
        langBtn: "ENGLISH",
        inhale: "Inhala",
        exhale: "Exhala",
        hold: "Retén",
        soledad: "Hoy nadie te llamó. El silencio pesa más de lo normal.",
        perdida: "Piensas en alguien que ya no está. El vacío aparece.",
        estres: "Sientes presión en el pecho. Tu mente no se detiene.",
        confusion: "Todo parece borroso. No sabes qué camino tomar.",
        tdb: "Respira… y sonríe suave. Todo está bien por ahora.",
        tdm: "Incluso escapando… sonríe. Observa sin juzgar.",
        tdn: "Recuerda algo simple… sonríe como niño.",
        tdg: "Siente la intensidad… ahora suéltala con una risa corta."
    }
};

// Generador de 100 imágenes naturales (Unsplash Nature)
const natureImages = Array.from({length: 100}, (_, i) => `https://picsum.photos/id/${i + 10}/1200/800`);

// ===============================
// SISTEMA DE VOZ Y AUDIO
// ===============================
function speak(text) {
    if (!voiceEnabled) return;
    
    // Bajar música mientras habla
    music.volume = 0.15;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === 'en' ? 'en-US' : 'es-ES';
    utterance.rate = 0.9;
    
    utterance.onend = () => {
        music.volume = 0.4; // Sube volumen al terminar
    };
    
    window.speechSynthesis.speak(utterance);
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'es' : 'en';
    document.getElementById("btn-start").innerText = translations[currentLang].start;
    document.getElementById("lang-toggle").innerText = translations[currentLang].langBtn;
}

// ===============================
// LÓGICA DEL JUEGO
// ===============================
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

function start() {
    music.play();
    music.volume = 0.4;
    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "block";
    updateBackground();
    nextScene();
}

function nextScene() {
    const stateVal = document.getElementById("state").value;
    const text = translations[currentLang][stateVal];
    
    const options = [
        {txt: "TDB", tvid: "TDB", good: true},
        {txt: "TDM", tvid: "TDM", good: false},
        {txt: "TDN", tvid: "TDN", good: true}
    ];

    renderScene(text, options);
}

function renderScene(text, options) {
    const container = document.getElementById("options");
    container.innerHTML = "";
    document.getElementById("text-content").innerText = text;
    speak(text);

    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.innerText = opt.txt;
        btn.onclick = () => {
            updateBackground();
            runTherapy(opt.tvid);
        };
        container.appendChild(btn);
    });
}

function runTherapy(tvid) {
    const msg = translations[currentLang][tvid.toLowerCase()];
    showTherapy(msg);
}

// ===============================
// CÍRCULO RESPIRATORIO AUTO
// ===============================
function showTherapy(msg) {
    document.getElementById("options").innerHTML = "";
    document.getElementById("text-content").innerText = msg;
    speak(msg);

    const circle = document.getElementById("breath-circle");
    const instruction = document.getElementById("breath-instruction");
    const timerDisp = document.getElementById("timer");
    
    circle.style.display = "flex";
    
    // Fase 1: INHALA (4s)
    instruction.innerText = translations[currentLang].inhale;
    circle.classList.remove("exhale");
    circle.classList.add("inhale");
    
    let count = 4;
    timerDisp.innerText = count;

    let breathInterval = setInterval(() => {
        count--;
        timerDisp.innerText = count;

        if (count <= 0) {
            if (circle.classList.contains("inhale")) {
                // Fase 2: EXHALA (4s)
                instruction.innerText = translations[currentLang].exhale;
                circle.classList.remove("inhale");
                circle.classList.add("exhale");
                count = 4;
                timerDisp.innerText = count;
            } else {
                // Fin de respiración
                clearInterval(breathInterval);
                circle.style.display = "none";
                nextScene();
            }
        }
    }, 1000);
}
