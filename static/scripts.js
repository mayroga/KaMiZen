/* =================== KA MIZEN GLOBAL STATE =================== */
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");
const forwardBtn = document.getElementById("forward-btn");
const block = document.getElementById("block");
const langBtn = document.getElementById("lang-btn");

let bloques = [];
let current = 0;
let currentLang = localStorage.getItem("kamizenLang") || "en";

/* =================== AUDIO ENGINE (3 LEVELS) =================== */
const bgMusic = new Audio();
bgMusic.loop = true;
const musicTracks = {
    1: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Nivel 1: Relajante
    2: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", // Nivel 2: Enfoque
    3: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"  // Nivel 3: Intenso
};

function updateMusic(level) {
    const track = musicTracks[level] || musicTracks[1];
    if (bgMusic.src !== track) {
        bgMusic.src = track;
        bgMusic.play().catch(() => console.log("Waiting for interaction..."));
    }
}

/* =================== DYNAMIC BACKGROUND (KEN BURNS) =================== */
const bgImages = [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80"
];

function applyBackgroundEffect() {
    let imgIdx = 0;
    const body = document.body;
    
    setInterval(() => {
        body.style.backgroundImage = `url(${bgImages[imgIdx]})`;
        body.style.backgroundSize = "110%";
        body.style.transition = "background-image 2s ease-in-out, background-size 10s linear";
        
        setTimeout(() => {
            body.style.backgroundSize = "125%";
        }, 100);

        imgIdx = (imgIdx + 1) % bgImages.length;
    }, 10000);
}

/* =================== TRANSLATIONS UI =================== */
const translations = {
    en: { start: "Start Session", next: "Next", back: "Back", forward: "Forward", restart: "Restart", correct: "Correct", wrong: "Wrong", levelUp: "Level Up!" },
    es: { start: "Iniciar Sesión", next: "Siguiente", back: "Atrás", forward: "Adelantar", restart: "Reiniciar", correct: "Correcto", wrong: "Incorrecto", levelUp: "¡Nivel Superado!" }
};

let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0, level: 1, discipline: 0, clarity: 50, calm: 30
};

function updatePanel() {
    document.getElementById("streak").innerHTML = `🔥 Streak: ${userData.streak}`;
    document.getElementById("level").innerHTML = `Level: ${userData.level}`;
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}

function updateLanguageUI() {
    startBtn.innerText = translations[currentLang].start;
    nextBtn.innerText = translations[currentLang].next;
    backBtn.innerText = translations[currentLang].back;
    forwardBtn.innerText = translations[currentLang].forward;
    restartBtn.innerText = translations[currentLang].restart;
    langBtn.innerText = currentLang === "en" ? "ES" : "EN";
}

async function playVoice(text) {
    return new Promise(resolve => {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = currentLang === "en" ? "en-US" : "es-ES";
        msg.rate = 0.85; // Peso profesional
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* =================== BLOCK RENDERER =================== */
async function showBlock(b) {
    block.innerHTML = "";
    nextBtn.style.display = "none";
    
    // Aplicar transparencia si el JSON la define (AL CIELO style)
    const container = document.getElementById("app");
    if (b.transparency_alpha) container.style.background = `rgba(17, 24, 39, ${b.transparency_alpha})`;

    const content = typeof b.text === "object" ? b.text[currentLang] : b.text;

    // Bloques de texto y voz
    if (["voice", "strategy", "story", "reward", "closing"].includes(b.type)) {
        block.innerHTML = `<div style="text-align:center; padding:10px; font-size:1.2rem;">${content}</div>`;
        await playVoice(content);

        if (b.type === "reward") {
            userData.discipline += (b.points || 10);
            updatePanel();
        }
        nextBtn.style.display = "inline-block";
    }

    // Bloques T-VID (Respiración/Guía)
    if (b.type === "t_vid_part") {
        const goal = typeof b.goal === "object" ? b.goal[currentLang] : b.goal;
        block.innerHTML = `<div style="color:#60a5fa; font-weight:600;">${goal}</div>`;
        
        const guides = typeof b.voice_guidance === "object" ? b.voice_guidance[currentLang] : b.voice_guidance;
        for (const msg of guides) {
            await playVoice(msg);
        }
        nextBtn.style.display = "inline-block";
    }

    // Bloques de Quiz
    if (b.type === "quiz") {
        const question = typeof b.question === "object" ? b.question[currentLang] : b.question;
        const options = typeof b.options === "object" ? b.options[currentLang] : b.options;

        block.innerHTML = `<h3 style="margin-bottom:15px; font-size:1.1rem;">${question}</h3>`;
        await playVoice(question);

        options.forEach((op, i) => {
            const btn = document.createElement("button");
            btn.innerText = op;
            btn.style.marginTop = "8px";
            btn.onclick = async () => {
                if (i === b.correct) {
                    await playVoice(translations[currentLang].correct);
                    userData.discipline += 5;
                    updatePanel();
                    nextBtn.style.display = "inline-block";
                } else {
                    await playVoice(translations[currentLang].wrong);
                }
            };
            block.appendChild(btn);
        });
    }
}

/* =================== EVENTS =================== */
startBtn.onclick = async () => {
    startBtn.style.display = "none";
    const res = await fetch("/session_content");
    const data = await res.json();
    
    // Filtrar sesiones por nivel
    const filtered = data.sessions.filter(s => s.level === userData.level);
    const session = filtered[Math.floor(Math.random() * filtered.length)] || data.sessions[0];

    updateMusic(session.level);
    bloques = session.blocks;
    current = 0;
    showBlock(bloques[0]);
};

nextBtn.onclick = () => {
    current++;
    if (current < bloques.length) {
        showBlock(bloques[current]);
    } else {
        block.innerHTML = `<h2>${translations[currentLang].levelUp}</h2>`;
        startBtn.style.display = "block";
        nextBtn.style.display = "none";
    }
};

langBtn.onclick = () => {
    currentLang = currentLang === "en" ? "es" : "en";
    localStorage.setItem("kamizenLang", currentLang);
    updateLanguageUI();
};

// Iniciar efectos y UI
applyBackgroundEffect();
updatePanel();
updateLanguageUI();
