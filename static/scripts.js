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
    1: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    2: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    3: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
};

function updateMusic(level) {
    const track = musicTracks[level] || musicTracks[1];
    if (bgMusic.src !== track) {
        bgMusic.src = track;
        bgMusic.play().catch(() => console.log("Interacción requerida para audio"));
    }
}

/* =================== TRANSLATIONS =================== */
const translations = {
    en: { start: "Start Session", next: "Next", correct: "Correct!", wrong: "Incorrect", levelUp: "Level Up!", explain: "Why?" },
    es: { start: "Iniciar Sesión", next: "Siguiente", correct: "¡Correcto!", wrong: "Incorrecto", levelUp: "¡Nivel Superior!", explain: "Explicación" }
};

let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0, level: 1, discipline: 0
};

function updatePanel() {
    document.getElementById("streak").innerHTML = `🔥 Streak: ${userData.streak}`;
    document.getElementById("level").innerHTML = `Level: ${userData.level}`;
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}

async function playVoice(text) {
    return new Promise(resolve => {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = currentLang === "en" ? "en-US" : "es-ES";
        msg.rate = 0.95;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* =================== RENDER MOTOR =================== */
async function showBlock(b) {
    block.innerHTML = "";
    nextBtn.style.display = "none";
    
    // Cambio de fondo dinámico
    document.body.style.background = b.color || "#0f172a";

    const textToShow = typeof b.text === "object" ? b.text[currentLang] : b.text;

    // BLOQUES DE TEXTO / VOZ / HISTORIA
    if (["voice", "strategy", "story", "reward", "closing"].includes(b.type)) {
        block.innerHTML = `<div class="fade-in">${textToShow}</div>`;
        await playVoice(textToShow);
        nextBtn.style.display = "inline-block";
    }

    // BLOQUE DE RESPIRACIÓN (CÍRCULO ANIMADO)
    if (b.type === "breathing") {
        block.innerHTML = `
            <div class="fade-in">
                <p>${textToShow}</p>
                <div class="breath-circle" id="circle"></div>
            </div>`;
        const circle = document.getElementById("circle");
        await playVoice(textToShow);
        
        circle.style.transform = "scale(1.5)";
        setTimeout(() => {
            circle.style.transform = "scale(1)";
            nextBtn.style.display = "inline-block";
        }, b.duration * 1000);
    }

    // BLOQUE DE QUIZ / ADIVINANZAS
    if (b.type === "quiz") {
        const question = typeof b.question === "object" ? b.question[currentLang] : b.question;
        const options = Array.isArray(b.options) ? b.options : b.options[currentLang];
        const explanation = b.explanation ? (typeof b.explanation === "object" ? b.explanation[currentLang] : b.explanation) : null;

        block.innerHTML = `<h3>${question}</h3><div id="options-grid"></div>`;
        await playVoice(question);

        const grid = document.getElementById("options-grid");
        options.forEach((op, i) => {
            const btn = document.createElement("button");
            btn.innerText = op;
            btn.onclick = async () => {
                const isCorrect = i === b.correct;
                const feedback = isCorrect ? translations[currentLang].correct : translations[currentLang].wrong;
                
                // Mostrar explicación si existe
                block.innerHTML = `<h3>${isCorrect ? "✅" : "❌"} ${feedback}</h3>`;
                if (explanation) block.innerHTML += `<p style="font-size:16px; margin-top:10px;">${explanation}</p>`;
                
                await playVoice(feedback + (explanation ? ". " + explanation : ""));
                
                if (isCorrect) {
                    userData.discipline += 10;
                    if(userData.discipline >= 100 && userData.level < 3) {
                        userData.level++;
                        userData.discipline = 0;
                    }
                    updatePanel();
                }
                nextBtn.style.display = "inline-block";
            };
            grid.appendChild(btn);
        });
    }
}

/* =================== CONTROLES =================== */
startBtn.onclick = async () => {
    startBtn.style.display = "none";
    const res = await fetch("/session_content");
    const data = await res.json();
    const filtered = data.sessions.filter(s => s.level <= userData.level);
    const session = filtered[Math.floor(Math.random() * filtered.length)];
    
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
    location.reload(); 
};

updatePanel();
