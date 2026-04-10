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
        bgMusic.volume = 0.3; // Volumen un poco más bajo para que la voz se escuche clara
        bgMusic.play().catch(e => console.log("Interacción requerida para audio"));
    }
}

/* =================== RENDERER (ACTUALIZADO) =================== */
async function showBlock(b) {
    block.innerHTML = "";
    nextBtn.style.display = "none";

    const content = typeof b.text === "object" ? b.text[currentLang] : b.text;

    // Detecta los tipos: voice, strategy, story, reward Y AHORA TAMBIÉN breathing
    if (["voice", "strategy", "story", "reward", "breathing"].includes(b.type)) {
        block.innerHTML = `<div class="content-text">${content}</div>`;
        
        // Si es breathing, podrías añadir un cronómetro visual aquí
        if (b.type === "breathing" && b.duration) {
            block.innerHTML += `<div class="timer">⏳ ${b.duration}s</div>`;
        }

        await playVoice(content);
        nextBtn.style.display = "block";
    }

    if (b.type === "quiz") {
        const question = b.question[currentLang];
        const options = b.options[currentLang];
        block.innerHTML = `<h3 style="margin-bottom:20px;">${question}</h3>`;
        await playVoice(question);

        options.forEach((op, i) => {
            const btn = document.createElement("button");
            btn.innerText = op;
            btn.className = "secondary";
            btn.onclick = async () => {
                if (i === b.correct) {
                    btn.style.backgroundColor = "#059669"; // Verde éxito
                    await playVoice(currentLang === "en" ? "Correct" : "Correcto");
                    nextBtn.style.display = "block";
                } else {
                    btn.style.backgroundColor = "#dc2626"; // Rojo error
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
        const res = await fetch("/session_content"); // Asegúrate que tu endpoint devuelva el JSON de las 20 misiones
        const data = await res.json();
        
        // Selección de misión (puedes cambiar random por una secuencia lógica)
        const mission = data.missions[Math.floor(Math.random() * data.missions.length)];
        
        updateMusic(mission.level); // La música cambia según el nivel de la misión (1, 2 o 3)
        bloques = mission.blocks;
        current = 0;
        showBlock(bloques[0]);
    } catch (e) {
        block.innerText = "Error loading content.";
        startBtn.style.display = "block";
    }
};
