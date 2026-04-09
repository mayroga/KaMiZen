/* ============================================================
   AL CIELO - PRO-GAMING ENGINE (v4.0)
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
    bgIndex: 0,
    sessionActive: false
};

/* =================== AUDIO MOTOR (Evolución por Nivel) =================== */
const bgAudio = new Audio();
bgAudio.loop = true;
const musicMap = {
    1: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Zen / Calma
    2: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", // Ritmo / Enfoque
    3: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"  // Épico / High-Tech
};

function updateAtmosphere(level) {
    const track = musicMap[level] || musicMap[1];
    if (bgAudio.src !== track) {
        bgAudio.src = track;
        bgAudio.play().catch(() => {});
    }
}

/* =================== MOTOR VISUAL (40 IMÁGENES) =================== */
function createImmersiveBackground() {
    UI.bgLayer.innerHTML = "";
    const themes = ["nature", "tech", "abstract", "space", "water", "fire"];
    for(let i=0; i<40; i++) {
        const div = document.createElement('div');
        div.className = 'slide' + (i === 0 ? ' active' : '');
        const theme = themes[i % themes.length];
        div.style.backgroundImage = `url('https://picsum.photos/seed/${i+100}/1920/1080')`;
        UI.bgLayer.appendChild(div);
    }
}

function rotateBackground() {
    const slides = document.querySelectorAll('.slide');
    if (!slides.length) return;
    slides[state.bgIndex].classList.remove('active');
    state.bgIndex = (state.bgIndex + 1) % slides.length;
    slides[state.bgIndex].classList.add('active');
}

/* =================== LÓGICA DE JUEGO (LEVEL UP / DOWN) =================== */

async function renderBlock(b) {
    UI.block.innerHTML = "";
    UI.nextBtn.style.display = "none";
    rotateBackground(); // Cambiar imagen en cada bloque para dinamismo

    const text = typeof b.text === "object" ? b.text[state.lang] : b.text;
    const title = b.title ? (typeof b.title === "object" ? b.title[state.lang] : b.title) : "";

    if (["voice", "story", "strategy", "power", "reward"].includes(b.type)) {
        UI.block.innerHTML = `<div class="fade-in">
            <h2 style="color:#60a5fa;">${title}</h2>
            <p class="coach-text">${text}</p>
        </div>`;
        await playVoice(text);
        UI.nextBtn.style.display = "block";
    }

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
                if (isCorrect) {
                    state.userData.discipline += 25;
                    state.userData.streak++;
                    UI.block.innerHTML = `<h2 class="fade-in">✅ CORRECT</h2><p class="explanation">${feedback}</p>`;
                } else {
                    // PENALIZACIÓN: Bajar nivel o disciplina
                    state.userData.discipline = Math.max(0, state.userData.discipline - 40);
                    state.userData.streak = 0;
                    if (state.userData.level > 1 && state.userData.discipline === 0) {
                        state.userData.level--;
                        UI.block.innerHTML = `<h2 class="fade-in" style="color:#ef4444;">⚠️ LEVEL DOWN</h2>`;
                    } else {
                        UI.block.innerHTML = `<h2 class="fade-in" style="color:#ef4444;">❌ INCORRECT</h2>`;
                    }
                    UI.block.innerHTML += `<p class="explanation">${feedback}</p>`;
                }
                
                updateStats();
                await playVoice(feedback);
                UI.nextBtn.style.display = "block";
            };
            document.getElementById("q-grid").appendChild(btn);
        });
    }

    if (b.type === "breathing") {
        const goal = b.goal ? (typeof b.goal === "object" ? b.goal[state.lang] : b.goal) : "";
        UI.block.innerHTML = `
            <div class="fade-in">
                <h3>${title}</h3>
                <p style="color:#94a3b8; font-size:14px;">${goal}</p>
                <div class="breath-circle" id="circle"></div>
                <h2 id="b-timer"></h2>
            </div>`;
        
        const circle = document.getElementById("circle");
        const timerDisp = document.getElementById("b-timer");
        let timeLeft = b.duration || 60;

        const interval = setInterval(() => {
            if (timeLeft <= 0 || !state.sessionActive) {
                clearInterval(interval);
                UI.nextBtn.style.display = "block";
                return;
            }
            timerDisp.innerText = timeLeft + "s";
            circle.style.transform = (timeLeft % 8 > 4) ? "scale(1.5)" : "scale(1)";
            timeLeft--;
        }, 1000);
    }
}

function updateStats() {
    // Lógica de Subida de Nivel
    if (state.userData.discipline >= 100 && state.userData.level < 3) {
        state.userData.level++;
        state.userData.discipline = 0;
        playVoice(state.lang === "en" ? "Level Up! New powers unlocked." : "¡Nivel subido! Nuevos poderes desbloqueados.");
    }
    UI.streak.innerText = `🔥 Streak: ${state.userData.streak}`;
    UI.level.innerText = `Level: ${state.userData.level}`;
    localStorage.setItem("kamizenData", JSON.stringify(state.userData));
    updateAtmosphere(state.userData.level);
}

async function startNewSession() {
    state.sessionActive = true;
    UI.startBtn.style.display = "none";
    UI.restartBtn.style.display = "none";
    
    const res = await fetch("/session_content");
    const data = await res.json();
    
    // Filtrar contenido del nivel actual
    const pool = data.sessions.filter(s => s.level === state.userData.level);
    const session = pool[Math.floor(Math.random() * pool.length)];
    
    state.bloques = session.blocks;
    state.current = 0;
    renderBlock(state.bloques[0]);
}

async function playVoice(text) {
    return new Promise(resolve => {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = state.lang === "en" ? "en-US" : "es-ES";
        msg.rate = 1.0;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* CONTROLES */
UI.startBtn.onclick = startNewSession;
UI.nextBtn.onclick = () => {
    state.current++;
    if (state.current < state.bloques.length) {
        renderBlock(state.bloques[state.current]);
    } else {
        // En lugar de morir, ofrece otra misión del nivel superior o actual
        UI.block.innerHTML = `<h2>Misión Cumplida</h2><p>Tu disciplina ha aumentado. ¿Listo para el siguiente reto?</p>`;
        UI.restartBtn.style.display = "block";
        UI.restartBtn.innerText = state.lang === "en" ? "Next Mission" : "Siguiente Misión";
        state.sessionActive = false;
    }
};

UI.restartBtn.onclick = startNewSession;

UI.langBtn.onclick = () => {
    state.lang = state.lang === "en" ? "es" : "en";
    localStorage.setItem("kamizenLang", state.lang);
    location.reload();
};

/* INIT */
createImmersiveBackground();
setInterval(rotateBackground, 8000);
updateStats();
UI.langBtn.innerText = state.lang.toUpperCase();
