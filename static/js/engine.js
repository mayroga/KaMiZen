const { jsPDF } = window.jspdf;

let state = {
    user: "", language: "en", audioEnabled: true,
    timeLeft: 900, isRunning: false,
    words: [], stories: [],
    history: { read: [], caught: [] }
};

// Iniciar Aplicación
async function initApp() {
    const nameInput = document.getElementById('user-name');
    if (!nameInput.value.trim()) return;
    
    state.user = nameInput.value.trim().split(" ")[0]; // Solo nombre
    document.getElementById('display-name').innerText = state.user;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-world').style.display = 'block';

    await loadResources();
    speak(`Welcome ${state.user}. Let's begin your wisdom training.`);
    showStory();
}

async function loadResources() {
    try {
        const [wRes, sRes] = await Promise.all([
            fetch('/data/kamizen_data.json'),
            fetch('/data/stories.json')
        ]);
        state.words = (await wRes.json()).words;
        state.stories = (await sRes.json()).stories;
    } catch (err) {
        console.error("Critical: Data files not found.");
    }
}

// Sistema de Historias de Sabiduría
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
        startTimer();
        gameLoop();
    }
}

// Reloj Maestro de 15 Minutos
function startTimer() {
    const countdown = setInterval(() => {
        if (state.timeLeft <= 0) {
            clearInterval(countdown);
            endSession();
            return;
        }
        state.timeLeft--;
        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;
        document.getElementById('master-clock').innerText = `${m}:${s.toString().padStart(2, '0')}`;
        
        if (state.timeLeft % 300 === 0) runBreathing(); // Pausa cada 5 min
    }, 1000);
}

// Bucle de Entrenamiento (Palabras que caen)
function gameLoop() {
    if (!state.isRunning || state.timeLeft <= 0) return;
    
    const data = state.words[Math.floor(Math.random() * state.words.length)];
    const el = document.createElement('div');
    el.className = 'word';
    el.innerText = data.text;
    el.style.left = (Math.random() * 75 + 10) + "vw";
    
    el.onclick = () => {
        state.history.caught.push(data.text);
        speak(data.text);
        el.style.transform = "scale(1.5)";
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 200);
    };

    document.getElementById('game-world').appendChild(el);
    setTimeout(gameLoop, 3500);
}

// Funciones de Panel de Control
function toggleLanguage() {
    state.language = (state.language === "en") ? "es" : "en";
    speak(state.language === "en" ? "Language English" : "Idioma Español");
}

function toggleAudio() {
    state.audioEnabled = !state.audioEnabled;
    document.getElementById('speaker-toggle').innerText = state.audioEnabled ? "ON" : "OFF";
    if(!state.audioEnabled) window.speechSynthesis.cancel();
}

function generatePDF() {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    doc.setFontSize(22); doc.setTextColor(0, 212, 255);
    doc.text("AL CIELO - ADVISORY REPORT", 20, 30);
    
    doc.setFontSize(16); doc.setTextColor(0, 0, 0);
    doc.text(`Student: ${state.user}`, 20, 50);
    doc.text(`Date: ${today}`, 20, 60);

    doc.text("Lessons Completed:", 20, 80);
    state.history.read.forEach((t, i) => {
        doc.text(`- ${t}`, 30, 95 + (i * 10));
    });

    doc.save(`Al_Cielo_Report_${state.user}.pdf`);
}

// Narrativa de Voz
function speak(text) {
    if (!state.audioEnabled) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = (state.language === "en") ? "en-US" : "es-ES";
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
}

// Sesión de Respiración
async function runBreathing() {
    state.isRunning = false;
    const overlay = document.getElementById('breath-overlay');
    overlay.style.display = 'flex';
    for(let i=0; i<2; i++) {
        overlay.innerText = (state.language === "en") ? "INHALE" : "INHALE";
        overlay.style.transform = "translate(-50%, -50%) scale(1.4)";
        await new Promise(r => setTimeout(r, 4000));
        overlay.innerText = (state.language === "en") ? "EXHALE" : "EXHALE";
        overlay.style.transform = "translate(-50%, -50%) scale(1)";
        await new Promise(r => setTimeout(r, 4000));
    }
    overlay.style.display = 'none';
    state.isRunning = true;
    gameLoop();
}

function endSession() {
    state.isRunning = false;
    generatePDF();
    document.body.innerHTML = `
        <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#000;">
            <h1 style="color:var(--blue); font-size:3rem;">SESSION COMPLETE</h1>
            <p style="font-size:1.5rem;">Thank you, ${state.user}. Your report has been generated.</p>
        </div>
    `;
}
