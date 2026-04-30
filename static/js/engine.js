const { jsPDF } = window.jspdf;

let state = {
    user: "", language: "en", audioEnabled: true,
    timeLeft: 900, isRunning: false,
    score: 0, 
    currentMissionId: "1",
    words: [], stories: [],
    history: { read: [], caught: [] }
};

// Audio Elements
const bgMusic = new Audio('/static/music.mp3');
bgMusic.loop = true;

/**
 * Inicialización
 */
async function initApp() {
    const nameInput = document.getElementById('user-name');
    if (!nameInput.value.trim()) return;
    
    state.user = nameInput.value.trim().split(" ")[0];
    document.getElementById('display-name').innerText = `${state.user} | Score: 0`;
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-world').style.display = 'block';

    if (state.audioEnabled) bgMusic.play().catch(e => console.log("Music needs interaction"));

    await loadData();
    showStory();
}

/**
 * Lectura de JSON - Fuerza la búsqueda de palabras
 */
async function loadData() {
    try {
        const sRes = await fetch('/api/stories');
        const sData = await sRes.json();
        state.stories = sData.stories || [];
        await loadNextMission();
    } catch (e) { console.error("Error loading data", e); }
}

async function loadNextMission() {
    try {
        const res = await fetch(`/api/mission/next?id=${state.currentMissionId}`);
        const data = await res.json();
        
        if (data.success) {
            // Buscamos palabras en cualquier estructura del JSON
            let missionData = data.mission;
            let extractedWords = [];

            if (missionData.missions) { // Estructura missions_01_07
                extractedWords = missionData.missions.flatMap(m => m.words || []);
            } else if (missionData.words) {
                extractedWords = missionData.words;
            } else if (Array.isArray(missionData)) {
                extractedWords = missionData;
            }

            // Filtrar y limpiar (evitar el "Focus" genérico)
            state.words = extractedWords.length > 0 ? extractedWords : ["Wisdom", "Focus", "Aura"];
            state.currentMissionId = data.next_id;
            console.log("Palabras cargadas de misión:", state.words.length);
        }
    } catch (e) { console.error("Error cargando misiones", e); }
}

/**
 * Historias
 */
function showStory() {
    state.isRunning = false;
    const story = state.stories[Math.floor(Math.random() * state.stories.length)];
    if (!story) return closeStory();

    state.history.read.push(story.t);
    document.getElementById('story-title').innerText = story.t;
    document.getElementById('story-content').innerText = (state.language === "en") ? story.en : story.es;
    document.getElementById('story-box').style.display = 'flex';
    
    speak(story.t + ". " + (state.language === "en" ? story.en : story.es));
}

function closeStory() {
    document.getElementById('story-box').style.display = 'none';
    state.isRunning = true;
    startTimers();
}

/**
 * Timers y Generación de Palabras
 */
function startTimers() {
    // Reloj
    if (!window.masterClock) {
        window.masterClock = setInterval(() => {
            if (!state.isRunning) return;
            state.timeLeft--;
            updateUI();
            if (state.timeLeft % 180 === 0) loadNextMission();
            if (state.timeLeft <= 0) endSession();
        }, 1000);
    }

    // Lluvia intensa de palabras
    if (!window.wordInterval) {
        window.wordInterval = setInterval(() => {
            if (!state.isRunning) return;
            // Soltar de 1 a 2 palabras por ciclo para que haya volumen
            const count = Math.floor(Math.random() * 2) + 1;
            for(let i=0; i<count; i++) {
                setTimeout(() => createFloatingWord(), i * 500);
            }
        }, 2000);
    }
}

function updateUI() {
    const m = Math.floor(state.timeLeft / 60);
    const s = state.timeLeft % 60;
    document.getElementById('master-clock').innerText = `${m}:${s.toString().padStart(2, '0')}`;
    document.getElementById('display-name').innerText = `${state.user} | Score: ${state.score}`;
}

/**
 * Gamificación: Creación y Explosión
 */
function createFloatingWord() {
    if (state.words.length === 0) return;
    
    const world = document.getElementById('game-world');
    const wordData = state.words[Math.floor(Math.random() * state.words.length)];
    const text = typeof wordData === 'string' ? wordData : (wordData.text || "Wisdom");
    
    const div = document.createElement('div');
    div.className = 'word';
    div.innerText = text;
    
    // Aleatoriedad
    div.style.left = (Math.random() * 80 + 5) + "vw";
    div.style.animationDuration = (Math.random() * 5 + 5) + "s"; // Velocidad variable

    div.onclick = (e) => {
        e.stopPropagation();
        explodeWord(div, text);
    };

    div.addEventListener('animationend', () => {
        // Penalización si la palabra se escapa
        if (state.score > 0) state.score -= 5;
        updateUI();
        div.remove();
    });

    world.appendChild(div);
}

function explodeWord(element, text) {
    // Efecto visual de explosión
    element.style.transform = "scale(2)";
    element.style.opacity = "0";
    element.style.pointerEvents = "none";

    // Puntos
    state.score += 10;
    state.history.caught.push(text);
    updateUI();

    // No leemos la palabra con voz para no saturar el audio mientras juegas
    // Solo suena un "pop" o el sonido del sistema si lo deseas
    
    setTimeout(() => element.remove(), 300);
}

/**
 * Audio y Control
 */
function speak(text) {
    if (!state.audioEnabled) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = (state.language === "en") ? "en-US" : "es-ES";
    window.speechSynthesis.speak(msg);
}

function toggleLanguage() {
    state.language = (state.language === "en") ? "es" : "en";
    speak(state.language === "en" ? "English mode" : "Modo español");
}

function toggleAudio() {
    state.audioEnabled = !state.audioEnabled;
    document.getElementById('speaker-toggle').innerText = state.audioEnabled ? "ON" : "OFF";
    if (!state.audioEnabled) {
        bgMusic.pause();
        window.speechSynthesis.cancel();
    } else {
        bgMusic.play();
    }
}

function generatePDF() {
    const doc = new jsPDF();
    doc.text("AL CIELO - SESSION REPORT", 20, 20);
    doc.text(`Student: ${state.user}`, 20, 40);
    doc.text(`Final Score: ${state.score}`, 20, 50);
    doc.text(`Words Collected: ${state.history.caught.length}`, 20, 60);
    doc.save(`Aura_Report_${state.user}.pdf`);
}

function endSession() {
    state.isRunning = false;
    clearInterval(window.masterClock);
    clearInterval(window.wordInterval);
    generatePDF();
    alert(`Session Complete! Final Score: ${state.score}`);
    location.reload();
}
