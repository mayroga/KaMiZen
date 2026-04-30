let engine = {
    words: [],      // Palabras extraídas de ui.fw
    stories: [],    // Narrativas de stories.json
    timeLeft: 900,  // 15 Minutos (15:00)
    isRunning: false,
    currentStep: 0
};

// 1. CARGA DE DATOS (Orden Crítico)
async function initKamizen() {
    try {
        // Carga paralela para velocidad
        const [storiesRes, dataRes] = await Promise.all([
            fetch('/api/stories'),
            fetch('/api/kamizen_data')
        ]);

        const storiesData = await storiesRes.json();
        const kamizenData = await dataRes.json();

        engine.stories = storiesData.stories; 
        // Accedemos a la estructura jerárquica: ui -> fw (palabras)
        engine.words = kamizenData.ui.fw; 
        
        // Iniciamos con la primera historia
        showStory(true);
    } catch (e) {
        console.error("Falla en la Matrix de datos", e);
    }
}

// 2. NARRATIVA Y VOZ
function showStory(isInitial = false) {
    engine.isRunning = false;
    const storyBox = document.getElementById('story-box');
    
    // Selección de historia (por orden o azar)
    if (engine.stories.length === 0) return;
    const story = engine.stories.shift(); // Saca la primera y la elimina del pool

    document.getElementById('story-title').innerText = story.t;
    document.getElementById('story-content').innerText = story.en;
    storyBox.style.display = 'flex';
    
    speak(`${story.t}. ${story.en}`);
}

function closeStory() {
    document.getElementById('story-box').style.display = 'none';
    if (!engine.isRunning) {
        engine.isRunning = true;
        startMasterClock();
        spawnLoop();
    }
}

// 3. MECÁNICA DE JUEGO (Spawn de palabras)
function spawnLoop() {
    if (!engine.isRunning || engine.timeLeft <= 0) return;

    // Selecciona palabra de ui.fw
    const wordText = engine.words[Math.floor(Math.random() * engine.words.length)];
    createWordElement(wordText);

    // Ajusta el tiempo de aparición (3 segundos)
    setTimeout(spawnLoop, 3000);
}

function createWordElement(text) {
    const el = document.createElement('div');
    el.className = 'word';
    el.innerText = text;
    el.style.left = (Math.random() * 75 + 10) + "vw"; // Rango seguro
    
    el.onclick = () => {
        speak(text);
        el.style.transform = "scale(2.5) rotate(10deg)";
        el.style.opacity = "0";
        el.style.transition = "all 0.4s ease";
        setTimeout(() => el.remove(), 400);
    };
    
    document.getElementById('game-world').appendChild(el);
    // Limpieza automática si no se toca
    setTimeout(() => { if(el.parentNode) el.remove(); }, 8000);
}

// 4. RELOJ Y EVENTOS TEMPORALES
function startMasterClock() {
    const timer = setInterval(() => {
        if (engine.timeLeft <= 0) {
            clearInterval(timer);
            finishApp();
            return;
        }
        engine.timeLeft--;
        updateClockUI();

        // Pausa de Respiración cada 5 min (300s)
        if (engine.timeLeft % 300 === 0 && engine.timeLeft > 0) {
            triggerBreathing();
        }
    }, 1000);
}

function updateClockUI() {
    const m = Math.floor(engine.timeLeft / 60);
    const s = engine.timeLeft % 60;
    document.getElementById('master-clock').innerText = `${m}:${s.toString().padStart(2, '0')}`;
}

// 5. VOZ (Sintetizador)
function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'en-US';
    msg.rate = 0.9; // Un poco más lento para peso y autoridad
    window.speechSynthesis.speak(msg);
}

function finishApp() {
    engine.isRunning = false;
    document.body.innerHTML = `
        <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:black; color:white;">
            <h1 style="font-size:4rem; color:#ffd700;">SESSION COMPLETE</h1>
            <p style="font-size:1.5rem;">KAMIZEN: THE ART OF CONTINUOUS IMPROVEMENT</p>
        </div>
    `;
}

// ARRANQUE AUTOMÁTICO AL CARGAR
window.onload = initKamizen;
