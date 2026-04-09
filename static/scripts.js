/* ============================================================
   AL CIELO - INMERSIVE ENGINE (v3.0)
   Branding: AURA BY MAY ROGA LLC
   ============================================================ */

const UI = {
    startBtn: document.getElementById("start-btn"),
    nextBtn: document.getElementById("next-btn"),
    backBtn: document.getElementById("back-btn"),
    forwardBtn: document.getElementById("forward-btn"),
    restartBtn: document.getElementById("restart-btn"),
    langBtn: document.getElementById("lang-btn"),
    block: document.getElementById("block"),
    bgLayer: document.getElementById("bg-layer"),
    streak: document.getElementById("streak"),
    level: document.getElementById("level")
};

let state = {
    bloques: [],
    current: 0,
    lang: localStorage.getItem("kamizenLang") || "en",
    userData: JSON.parse(localStorage.getItem("kamizenData")) || { streak: 0, level: 1, discipline: 0 },
    bgIndex: 0
};

/* =================== IMÁGENES INMERSIVAS (40) =================== */
const keywords = [
    "forest", "mountain", "ocean", "river", "glacier", "waterfall", "desert", "nebula",
    "valley", "sunset", "cliffs", "autumn", "island", "field", "cave", "aurora",
    "zen-garden", "peaks", "space", "bamboo", "volcano", "tundra", "coast", "lake",
    "meadow", "rainforest", "canyon", "fjords", "mist", "underwater", "stars", "cosmos",
    "redwoods", "savanna", "oasis", "spring", "winter", "dunes", "reef", "paradise"
];

function createImmersiveBackground() {
    UI.bgLayer.innerHTML = "";
    keywords.forEach((word, i) => {
        const div = document.createElement('div');
        div.className = 'slide' + (i === 0 ? ' active' : '');
        div.style.backgroundImage = `url('https://images.unsplash.com/photo-${i}?auto=format&fit=crop&w=1920&q=80&q=${word}')`;
        // Nota: En producción usar URLs fijas de Unsplash para evitar variaciones
        div.style.backgroundImage = `url('https://source.unsplash.com/1920x1080/?${word}')`;
        UI.bgLayer.appendChild(div);
    });
}

function rotateBackground() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    slides[state.bgIndex].classList.remove('active');
    state.bgIndex = (state.bgIndex + 1) % slides.length;
    slides[state.bgIndex].classList.add('active');
}

/* =================== AUDIO MOTOR (3 LEVELS) =================== */
const bgAudio = new Audio();
bgAudio.loop = true;
const musicMap = {
    1: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Calm
    2: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", // Focus
    3: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"  // Intense/Scientific
};

function setMusic(level) {
    const track = musicMap[level] || musicMap[1];
    if (bgAudio.src !== track) {
        bgAudio.src = track;
        bgAudio.play().catch(() => console.log("Audio waiting for user..."));
    }
}

/* =================== CORE LOGIC =================== */

