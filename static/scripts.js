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
    document.getElementById("level").innerHTML = `KaMiZen Level: ${userData.level}`;
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
        msg.rate = 0.9;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* =================== BLOCK RENDERER =================== */
async function showBlock(b) {
    block.innerHTML = "";
    nextBtn.style.display = "none";
    document.body.style.background = b.color || "#070b14";

    const content = typeof b.text === "object" ? b.text[currentLang] : b.text;

    if (["voice", "strategy", "story", "reward", "closing"].includes(b.type)) {
        block.innerHTML = `<div style="text-align:center; padding:10px;">${content}</div>`;
        await playVoice(content);

        if (b.type === "reward") {
            userData.discipline += (b.points || 10);
            if(userData.discipline >= 100 && userData.level < 3) {
                userData.level++;
                userData.discipline = 0;
                await playVoice(translations[currentLang].levelUp);
            }
            updatePanel();
        }
        nextBtn.style.display = "inline-block";
    }

    if (b.type === "quiz") {
        const question = typeof b.question === "object" ? b.question[currentLang] : b.question;
        const options = typeof b.options === "object" ? b.options[currentLang] : b.options;

        block.innerHTML = `<h3 style="margin-bottom:15px;">${question}</h3>`;
        await playVoice(question);

        options.forEach((op, i) => {
            const btn = document.createElement("button");
            btn.innerText = op;
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
    
    // Filtrar sesiones por nivel del usuario
    const filtered = data.sessions.filter(s => s.level === userData.level);
    const session = filtered[Math.floor(Math.random() * filtered.length)] || data.sessions[0];

    updateMusic(session.level);
    bloques = session.blocks;
    current = 0;
    showBlock(bloques[0]);
};

nextBtn.onclick = () => {
    current++;
    if (current < bloques.length) showBlock(bloques[current]);
};

langBtn.onclick = () => {
    currentLang = currentLang === "en" ? "es" : "en";
    localStorage.setItem("kamizenLang", currentLang);
    updateLanguageUI();
};

updatePanel();
updateLanguageUI();
