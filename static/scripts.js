let currentLang = 'en'; // Inglés por defecto
let music = document.getElementById("bg-music");

const translations = {
    en: {
        breath_in: "Breathe In",
        breath_out: "Exhale",
        hold: "Hold",
        start: "START",
        soledad: "Today no one called. The silence feels heavier than usual.",
        perdida: "You think of someone who is no longer here. The void appears.",
        estres: "You feel pressure in your chest. Your mind doesn't stop.",
        tdb_msg: "Breathe... and smile softly. Everything is fine for now.",
        tdm_msg: "Even when escaping... smile. Observe without judging.",
        tdn_msg: "Remember something simple... smile like a child."
    },
    es: {
        breath_in: "Inhala",
        breath_out: "Exhala",
        hold: "Retén",
        start: "INICIAR",
        soledad: "Hoy nadie te llamó. El silencio pesa más de lo normal.",
        perdida: "Piensas en alguien que ya no está. El vacío aparece.",
        estres: "Sientes presión en el pecho. Tu mente no se detiene.",
        tdb_msg: "Respira… y sonríe suave. Todo está bien por ahora.",
        tdm_msg: "Incluso escapando… sonríe. Observa sin juzgar.",
        tdn_msg: "Recuerda algo simple… sonríe como niño."
    }
};

// --- Sistema de Imágenes (Simulación de 100 imágenes) ---
const natureImages = [
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d"
    // Añadir hasta 100 URLs aquí
];

function updateBackground() {
    const container = document.getElementById("bg-container");
    const imgUrl = natureImages[Math.floor(Math.random() * natureImages.length)];
    const div = document.createElement("div");
    div.className = "bg-slide";
    div.style.backgroundImage = `url('${imgUrl}?auto=format&fit=crop&w=1200&q=80')`;
    div.style.opacity = 0;
    container.appendChild(div);
    
    setTimeout(() => { div.style.opacity = 0.6; }, 100);
    if(container.children.length > 2) container.removeChild(container.children[0]);
}

// --- Voz y Audio ---
function speak(text) {
    const msg = new SpeechSynthesisUtterance();
    msg.text = text;
    msg.lang = currentLang === 'en' ? 'en-US' : 'es-ES';
    msg.volume = 1.0; 
    music.volume = 0.2; // Música siempre por debajo de la voz
    
    msg.onend = () => { music.volume = 0.4; }; // Sube música al terminar de hablar
    window.speechSynthesis.speak(msg);
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'es' : 'en';
    document.getElementById("start-btn").innerText = translations[currentLang].start;
}

function start() {
    music.play();
    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "block";
    updateBackground();
    nextScene();
}

function nextScene() {
    let stateVal = document.getElementById("state").value;
    let text = translations[currentLang][stateVal];
    
    let options = [
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
    let msgKey = tvid.toLowerCase() + "_msg";
    let text = translations[currentLang][msgKey];
    showTherapy(text);
}

function showTherapy(msg) {
    document.getElementById("text-content").innerText = msg;
    speak(msg);

    let circle = document.getElementById("breath-circle");
    let instruction = document.getElementById("breath-instruction");
    let timerDisp = document.getElementById("timer");
    
    circle.style.display = "flex";
    let t = 4;
    
    // Ciclo automático Inhala/Exhala
    instruction.innerText = translations[currentLang].breath_in;
    circle.className = "breathing-in";

    let interval = setInterval(() => {
        t--;
        timerDisp.innerText = t;
        if(t === 0) {
            if(circle.className === "breathing-in") {
                instruction.innerText = translations[currentLang].breath_out;
                circle.className = "breathing-out";
                t = 4;
            } else {
                clearInterval(interval);
                circle.style.display = "none";
                nextScene();
            }
        }
    }, 1000);
}