async function playVoice(text) {
    return new Promise(resolve => {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = state.lang === "en" ? "en-US" : "es-ES";
        msg.rate = 0.9;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

async function renderBlock(b) {
    UI.block.innerHTML = "";
    UI.nextBtn.style.display = "none";
    
    const text = typeof b.text === "object" ? b.text[state.lang] : b.text;
    const title = b.title ? (typeof b.title === "object" ? b.title[state.lang] : b.title) : "";

    // Tipos de bloque: Story, Strategy, Power, etc.
    if (["voice", "story", "strategy", "power", "reward"].includes(b.type)) {
        UI.block.innerHTML = `<div class="fade-in">
            ${title ? `<h2 style="color:#60a5fa;margin-bottom:10px;">${title}</h2>` : ""}
            <p style="font-size:1.2em;">${text}</p>
        </div>`;
        await playVoice(text);
        UI.nextBtn.style.display = "inline-block";
    }

    // Bloque T-VID: Respiración Extendida
    if (b.type === "breathing") {
        const goal = b.goal ? (typeof b.goal === "object" ? b.goal[state.lang] : b.goal) : "";
        UI.block.innerHTML = `<div class="fade-in">
            <h3>${title || "T-VID COACH"}</h3>
            <p style="font-size:0.9em;color:#94a3b8;margin-bottom:10px;">${goal}</p>
            <div class="breath-circle" id="circle"></div>
            <p id="breath-status" style="font-weight:bold;margin-top:10px;"></p>
        </div>`;
        
        await playVoice(text + ". " + goal);
        const circle = document.getElementById("circle");
        const statusText = document.getElementById("breath-status");
        
        let timeLeft = b.duration || 120; // Default 2 min
        const interval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(interval);
                UI.nextBtn.style.display = "inline-block";
                statusText.innerText = state.lang === "en" ? "Session Complete" : "Sesión Completada";
                return;
            }
            // Ciclo de animación cada 8s (4 in, 4 out)
            const cycle = timeLeft % 8;
            if (cycle > 4) {
                circle.style.transform = "scale(1.5)";
                statusText.innerText = state.lang === "en" ? "INHALE..." : "INHALA...";
            } else {
                circle.style.transform = "scale(1)";
                statusText.innerText = state.lang === "en" ? "EXHALE..." : "EXHALA...";
            }
            timeLeft--;
        }, 1000);
    }

    // Bloque Quiz / Riddle
    if (b.type === "quiz") {
        const question = typeof b.question === "object" ? b.question[state.lang] : b.question;
        const options = Array.isArray(b.options) ? b.options : b.options[state.lang];
        const feedback = b.explanation ? (typeof b.explanation === "object" ? b.explanation[state.lang] : b.explanation) : "";

        UI.block.innerHTML = `<h3 class="fade-in">${question}</h3><div class="options-grid" id="q-grid"></div>`;
        await playVoice(question);

        options.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.innerText = opt;
            btn.onclick = async () => {
                const isCorrect = i === b.correct;
                UI.block.innerHTML = `<h3>${isCorrect ? "✅" : "❌"}</h3><p>${feedback}</p>`;
                await playVoice(feedback);
                if (isCorrect) {
                    state.userData.discipline += 15;
                    updateProgress();
                }
                UI.nextBtn.style.display = "inline-block";
            };
            document.getElementById("q-grid").appendChild(btn);
        });
    }
}

function updateProgress() {
    if (state.userData.discipline >= 150 && state.userData.level < 3) {
        state.userData.level++;
        state.userData.discipline = 0;
    }
    UI.streak.innerText = `🔥 Streak: ${state.userData.streak}`;
    UI.level.innerText = `Level: ${state.userData.level}`;
    localStorage.setItem("kamizenData", JSON.stringify(state.userData));
}

/* =================== EVENTOS =================== */

UI.startBtn.onclick = async () => {
    UI.startBtn.style.display = "none";
    const res = await fetch("/session_content");
    const data = await res.json();
    
    // Filtro por nivel
    const pool = data.sessions.filter(s => s.level <= state.userData.level);
    const session = pool[Math.floor(Math.random() * pool.length)];
    
    setMusic(session.level);
    state.bloques = session.blocks;
    state.current = 0;
    renderBlock(state.bloques[0]);
};

UI.nextBtn.onclick = () => {
    state.current++;
    if (state.current < state.bloques.length) {
        renderBlock(state.bloques[state.current]);
    } else {
        UI.block.innerHTML = "<h2>Session Complete. You are stronger now.</h2>";
        UI.restartBtn.style.display = "block";
    }
};

UI.langBtn.onclick = () => {
    state.lang = state.lang === "en" ? "es" : "en";
    localStorage.setItem("kamizenLang", state.lang);
    location.reload();
};

/* INIT */
createImmersiveBackground();
setInterval(rotateBackground, 7000); // Cambio de imagen cada 7s
updateProgress();
UI.langBtn.innerText = state.lang.toUpperCase();
