/* =================== KA MIZEN GLOBAL STATE =================== */
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const block = document.getElementById("block");
const langBtn = document.getElementById("lang-btn");

let bloques = [];
let current = 0;
let currentLang = localStorage.getItem("kamizenLang") || "en";

/* =================== PROGRESS TRACKER =================== */
// Recupera la última misión jugada o empieza en la primera (índice 0)
let missionIndex = parseInt(localStorage.getItem("kamizenMissionIndex")) || 0;

/* =================== AUDIO ENGINE =================== */
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
        bgMusic.volume = 0.3;
        bgMusic.play().catch(e => console.log("Interacción requerida para audio"));
    }
}

/* =================== BACKGROUND ZOOM (KEN BURNS) =================== */
const bgImages = [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1920",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1920",
    "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1920"
];

function initBackground() {
    let idx = 0;
    const changeBg = () => {
        document.body.style.backgroundImage = `url(${bgImages[idx]})`;
        document.body.style.backgroundSize = "110%";
        setTimeout(() => { document.body.style.backgroundSize = "130%"; }, 100);
        idx = (idx + 1) % bgImages.length;
    };
    changeBg();
    setInterval(changeBg, 10000);
}

/* =================== VOICE ENGINE =================== */
async function playVoice(text) {
    return new Promise(resolve => {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = currentLang === "en" ? "en-US" : "es-ES";
        msg.rate = 0.9;
        msg.onend = resolve;
        window.speechSynthesis.speak(msg);
    });
}

/* =================== RENDERER =================== */
async function showBlock(b) {
    block.innerHTML = "";
    nextBtn.style.display = "none";

    const content = typeof b.text === "object" ? b.text[currentLang] : b.text;

    // Tipos de bloque estándar + respiración (breathing)
    if (["voice", "strategy", "story", "reward", "breathing"].includes(b.type)) {
        block.innerHTML = `<div class="content-fade">${content}</div>`;
        
        if (b.type === "breathing" && b.duration) {
            block.innerHTML += `<div style="margin-top:20px; font-size:1.5rem;">⏳ ${b.duration}s</div>`;
        }

        await playVoice(content);
        nextBtn.style.display = "block";
    }

    if (b.type === "quiz") {
        const question = b.question[currentLang];
        const options = b.options[currentLang];
        block.innerHTML = `<h3 style="margin-bottom:25px;">${question}</h3>`;
        await playVoice(question);

        options.forEach((op, i) => {
            const btn = document.createElement("button");
            btn.innerText = op;
            btn.className = "secondary quiz-option";
            btn.onclick = async () => {
                if (i === b.correct) {
                    btn.style.backgroundColor = "#059669";
                    await playVoice(currentLang === "en" ? "Correct" : "Correcto");
                    nextBtn.style.display = "block";
                } else {
                    btn.style.backgroundColor = "#dc2626";
                    await playVoice(currentLang === "en" ? "Try again" : "Intenta de nuevo");
                }
            };
            block.appendChild(btn);
        });
    }
}

/* =================== EVENTS =================== */
startBtn.onclick = async () => {
    startBtn.style.display = "none";
    try {
        const res = await fetch("/session_content");
        const data = await res.json();
        
        // Verifica si ya se completaron todas las misiones (del 1 al 20)
        if (missionIndex >= data.missions.length) {
            block.innerHTML = `
                <h2 style="color:#fbbf24">Soberanía Total Alcanzada</h2>
                <p>Bienvenido Al Cielo. El sistema ha sido completado.</p>
            `;
            // Si quieres que el usuario pueda reiniciar, descomenta la siguiente línea:
            // missionIndex = 0; localStorage.setItem("kamizenMissionIndex", 0);
            return;
        }

        const mission = data.missions[missionIndex];
        
        updateMusic(mission.level);
        bloques = mission.blocks;
        current = 0;
        showBlock(bloques[0]);

        // Avanzamos el índice para la próxima sesión y guardamos en el navegador
        missionIndex++;
        localStorage.setItem("kamizenMissionIndex", missionIndex);
        
    } catch (e) {
        console.error(e);
        block.innerText = "Error loading content.";
        startBtn.style.display = "block";
    }
};

nextBtn.onclick = () => {
    current++;
    if (current < bloques.length) {
        showBlock(bloques[current]);
    } else {
        block.innerHTML = "<h2>Misión Finalizada</h2><p>Prepárate para el siguiente nivel.</p>";
        startBtn.innerText = "Siguiente Misión";
        startBtn.style.display = "block";
        nextBtn.style.display = "none";
    }
};

langBtn.onclick = () => {
    currentLang = currentLang === "en" ? "es" : "en";
    localStorage.setItem("kamizenLang", currentLang);
    langBtn.innerText = currentLang.toUpperCase();
    location.reload();
};

/* =================== INITIALIZATION =================== */
initBackground();
langBtn.innerText = currentLang.toUpperCase();
document.getElementById("streak").innerText = `🔥 Streak: ${missionIndex > 0 ? missionIndex : 1}`;
