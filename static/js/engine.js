const { jsPDF } = window.jspdf;

let state = {
    user: "",
    language: "en",
    audioEnabled: true,
    timeLeft: 900,
    isRunning: false,
    currentMissionId: "1",
    words: [],
    stories: [],
    history: { read: [], caught: [] }
};

// 1. INICIO DE APP
async function initApp() {
    const nameInput = document.getElementById('user-name');
    if (!nameInput.value.trim()) return;
    
    state.user = nameInput.value.trim().split(" ")[0];
    document.getElementById('display-name').innerText = state.user;
    
    // Ocultar login, mostrar mundo
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-world').style.display = 'block';

    await loadData();
    showStory();
}

// 2. CARGA DE DATOS (Misiones y Sabiduría)
async function loadData() {
    try {
        // Historias
        const sRes = await fetch('/api/stories');
        const sData = await sRes.json();
        state.stories = sData.stories || [];

        // Misiones
        await loadNextMission();
    } catch (e) {
        console.error("Error cargando archivos JSON:", e);
    }
}

async function loadNextMission() {
    try {
        const res = await fetch(`/api/mission/next?id=${state.currentMissionId}`);
        const data = await res.json();
        
        if (data.success) {
            // Mapeo flexible para missions_01_07.json y similares
            let raw = data.mission.words || data.mission.missions || data.mission;
            
            if (Array.isArray(raw)) {
                if (raw[0] && raw[0].words) {
                    state.words = raw.flatMap(m => m.words);
                } else {
                    state.words = raw;
                }
            }
            state.currentMissionId = data.next_id;
            console.log("Palabras cargadas:", state.words.length);
        }
    } catch (e) {
        console.error("Error en misión:", e);
    }
}

// 3. FLUJO DE HISTORIAS
function showStory() {
    state.isRunning = false;
    if (state.stories.length === 0) return closeStory();

    const story = state.stories[Math.floor(Math.random() * state.stories.length)];
    state.history.read.push(story.t);

    document.getElementById('story-title').innerText = story.t;
    document.getElementById('story-content').innerText = (state.language === "en") ? story.en : story.es;
    document.getElementById('story-box').style.display = 'flex';
    
    speak(story.t + ". " + (state.language === "en" ? story.en : story.es));
}

function closeStory() {
    document.getElementById('story-box').style.display = 'none';
    state.isRunning = true;
    
    // Iniciar Reloj si no ha empezado
    if (!window.masterInterval) {
        startMasterClock();
    }
    
    // Iniciar lluvia de palabras
    gameLoop();
}

// 4. RELOJ Y LÓGICA DE TIEMPO
function startMasterClock() {
    window.masterInterval = setInterval(() => {
        if (!state.isRunning) return;

        state.timeLeft--;
        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;
        document.getElementById('master-clock').innerText = `${m}:${s.toString().padStart(2, '0')}`;

        // Cargar nueva misión cada 3 minutos
        if (state.timeLeft % 180 === 0 && state.timeLeft > 0) {
            loadNextMission();
        }

        if (state.timeLeft <= 0) {
            clearInterval(window.masterInterval);
            endSession();
        }
    }, 1000);
}

// 5. CICLO DE JUEGO (PALABRAS QUE CAEN)
function gameLoop() {
    if (!state.isRunning || state.timeLeft <= 0) return;

    if (state.words.length > 0) {
        const wordData = state.words[Math.floor(Math.random() * state.words.length)];
        // Soporta string directo o objeto {text: "..."}
        const text = (typeof wordData === 'string') ? wordData : (wordData.text || "Focus");
        
        createWord(text);
    }

    // Crea una palabra cada 3 segundos
    setTimeout(gameLoop, 3000);
}

function createWord(text) {
    const world = document.getElementById('game-world');
    const div = document.createElement('div');
    div.className = 'word';
    div.innerText = text;

    // Posicionamiento horizontal aleatorio
    const xPos = Math.random() * 75 + 5; // Entre 5% y 80%
    div.style.left = xPos + "vw";
    div.style.top = "-100px"; // Inicia fuera de pantalla

    // Interacción
    div.onclick = (e) => {
        e.stopPropagation();
        state.history.caught.push(text);
        speak(text);
        div.style.transition = "0.2s";
        div.style.transform = "scale(0)";
        setTimeout(() => div.remove(), 200);
    };

    // Auto-eliminación al terminar animación
    div.addEventListener('animationend', () => div.remove());

    world.appendChild(div);
}

// 6. FUNCIONES AUXILIARES
function speak(text) {
    if (!state.audioEnabled) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = (state.language === "en") ? "en-US" : "es-ES";
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
}

function toggleLanguage() {
    state.language = (state.language === "en") ? "es" : "en";
    const msg = (state.language === "en") ? "Language English" : "Idioma Español";
    speak(msg);
}

function toggleAudio() {
    state.audioEnabled = !state.audioEnabled;
    const btn = document.getElementById('speaker-toggle');
    btn.innerText = state.audioEnabled ? "ON" : "OFF";
    if (!state.audioEnabled) window.speechSynthesis.cancel();
}

function generatePDF() {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("AL CIELO - SESSION REPORT", 20, 20);
    doc.setFontSize(14);
    doc.text(`Student: ${state.user}`, 20, 40);
    doc.text(`Words Collected: ${state.history.caught.length}`, 20, 50);
    doc.text("Stories Analyzed:", 20, 70);
    state.history.read.forEach((t, i) => doc.text(`- ${t}`, 30, 80 + (i * 10)));
    doc.save(`AlCielo_${state.user}.pdf`);
}

function endSession() {
    state.isRunning = false;
    generatePDF();
    alert("Session Finished. Report downloaded.");
    location.reload();
}
