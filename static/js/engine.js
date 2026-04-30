const { jsPDF } = window.jspdf;

let state = {
    user: "Recruit",
    language: "en",
    stats: { stability: 50, resources: 20, energy: 70 },
    score: 0,
    timeLeft: 900,
    isRunning: false,
    missionActive: false,
    currentMissionIndex: 0,
    words: [], 
    missions: [],
    history: { caught: [], missions_done: [] }
};

// Audio
const bgMusic = new Audio('/static/music.mp3');
bgMusic.loop = true;
const popSound = new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3'); // Sonido de explosión

const Voice = {
    speak(text) {
        if (!text) return;
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = state.language === 'es' ? 'es-ES' : 'en-US';
        msg.rate = 0.85;
        speechSynthesis.speak(msg);
    }
};

async function initApp() {
    const nameInput = document.getElementById('user-name');
    state.user = nameInput.value.trim() || "Recruit";
    document.getElementById('avatar-name').innerText = state.user;
    
    await loadDatabase();
    
    document.getElementById('login-screen').style.display = 'none';
    state.isRunning = true;
    
    if (bgMusic) bgMusic.play().catch(e => console.log("Click required for audio"));
    
    startMission(); 
}

async function loadDatabase() {
    try {
        const res = await fetch('/api/mission/next?id=all'); // Ajusta a tu endpoint real
        const data = await res.json();
        
        // Carga palabras desde ui.fw del JSON que enviaste
        if (data.ui && data.ui.fw) {
            state.words = data.ui.fw;
        }
        
        // Carga las misiones
        if (data.missions) {
            state.missions = data.missions;
        }
    } catch (e) {
        // Fallback con tus datos por si el fetch falla
        state.words = ["AWARENESS","SAFETY","CALM","ACTION","TRUTH","CONTROL","HELP","FOCUS"];
        console.error("Error cargando JSON, usando fallback de emergencia.");
    }
}

function startMission() {
    if (state.missions.length === 0) return;
    
    state.missionActive = true;
    const mission = state.missions[state.currentMissionIndex];
    
    // Cambiar Paisaje según categoría (cat)
    changeLandscape(mission.cat);

    // Extraer historia
    const storyObj = mission.b.find(item => item.story);
    const storyText = state.language === 'en' ? storyObj.story.en : storyObj.story.es;

    document.getElementById('story-title').innerText = mission.cat.toUpperCase();
    document.getElementById('story-text').innerText = storyText;
    document.getElementById('story-overlay').style.display = 'flex';
    
    Voice.speak(storyText);
}

function changeLandscape(cat) {
    const b = document.body;
    b.className = ''; // Limpiar
    if (cat === "money") b.classList.add('landscape-city');
    else if (cat === "awareness" || cat === "family") b.classList.add('landscape-zen');
    else b.classList.add('landscape-forest');
}

function spawnWord() {
    if (state.missionActive || !state.isRunning) return;
    
    const text = state.words[Math.floor(Math.random() * state.words.length)];
    
    const div = document.createElement('div');
    div.className = 'word-box';
    div.innerText = text;
    div.style.left = (Math.random() * 70 + 15) + "vw";
    div.style.borderColor = "#00d4ff";

    div.onclick = (e) => {
        e.stopPropagation();
        // EXPLOSIÓN
        div.classList.add('explode');
        popSound.play();
        
        state.score += 10;
        state.stats.energy = Math.min(100, state.stats.energy + 5);
        state.history.caught.push(text);
        
        updateHUD();
        Voice.speak(text);
        setTimeout(() => div.remove(), 300);
    };

    document.body.appendChild(div);
    setTimeout(() => { if(div.parentNode) div.remove(); }, 8000);
}

function updateHUD() {
    document.getElementById('bar-stability').style.height = state.stats.stability + "%";
    document.getElementById('bar-resources').style.height = state.stats.resources + "%";
    document.getElementById('bar-energy').style.height = state.stats.energy + "%";
    document.getElementById('avatar-name').innerText = `${state.user} | Score: ${state.score}`;
}

function closeStory() {
    document.getElementById('story-overlay').style.display = 'none';
    state.missionActive = false;
    // Incrementar para la próxima vez
    state.currentMissionIndex = (state.currentMissionIndex + 1) % state.missions.length;
}

// Reloj Maestro
setInterval(() => {
    if (!state.isRunning) return;
    state.timeLeft--;
    
    const m = Math.floor(state.timeLeft / 60);
    const s = state.timeLeft % 60;
    document.getElementById('master-clock').innerText = `${m}:${s.toString().padStart(2, '0')}`;
    
    if (state.timeLeft % 120 === 0) startMission(); // Nueva misión cada 2 min
    if (state.timeLeft <= 0) location.reload();
}, 1000);

setInterval(spawnWord, 2500);
