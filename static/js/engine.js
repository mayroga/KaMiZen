/**
 * AL CIELO - AURA BY MAY ROGA
 * Engine de Entrenamiento de Sabiduría
 */

const { jsPDF } = window.jspdf;

let state = {
    user: "",
    language: "en",
    audioEnabled: true,
    timeLeft: 900, // 15 minutos
    isRunning: false,
    currentMissionId: "1",
    words: [], // Inventario de palabras de la misión actual
    stories: [], // Inventario de historias de sabiduria
    history: {
        read: [],
        caught: []
    }
};

/**
 * Inicialización de la Aplicación
 */
async function initApp() {
    const nameInput = document.getElementById('user-name');
    if (!nameInput.value.trim()) return;
    
    state.user = nameInput.value.trim().split(" ")[0];
    document.getElementById('display-name').innerText = state.user;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-world').style.display = 'block';

    // Cargar datos del servidor
    await loadInitialData();
    
    // Bienvenida y primera historia
    speak(state.language === "en" ? `Welcome ${state.user}. Let's begin.` : `Bienvenido ${state.user}. Comencemos.`);
    showStory();
}

/**
 * Carga de Datos desde main.py
 */
async function loadInitialData() {
    try {
        // 1. Cargar todas las historias de sabiduria
        const storyRes = await fetch('/api/stories');
        const storyData = await storyRes.json();
        state.stories = storyData.stories || [];

        // 2. Cargar la primera tanda de misiones
        await loadNextMission();
    } catch (e) {
        console.error("Error crítico de carga:", e);
    }
}

/**
 * Carga de Misiones Dinámicas (Archivos missions_XX_XX.json)
 */
async function loadNextMission() {
    console.log(`Cargando Misión ID: ${state.currentMissionId}`);
    try {
        const res = await fetch(`/api/mission/next?id=${state.currentMissionId}`);
        const data = await res.json();
        
        if (data.success && data.mission) {
            // EXTRACCIÓN FLEXIBLE: 
            // Buscamos palabras en cualquier nivel del JSON (lista directa, .words o .missions)
            let newWords = [];
            if (Array.isArray(data.mission.words)) {
                newWords = data.mission.words;
            } else if (Array.isArray(data.mission.missions)) {
                newWords = data.mission.missions.flatMap(m => m.words || []);
            } else if (Array.isArray(data.mission)) {
                newWords = data.mission;
            }

            // Normalizamos para asegurar que siempre haya texto
            state.words = newWords.map(w => typeof w === 'string' ? { text: w } : w);
            state.currentMissionId = data.next_id;
            
            console.log("Palabras de misión listas:", state.words.length);
        }
    } catch (e) {
        console.error("Fallo al conectar con misiones:", e);
    }
}

/**
 * Interfaz de Historias (Wisdom Moment)
 */
function showStory() {
    state.isRunning = false; // Pausar juego mientras lee
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
    if (!state.isRunning) {
        state.isRunning = true;
        startTimer();
        // Disparo inmediato de palabras para evitar pantalla vacía
        generateInitialBurst();
        gameLoop();
    }
}

/**
 * Gestión del Tiempo y Misiones
 */
function startTimer() {
    // Evitar múltiples timers
    if (window.timerInterval) clearInterval(window.timerInterval);

    window.timerInterval = setInterval(() => {
        if (state.timeLeft <= 0) {
            clearInterval(window.timerInterval);
            endSession();
            return;
        }

        state.timeLeft--;
        updateUIClock();
        
        // Cambio de misión cada 3 minutos (180 segundos)
        if (state.timeLeft % 180 === 0 && state.currentMissionId) {
            loadNextMission();
        }
    }, 1000);
}

function updateUIClock() {
    const m = Math.floor(state.timeLeft / 60);
    const s = state.timeLeft % 60;
    document.getElementById('master-clock').innerText = `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Lógica del Juego (Palabras que caen)
 */
function gameLoop() {
    if (!state.isRunning || state.timeLeft <= 0) return;
    
    if (state.words.length > 0) {
        const randomIndex = Math.floor(Math.random() * state.words.length);
        const wordData = state.words[randomIndex];
        createWordElement(wordData.text || wordData);
    }
    
    // Intervalo de caída constante
    setTimeout(gameLoop, 3000);
}

function generateInitialBurst() {
    for(let i = 0; i < 3; i++) {
        setTimeout(() => {
            if (state.words.length > 0) {
                const w = state.words[Math.floor(Math.random() * state.words.length)];
                createWordElement(w.text || w);
            }
        }, i * 800);
    }
}

function createWordElement(text) {
    const container = document.getElementById('game-world');
    const el = document.createElement('div');
    el.className = 'word';
    el.innerText = text;
    
    // Posición horizontal aleatoria (10% a 80% del ancho)
    el.style.left = (Math.random() * 70 + 10) + "vw";
    
    // Al hacer click, recolectamos la palabra
    el.onclick = () => {
        state.history.caught.push(text);
        speak(text);
        el.style.transform = "scale(1.5)";
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 200);
    };

    // Auto-limpieza al terminar la animación de caída (definida en CSS)
    el.addEventListener('animationend', () => el.remove());

    container.appendChild(el);
}

/**
 * Herramientas y Utilidades
 */
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
    const status = (state.language === "en") ? "Language: English" : "Idioma: Español";
    speak(status);
}

function toggleAudio() {
    state.audioEnabled = !state.audioEnabled;
    const btn = document.getElementById('speaker-toggle');
    if (btn) btn.innerText = state.audioEnabled ? "ON" : "OFF";
    if (!state.audioEnabled) window.speechSynthesis.cancel();
}

/**
 * Generación de Reporte Final
 */
function generatePDF() {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    doc.setFontSize(22);
    doc.setTextColor(0, 180, 255);
    doc.text("AL CIELO - SESSION REPORT", 20, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Student: ${state.user}`, 20, 40);
    doc.text(`Date: ${today}`, 20, 50);

    doc.text("Wisdom Stories Explored:", 20, 70);
    state.history.read.forEach((t, i) => {
        doc.text(`- ${t}`, 30, 80 + (i * 10));
    });

    doc.text(`Words Collected: ${state.history.caught.length}`, 20, 150);

    doc.save(`Al_Cielo_${state.user}_${today}.pdf`);
}

function endSession() {
    state.isRunning = false;
    generatePDF();
    document.body.innerHTML = `
        <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#000; color:white; font-family:sans-serif;">
            <h1 style="color:#00d4ff;">TRAINING COMPLETE</h1>
            <p>Thank you, ${state.user}. Your Wisdom Report has been saved.</p>
            <button onclick="location.reload()" style="padding:15px 30px; border-radius:10px; border:none; background:#2ecc71; color:white; cursor:pointer;">NEW SESSION</button>
        </div>
    `;
}
