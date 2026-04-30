let state = {
    stats: { stability: 50, resources: 20, energy: 70 },
    timeLeft: 900, // 15 Minutos en segundos
    started: true,
    missionActive: false,
    storyPool: [
        {
            title: "The Fern and the Bamboo",
            text: "A child walked through the forest with his grandfather... (Historia completa del Helecho y el Bambú)... It was growing roots to sustain its greatness when it was time to climb to the sky."
        },
        // Aquí se añaden las otras 34 historias siguiendo el mismo formato
    ],
    usedStories: []
};

const Voice = {
    speak(text) {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        const voices = speechSynthesis.getVoices();
        msg.voice = voices.find(v => v.name.includes('Male') || v.name.includes('David')) || voices[0];
        msg.lang = 'en-US';
        msg.rate = 0.85;
        speechSynthesis.speak(msg);
    }
};

// Sistema de Paisajes basado en tipos de palabras
function changeLandscape(type) {
    const body = document.body;
    body.className = ''; 
    if (["DINERO", "NEGOCIO", "GASTAR DINERO"].includes(type)) body.classList.add('landscape-city');
    else if (["BIENESTAR", "SALUD", "AMOR", "FELICIDAD"].includes(type)) body.classList.add('landscape-zen');
    else body.classList.add('landscape-forest');
}

function spawnWord() {
    if (state.missionActive || state.timeLeft <= 0) return;
    
    const categories = [
        {t: "OBSTACULO", c: "red", p: -10}, {t: "OPORTUNIDAD", c: "gold", p: 15},
        {t: "DINERO", c: "green", p: 10}, {t: "FAMILIA", c: "white", p: 5},
        {t: "FELICIDAD", c: "pink", p: 20}, {t: "GASTAR SIN CONTROL", c: "red", p: -20}
    ];
    
    const cat = categories[Math.floor(Math.random() * categories.length)];
    changeLandscape(cat.t);

    const div = document.createElement('div');
    div.className = 'word-box';
    div.innerText = cat.t;
    div.style.borderColor = cat.c;
    div.style.left = (Math.random() * 70 + 15) + "vw";

    div.onclick = () => {
        div.classList.add('explode');
        state.stats.stability = Math.max(0, Math.min(100, state.stats.stability + cat.p));
        updateHUD();
        Voice.speak(cat.t);
        setTimeout(() => div.remove(), 300);
    };
    document.body.appendChild(div);
    setTimeout(() => { if(div.parentNode) div.remove(); }, 10000);
}

function updateHUD() {
    document.getElementById('bar-stability').style.height = state.stats.stability + "%";
    document.getElementById('bar-resources').style.height = state.stats.resources + "%";
    document.getElementById('bar-energy').style.height = state.stats.energy + "%";
}

// Reloj Maestro y Apagado Automático
setInterval(() => {
    if (state.timeLeft <= 0) {
        document.body.innerHTML = "<h1 style='text-align:center; margin-top:20vh;'>TRAINING COMPLETE. SYSTEM SHUTDOWN.</h1>";
        return;
    }
    state.timeLeft--;
    const m = Math.floor(state.timeLeft / 60);
    const s = state.timeLeft % 60;
    document.getElementById('master-clock').innerText = `${m}:${s.toString().padStart(2, '0')}`;
    
    // Lanzar historia cada 3 minutos (180s)
    if (state.timeLeft % 180 === 0 && state.timeLeft < 900) showStory();
}, 1000);

function showStory() {
    if (state.storyPool.length === 0) return;
    state.missionActive = true;
    const story = state.storyPool.shift();
    state.usedStories.push(story);
    
    const overlay = document.getElementById('story-overlay');
    document.getElementById('story-title').innerText = story.title;
    document.getElementById('story-text').innerText = story.text;
    overlay.style.display = 'flex';
    
    Voice.speak(story.title + ". " + story.text);
}

function closeStory() {
    document.getElementById('story-overlay').style.display = 'none';
    state.missionActive = false;
    startBreathingExercise(); // Respiración después de cada historia
}

async function startBreathingExercise() {
    const circle = document.getElementById('breath-circle');
    const text = document.getElementById('breath-text');
    circle.style.display = 'flex';
    
    for(let i=0; i<4; i++) {
        text.innerText = "INHALE"; circle.style.transform = "scale(1.4)";
        await new Promise(r => setTimeout(r, 4000));
        text.innerText = "EXHALE"; circle.style.transform = "scale(1)";
        await new Promise(r => setTimeout(r, 4000));
    }
    circle.style.display = 'none';
}

setInterval(spawnWord, 2500);
