const { jsPDF } = window.jspdf;

let state = {
    user: "Recruit",
    score: 0,
    timeLeft: 900,
    isRunning: false,
    missionActive: false,
    currentMissionId: "1",
    words: [], // Aquí irán Awareness, Safety, etc.
    missionsData: [], // Bloques de misiones del JSON
    currentStep: 0,
    history: { caught: [], missions: [] }
};

const bgMusic = new Audio('/static/music.mp3');
bgMusic.loop = true;

const Voice = {
    speak(text) {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'en-US';
        msg.rate = 0.85;
        speechSynthesis.speak(msg);
    }
};

async function initApp() {
    const nameInput = document.getElementById('user-name');
    state.user = nameInput.value.trim() || "Recruit";
    document.getElementById('avatar-name').innerText = state.user;
    
    // 1. CARGAR STORIES PRIMERO
    await loadStories();
    // 2. CARGAR PRIMERA MISIÓN
    await loadMissionData();
    
    document.getElementById('login-screen').style.display = 'none';
    state.isRunning = true;
    bgMusic.play().catch(e => console.log("Audio waiting for interaction"));
    
    // Lanzar primera historia de la misión
    showMissionStep();
}

async function loadStories() {
    try {
        const res = await fetch('/api/stories');
        const data = await res.json();
        // Puedes usar esto para intros generales si lo deseas
    } catch (e) { console.error("Stories error"); }
}

async function loadMissionData() {
    try {
        const res = await fetch(`/api/mission/next?id=${state.currentMissionId}`);
        const data = await res.json();
        
        if (data.success) {
            const mFile = data.mission;
            // Extraer palabras del UI del JSON
            state.words = mFile.ui.fw; 
            // Extraer lista de misiones
            state.missionsData = mFile.missions;
            state.currentMissionId = data.next_id;
        }
    } catch (e) { console.error("Mission load error"); }
}

function showMissionStep() {
    state.missionActive = true;
    const currentMission = state.missionsData[state.currentStep];
    
    // Buscar la historia dentro del bloque 'b'
    const storyBlock = currentMission.b.find(item => item.story);
    const text = storyBlock.story.en;

    document.getElementById('story-title').innerText = currentMission.cat.toUpperCase();
    document.getElementById('story-text').innerText = text;
    document.getElementById('story-overlay').style.display = 'flex';
    
    Voice.speak(text);
}

function closeStory() {
    document.getElementById('story-overlay').style.display = 'none';
    state.missionActive = false;
    // Preparar siguiente paso para el próximo ciclo de 3 minutos
    state.currentStep = (state.currentStep + 1) % state.missionsData.length;
}

function spawnWord() {
    if (state.missionActive || !state.isRunning) return;

    const text = state.words[Math.floor(Math.random() * state.words.length)];
    const div = document.createElement('div');
    div.className = 'word-box';
    div.innerText = text;
    div.style.left = (Math.random() * 70 + 15) + "vw";

    div.onclick = (e) => {
        e.stopPropagation();
        div.classList.add('explode');
        state.score += 10;
        updateHUD();
        Voice.speak(text);
        setTimeout(() => div.remove(), 300);
    };

    document.body.appendChild(div);
    setTimeout(() => { if(div.parentNode) div.remove(); }, 8000);
}

function updateHUD() {
    document.getElementById('avatar-name').innerText = `${state.user} | Score: ${state.score}`;
}

// RELOJ MAESTRO
setInterval(() => {
    if (!state.isRunning) return;
    state.timeLeft--;
    
    const m = Math.floor(state.timeLeft / 60);
    const s = state.timeLeft % 60;
    document.getElementById('master-clock').innerText = `${m}:${s.toString().padStart(2, '0')}`;
    
    // Cada 3 minutos (180s) mostrar nueva historia/misión
    if (state.timeLeft % 180 === 0) showMissionStep();
    
    // Si se acaban las misiones del archivo, cargar el siguiente JSON
    if (state.timeLeft === 450) loadMissionData(); 
}, 1000);

setInterval(spawnWord, 2500);
