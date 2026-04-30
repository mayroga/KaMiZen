let engine = {
    words: [],      // De kamizen_data.json
    stories: [],    // De stories.json
    timeLeft: 900,  // 15 Minutos
    isRunning: false,
    currentLandscape: 'forest'
};

// 1. Cargar Datos
async function loadData() {
    try {
        const wordsRes = await fetch('/data/kamizen_data.json');
        const storiesRes = await fetch('/data/stories.json');
        const wordsData = await wordsRes.json();
        const storiesData = await storiesRes.json();
        
        engine.words = wordsData.words;
        engine.stories = storiesData.stories;
        
        startSession();
    } catch (e) { console.error("Error cargando JSONs", e); }
}

// 2. Iniciar Sesión (Con Historia)
function startSession() {
    showStory(true); // Historia al principio
}

// 3. Control del Reloj y Cierre Automático
function startMasterClock() {
    const timer = setInterval(() => {
        if (engine.timeLeft <= 0) {
            clearInterval(timer);
            finishApp();
            return;
        }
        engine.timeLeft--;
        updateClockUI();
        
        // Cada 5 minutos, una pequeña pausa de respiración
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

// 4. Mostrar Historias (Sin repetir)
function showStory(isInitial = false) {
    engine.isRunning = false;
    const storyBox = document.getElementById('story-box');
    
    // Sacamos una historia al azar y la removemos del pool
    const index = Math.floor(Math.random() * engine.stories.length);
    const story = engine.stories.splice(index, 1)[0];

    document.getElementById('story-title').innerText = story.t;
    document.getElementById('story-content').innerText = story.en; // Puedes cambiar a .es si prefieres
    storyBox.style.display = 'flex';
    
    speak(story.t + ". " + story.en);
}

function closeStory() {
    document.getElementById('story-box').style.display = 'none';
    if (!engine.isRunning) {
        engine.isRunning = true;
        startMasterClock();
        spawnLoop();
    }
}

// 5. El Juego de Palabras y Muñequito
function spawnLoop() {
    if (!engine.isRunning || engine.timeLeft <= 0) return;

    const wordData = engine.words[Math.floor(Math.random() * engine.words.length)];
    createWordElement(wordData);

    setTimeout(spawnLoop, 3000); // Aparece palabra cada 3 segundos
}

function createWordElement(data) {
    const el = document.createElement('div');
    el.className = 'word';
    el.innerText = data.text;
    el.style.left = (Math.random() * 80 + 10) + "vw";
    
    // Cambiar paisaje según tipo
    updateEnvironment(data.type);

    el.onclick = () => {
        speak(data.text);
        el.style.transform = "scale(2)";
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 200);
    };
    
    document.getElementById('game-world').appendChild(el);
}

function updateEnvironment(type) {
    const world = document.getElementById('game-world');
    world.className = ''; // Reset
    if (type === 'NEGOCIO' || type === 'DINERO') world.classList.add('landscape-city');
    if (type === 'BIENESTAR' || type === 'SALUD') world.classList.add('landscape-zen');
}

// 6. Respiración (El Silencio)
async function triggerBreathing() {
    engine.isRunning = false;
    const overlay = document.getElementById('breath-overlay');
    overlay.style.display = 'flex';

    for (let i = 0; i < 3; i++) {
        overlay.innerText = "INHALE";
        overlay.style.transform = "translate(-50%, -50%) scale(1.5)";
        await new Promise(r => setTimeout(r, 4000));
        overlay.innerText = "EXHALE";
        overlay.style.transform = "translate(-50%, -50%) scale(1)";
        await new Promise(r => setTimeout(r, 4000));
    }

    overlay.style.display = 'none';
    engine.isRunning = true;
}

// 7. Finalización y Apagado
function finishApp() {
    engine.isRunning = false;
    showStory(); // Historia final
    setTimeout(() => {
        document.body.innerHTML = "<div style='display:flex; height:100vh; align-items:center; justify-content:center; background:black;'><h1>TIME IS UP. REST NOW.</h1></div>";
    }, 20000); // Da tiempo a leer la última historia antes de apagar
}

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'en-US';
    window.speechSynthesis.speak(msg);
}

// Arrancar
loadData();
