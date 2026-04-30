const { jsPDF } = window.jspdf;

let state = {
    user: "", language: "en", audioEnabled: true,
    timeLeft: 900, isRunning: false,
    currentMissionId: "1",
    words: [], // Se llenará con la misión actual
    stories: [], // Se llenará desde stories.json
    history: { read: [], caught: [] }
};

async function initApp() {
    const nameInput = document.getElementById('user-name');
    if (!nameInput.value.trim()) return;
    
    state.user = nameInput.value.trim().split(" ")[0];
    document.getElementById('display-name').innerText = state.user;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-world').style.display = 'block';

    await loadInitialData();
    speak(`Welcome ${state.user}. Loading your first mission.`);
    showStory();
}

// Carga inicial de historias y la primera misión
async function loadInitialData() {
    try {
        // Cargar historias
        const storyRes = await fetch('/api/stories');
        const storyData = await storyRes.json();
        state.stories = storyData.stories;

        // Cargar primera misión
        await loadNextMission();
    } catch (e) { console.error("Error loading data", e); }
}

async function loadNextMission() {
    const res = await fetch(`/api/mission/next?id=${state.currentMissionId}`);
    const data = await res.json();
    if (data.success) {
        // En tus JSON de misiones, asumimos que las palabras vienen en una lista
        state.words = data.mission.words || []; 
        state.currentMissionId = data.next_id;
    }
}

function showStory() {
    state.isRunning = false;
    // Seleccionar historia aleatoria del JSON
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
        gameLoop();
    }
}

function startTimer() {
    const countdown = setInterval(() => {
        if (state.timeLeft <= 0) {
            clearInterval(countdown);
            endSession();
            return;
        }
        state.timeLeft--;
        updateUIClock();
        
        // Cada 3 minutos (180s) cargar la siguiente misión de los archivos JSON
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

function gameLoop() {
    if (!state.isRunning || state.timeLeft <= 0) return;
    
    // Si hay palabras cargadas de la misión actual
    if (state.words.length > 0) {
        const data = state.words[Math.floor(Math.random() * state.words.length)];
        createWordElement(data);
    }
    
    setTimeout(gameLoop, 3000);
}

function createWordElement(data) {
    const el = document.createElement('div');
    el.className = 'word';
    el.innerText = data.text;
    el.style.left = (Math.random() * 70 + 10) + "vw";
    
    el.onclick = () => {
        state.history.caught.push(data.text);
        speak(data.text);
        el.remove();
    };
    document.getElementById('game-world').appendChild(el);
}

function generatePDF() {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("AL CIELO - SESSION REPORT", 20, 20);
    doc.setFontSize(14);
    doc.text(`Student: ${state.user}`, 20, 40);
    doc.text("Stories explored:", 20, 60);
    state.history.read.forEach((t, i) => doc.text(`- ${t}`, 30, 70 + (i * 10)));
    doc.save(`Report_${state.user}.pdf`);
}

function speak(text) {
    if (!state.audioEnabled) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = (state.language === "en") ? "en-US" : "es-ES";
    window.speechSynthesis.speak(msg);
}

function toggleLanguage() {
    state.language = (state.language === "en") ? "es" : "en";
    alert("Language: " + state.language.toUpperCase());
}

function toggleAudio() {
    state.audioEnabled = !state.audioEnabled;
    document.getElementById('speaker-toggle').innerText = state.audioEnabled ? "ON" : "OFF";
}

function endSession() {
    state.isRunning = false;
    generatePDF();
    document.body.innerHTML = "<h1 style='color:white; text-align:center; margin-top:20%;'>SESSION COMPLETE. PDF READY.</h1>";
}
