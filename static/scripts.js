let currentLang = 'en';
let music = document.getElementById("bg-music");

const translations = {
    en: {
        start: "START SESSION", langBtn: "ESPAÑOL", inhale: "Breathe In", exhale: "Exhale",
        estres: "You feel pressure in your chest. Your mind doesn't stop.",
        soledad: "Today no one called. The silence feels heavier than usual.",
        perdida: "You think of someone who is no longer here. The void appears.",
        confusion: "Everything seems blurred. You don't know where to go.",
        tdb: "Breathe... and smile softly. Everything is fine for now.",
        tdm: "Even when escaping... smile. Observe without judging.",
        tdn: "Remember something simple... smile like a child.",
        tdg: "Feel the intensity... now release it with a short laugh."
    },
    es: {
        start: "INICIAR SESIÓN", langBtn: "ENGLISH", inhale: "Inhala", exhale: "Exhala",
        estres: "Sientes presión en el pecho. Tu mente no se detiene.",
        soledad: "Hoy nadie te llamó. El silencio pesa más de lo normal.",
        perdida: "Piensas en alguien que ya no está. El vacío aparece.",
        confusion: "Todo parece borroso. No sabes qué camino tomar.",
        tdb: "Respira… y sonríe suave. Todo está bien por ahora.",
        tdm: "Incluso escapando… sonríe. Observa sin juzgar.",
        tdn: "Recuerda algo simple… sonríe como niño.",
        tdg: "Siente la intensidad… ahora suéltala con una risa corta."
    }
};

const natureImages = Array.from({length: 100}, (_, i) => `https://picsum.photos/id/${i + 15}/1200/800`);

function speak(text) {
    window.speechSynthesis.cancel();
    music.volume = 0.1;
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = currentLang === 'en' ? 'en-US' : 'es-ES';
    ut.onend = () => music.volume = 0.4;
    window.speechSynthesis.speak(ut);
}

function updateBackground() {
    const container = document.getElementById("bg-container");
    const imgUrl = natureImages[Math.floor(Math.random() * natureImages.length)];
    const slide = document.createElement("div");
    slide.className = "bg-slide";
    slide.style.backgroundImage = `url('${imgUrl}')`;
    container.appendChild(slide);
    setTimeout(() => slide.style.opacity = "0.7", 100);
    if (container.children.length > 2) container.removeChild(container.children[0]);
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'es' : 'en';
    document.getElementById("btn-start").innerText = translations[currentLang].start;
    document.getElementById("lang-toggle").innerText = translations[currentLang].langBtn;
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
    const opts = [
        {txt: "TDB", tvid: "TDB"},
        {txt: "TDM", tvid: "TDM"},
        {txt: "TDN", tvid: "TDN"}
    ];
    renderScene(text, opts);
}

function renderScene(text, options) {
    const container = document.getElementById("options");
    container.innerHTML = "";
    document.getElementById("text-content").innerText = text;
    speak(text);

    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.innerText = opt.txt;
        btn.onclick = () => runTherapy(opt.tvid);
        container.appendChild(btn);
    });
}

function runTherapy(tvid) {
    document.getElementById("options").innerHTML = "";
    updateBackground();
    
    // Enviar al servidor para el juicio de la IA
    fetch("/judge", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ decision: tvid })
    });

    const msg = translations[currentLang][tvid.toLowerCase()];
    showTherapy(msg);
}

function showTherapy(msg) {
    document.getElementById("text-content").innerText = msg;
    speak(msg);

    const circle = document.getElementById("breath-circle");
    const instruction = document.getElementById("breath-instruction");
    const timerDisp = document.getElementById("timer");
    
    circle.style.display = "flex";
    
    // FASE: INHALA
    instruction.innerText = translations[currentLang].inhale;
    circle.classList.add("inhale");
    circle.classList.remove("exhale");
    
    let time = 4;
    timerDisp.innerText = time;

    let interval = setInterval(() => {
        time--;
        timerDisp.innerText = time;
        if (time <= 0) {
            if (circle.classList.contains("inhale")) {
                // FASE: EXHALA
                instruction.innerText = translations[currentLang].exhale;
                circle.classList.add("exhale");
                circle.classList.remove("inhale");
                time = 4;
                timerDisp.innerText = time;
            } else {
                clearInterval(interval);
                circle.style.display = "none";
                nextScene(); // AHORA SÍ AVANZA A LA SIGUIENTE ESCENA
            }
        }
    }, 1000);
}
