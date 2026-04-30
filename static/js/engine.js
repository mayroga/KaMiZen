const { jsPDF } = window.jspdf;

let state = {
    user: "Recruit",
    stats: { stability: 50, resources: 20, energy: 70 },
    score: 0,
    timeLeft: 900,
    isRunning: false,
    missionActive: false,
    currentMissionId: "1",
    words: [], // Se llena desde los JSON
    storyPool: [], // Se llena desde stories.json
    history: { caught: [], stories: [] }
};

const Voice = {
    speak(text) {
        if (!text) return;
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = state.language === 'es' ? 'es-ES' : 'en-US';
        msg.rate = 0.9;
        speechSynthesis.speak(msg);
    }
};

async function initApp() {
    const nameInput = document.getElementById('user-name'); // Asumiendo que añades el input en el HTML
    state.user = nameInput?.value || "Recruit";
    document.getElementById('avatar-name').innerText = state.user;
    
    await loadInitialData();
    state.isRunning = true;
    showStory(); 
}

// Carga datos reales de los archivos JSON
async function loadInitialData() {
    try {
        const sRes = await fetch('/api/stories');
        const sData = await sRes.json();
        state.storyPool = sData.stories || [];
        await loadNextMission();
    } catch (e) { console.error("Error inicializando:", e); }
}

async function loadNextMission() {
    try {
        const res = await fetch(`/api/mission/next?id=${state.currentMissionId}`);
        const data = await res.json();
        if (data.success) {
            let raw = data.mission.words || data.mission.missions || data.mission;
            state.words = Array.isArray(raw) ? (raw[0]?.words || raw) : [];
            state.currentMissionId = data.next_id;
            console.log("Misión cargada con", state.words.length, "palabras");
        }
    } catch (e) { console.error("Error en misiones:", e); }
}

function spawnWord() {
    if (state.missionActive || !state.isRunning || state.words.length === 0) return;
    
    const wordData = state.words[Math.floor(Math.random() * state.words.length)];
    const text = typeof wordData === 'string' ? wordData : (wordData.text || "FOCUS");

    const div = document.createElement('div');
    div.className = 'word-box';
    div.innerText = text;
    div.style.left = (Math.random() * 70 + 15) + "vw";
    div.style.top = "-50px";

    div.onclick = () => {
        // Efecto Explosión y Puntos
        div.classList.add('explode');
        state.score += 10;
        state.stats.energy = Math.min(100, state.stats.energy + 5);
        state.history.caught.push(text);
        
        updateHUD();
        Voice.speak(text);
        setTimeout(() => div.remove(), 300);
    };

    document.body.appendChild(div);
    
    // Penalización si se escapa
    div.addEventListener('animationend', () => {
        if(div.parentNode) {
            state.score = Math.max(0, state.score - 5);
            state.stats.stability = Math.max(0, state.stats.stability - 2);
            updateHUD();
            div.remove();
        }
    });
}

function updateHUD() {
    document.getElementById('bar-stability').style.height = state.stats.stability + "%";
    document.getElementById('bar-resources').style.height = state.stats.resources + "%";
    document.getElementById('bar-energy').style.height = state.stats.energy + "%";
    document.getElementById('avatar-name').innerText = `${state.user} | ${state.score}`;
}

function showStory() {
    if (state.storyPool.length === 0) return;
    state.missionActive = true;
    const story = state.storyPool.shift();
    state.history.stories.push(story.t || story.title);
    
    const overlay = document.getElementById('story-overlay');
    document.getElementById('story-title').innerText = story.t || story.title;
    document.getElementById('story-text').innerText = (state.language === 'es' ? story.es : story.en) || story.text;
    overlay.style.display = 'flex';
    
    Voice.speak((story.t || story.title) + ". " + ((state.language === 'es' ? story.es : story.en) || story.text));
}

function closeStory() {
    document.getElementById('story-overlay').style.display = 'none';
    state.missionActive = false;
    startBreathingExercise();
}

async function startBreathingExercise() {
    const circle = document.getElementById('breath-circle');
    const text = document.getElementById('breath-text');
    circle.style.display = 'flex';
    
    for(let i=0; i<3; i++) {
        text.innerText = "INHALE"; circle.style.transform = "scale(1.5)";
        await new Promise(r => setTimeout(r, 4000));
        text.innerText = "EXHALE"; circle.style.transform = "scale(1)";
        await new Promise(r => setTimeout(r, 4000));
    }
    circle.style.display = 'none';
}

// Reloj y Ciclos
setInterval(() => {
    if (!state.isRunning) return;
    if (state.timeLeft <= 0) { endSession(); return; }
    
    state.timeLeft--;
    const m = Math.floor(state.timeLeft / 60);
    const s = state.timeLeft % 60;
    document.getElementById('master-clock').innerText = `${m}:${s.toString().padStart(2, '0')}`;
    
    if (state.timeLeft % 180 === 0) showStory();
    if (state.timeLeft % 60 === 0) loadNextMission(); // Carga nuevo set de palabras cada minuto
}, 1000);

setInterval(spawnWord, 3000);

function endSession() {
    state.isRunning = false;
    const doc = new jsPDF();
    doc.text("AL CIELO - SESSION COMPLETE", 20, 20);
    doc.text(`Student: ${state.user}`, 20, 40);
    doc.text(`Final Score: ${state.score}`, 20, 50);
    doc.save(`Report_${state.user}.pdf`);
    document.body.innerHTML = "<h1 style='text-align:center; margin-top:40vh;'>SESSION SAVED. RELOAD TO START.</h1>";
}
