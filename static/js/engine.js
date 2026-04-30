const { jsPDF } = window.jspdf;

let state = {
    user: "", language: "en", audioEnabled: true,
    timeLeft: 900, isRunning: false,
    words: [], stories: [],
    history: { read: [], wordsCaught: [] }
};

// 1. Iniciar App
async function initApp() {
    const input = document.getElementById('user-name').value.trim();
    if (!input) return;
    
    state.user = input.split(" ")[0];
    document.getElementById('display-name').innerText = state.user;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-world').style.display = 'block';

    await loadFiles();
    speak(`Welcome ${state.user}. Prepared for your advisory session.`);
    showStory();
}

async function loadFiles() {
    const [wRes, sRes] = await Promise.all([
        fetch('/data/kamizen_data.json'),
        fetch('/data/stories.json')
    ]);
    state.words = (await wRes.json()).words;
    state.stories = (await sRes.json()).stories;
}

// 2. Sistema de Historias
function showStory() {
    state.isRunning = false;
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
        startClock();
        runGame();
    }
}

// 3. Reloj y Juego
function startClock() {
    const timer = setInterval(() => {
        if (state.timeLeft <= 0) {
            clearInterval(timer);
            finishApp();
            return;
        }
        state.timeLeft--;
        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;
        document.getElementById('master-clock').innerText = `${m}:${s.toString().padStart(2, '0')}`;
        
        if (state.timeLeft % 300 === 0) triggerZen();
    }, 1000);
}

function runGame() {
    if (!state.isRunning || state.timeLeft <= 0) return;
    
    const data = state.words[Math.floor(Math.random() * state.words.length)];
    const el = document.createElement('div');
    el.className = 'word';
    el.innerText = data.text;
    el.style.left = (Math.random() * 80 + 10) + "vw";
    
    el.onclick = () => {
        state.history.wordsCaught.push(data.text);
        speak(data.text);
        el.remove();
    };

    document.getElementById('game-world').appendChild(el);
    setTimeout(runGame, 3000);
}

// 4. Botones de Control
function toggleLanguage() {
    state.language = (state.language === "en") ? "es" : "en";
    alert("Language changed to: " + state.language.toUpperCase());
}

function toggleAudio() {
    state.audioEnabled = !state.audioEnabled;
    document.getElementById('speaker-toggle').innerText = state.audioEnabled ? "ON" : "OFF";
}

function clearData() {
    if(confirm("Clear all data and reset?")) window.location.reload();
}

// 5. PDF Report
function generatePDF() {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("AL CIELO - ADVISORY REPORT", 20, 20);
    doc.setFontSize(14);
    doc.text(`Student: ${state.user}`, 20, 40);
    doc.text(`Total Training Time: 15 Minutes`, 20, 50);
    doc.text("Lessons Completed:", 20, 70);
    state.history.read.forEach((t, i) => doc.text(`- ${t}`, 30, 80 + (i * 10)));
    doc.save(`Advisory_${state.user}.pdf`);
}

// 6. Audio y Finalización
function speak(text) {
    if (!state.audioEnabled) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = (state.language === "en") ? "en-US" : "es-ES";
    window.speechSynthesis.speak(msg);
}

function finishApp() {
    state.isRunning = false;
    generatePDF();
    document.body.innerHTML = "<div style='height:100vh; display:flex; align-items:center; justify-content:center; background:black;'><h1>SESSION COMPLETE. THANK YOU.</h1></div>";
}

async function triggerZen() {
    state.isRunning = false;
    const overlay = document.getElementById('breath-overlay');
    overlay.style.display = 'flex';
    overlay.innerText = "INHALE"; overlay.style.transform = "translate(-50%, -50%) scale(1.5)";
    await new Promise(r => setTimeout(r, 4000));
    overlay.innerText = "EXHALE"; overlay.style.transform = "translate(-50%, -50%) scale(1)";
    await new Promise(r => setTimeout(r, 4000));
    overlay.style.display = 'none';
    state.isRunning = true;
}
