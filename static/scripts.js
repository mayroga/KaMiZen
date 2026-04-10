let currentMissionIndex = 0;
let currentBlockIndex = 0;
let missions = [];
let currentLang = 'en';
let inactivitySeconds = 0;
let timerInterval = null;
const musicPlayer = document.getElementById('bg-music');

// Banco de imágenes (Naturales y de Éxito)
const imageBank = Array.from({length: 80}, (_, i) => `https://picsum.photos/seed/al-cielo-${i}/1600/900`);

// Librería de Música con Enfoque: Dopamina, Dinero, Amor, Poder y Antiestrés
const musicLibrary = {
    dopamine: "https://assets.mixkit.co/music/preview/mixkit-sunshine-radio-28.mp3",
    power: "https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3",
    wealth: "https://assets.mixkit.co/music/preview/mixkit-motivating-morning-33.mp3",
    love: "https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-493.mp3",
    zen: "https://assets.mixkit.co/music/preview/mixkit-soft-ambient-611.mp3"
};

function changeBg() {
    const url = imageBank[Math.floor(Math.random() * imageBank.length)];
    const img = new Image();
    img.src = url;
    img.onload = () => {
        document.body.style.backgroundImage = `url('${url}')`;
    };
}

function updateMusic(level, category = "") {
    let selectedTrack = musicLibrary.zen;
    const cat = (category || "").toLowerCase();

    // Lógica de asignación por intención
    if (cat.includes('dinero') || cat.includes('wealth') || cat.includes('money')) {
        selectedTrack = musicLibrary.wealth;
    } else if (cat.includes('amor') || cat.includes('love') || cat.includes('paz')) {
        selectedTrack = musicLibrary.love;
    } else if (cat.includes('poder') || cat.includes('power') || level >= 3) {
        selectedTrack = musicLibrary.power;
    } else if (level === 1 || cat.includes('alegria') || cat.includes('happy')) {
        selectedTrack = musicLibrary.dopamine;
    } else {
        selectedTrack = musicLibrary.zen;
    }

    if (musicPlayer.src !== selectedTrack) {
        musicPlayer.src = selectedTrack;
        musicPlayer.volume = 0.12; // Volumen ambiente (no supera la voz)
        musicPlayer.play().catch(() => console.log("Interacción requerida"));
    }
}

function speak(text, callback) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = currentLang === 'en' ? 'en-US' : 'es-ES';
    msg.volume = 1.0; 
    msg.rate = 0.95;

    // Ducking: Baja la música casi al silencio para que la voz tenga peso
    musicPlayer.volume = 0.03; 
    
    msg.onend = () => {
        // La música vuelve a nivel de fondo agradable
        musicPlayer.volume = 0.12; 
        if (callback) callback();
    };
    window.speechSynthesis.speak(msg);
}

async function loadData() {
    try {
        const response = await fetch('/session_content');
        const data = await response.json();
        missions = data.missions;
        initApp();
    } catch (e) {
        document.getElementById('text-content').innerText = "Error: Connection failed";
    }
}

function initApp() {
    const mainBtn = document.getElementById('main-btn');
    mainBtn.onclick = () => {
        if (currentMissionIndex === 0 && currentBlockIndex === 0) updateMusic(1);
        renderBlock();
    };

    const setupPunish = (id) => {
        document.getElementById(id).onclick = () => {
            const msg = currentLang === 'en' ? "Discipline is focus. Stay present." : "La disciplina es enfoque. Mantente presente.";
            speak(msg);
            applyPunishment();
        };
    };
    setupPunish('back-btn');
    setupPunish('fwd-btn');

    document.getElementById('lang-btn').onclick = () => {
        currentLang = currentLang === 'en' ? 'es' : 'en';
        document.getElementById('lang-btn').innerText = currentLang.toUpperCase();
        renderBlock();
    };

    changeBg();
    setInterval(changeBg, 15000);

    setInterval(() => {
        inactivitySeconds++;
        if (inactivitySeconds === 59) document.getElementById('warning-modal').style.display = 'flex';
        if (inactivitySeconds >= 240) location.reload();
    }, 1000);
}

function renderBlock() {
    if (!missions.length) return;
    const mission = missions[currentMissionIndex];
    const block = mission.blocks[currentBlockIndex];
    
    const textDisplay = document.getElementById('text-content');
    const circle = document.getElementById('breath-circle');
    const timerDisplay = document.getElementById('timer-display');
    const mainBtn = document.getElementById('main-btn');

    updateMusic(mission.level, mission.category);
    document.getElementById('level-display').innerText = `Lv. ${mission.level}`;
    
    if (timerInterval) clearInterval(timerInterval);
    circle.style.display = 'none';
    timerDisplay.style.display = 'none';
    mainBtn.disabled = false;
    mainBtn.style.display = 'block';

    const oldQuiz = document.getElementById('quiz-options');
    if (oldQuiz) oldQuiz.remove();

    if (block.type === 'quiz') {
        renderQuiz(block);
    } else if (block.type === 'breathing') {
        textDisplay.innerText = block.text[currentLang];
        circle.style.display = 'flex';
        circle.classList.add('breathing-anim');
        mainBtn.disabled = true;
        speak(block.text[currentLang], () => startCountdown(block.duration));
    } else {
        textDisplay.innerText = block.text[currentLang];
        speak(block.text[currentLang]);
    }
}

function renderQuiz(block) {
    const mainBtn = document.getElementById('main-btn');
    const textDisplay = document.getElementById('text-content');
    mainBtn.style.display = 'none';

    let fullQuizText = block.question[currentLang] + ". ";
    block.options[currentLang].forEach((opt, i) => {
        fullQuizText += (currentLang === 'en' ? "Option " : "Opción ") + (i + 1) + ": " + opt + ". ";
    });

    textDisplay.innerText = block.question[currentLang];
    speak(fullQuizText);

    const quizDiv = document.createElement('div');
    quizDiv.id = "quiz-options";
    quizDiv.style.width = "100%";

    block.options[currentLang].forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = "secondary";
        btn.onclick = () => {
            if (idx === block.correct) {
                speak(currentLang === 'en' ? "Correct." : "Correcto.", () => {
                    quizDiv.remove();
                    mainBtn.style.display = 'block';
                    nextStep();
                });
            } else {
                speak(currentLang === 'en' ? "Focus. Try again." : "Enfócate. Intenta de nuevo.");
                btn.style.borderColor = "#ef4444";
            }
        };
        quizDiv.appendChild(btn);
    });
    document.getElementById('block-container').appendChild(quizDiv);
}

function startCountdown(seconds) {
    let remaining = seconds;
    const timerDisplay = document.getElementById('timer-display');
    timerDisplay.style.display = 'block';
    timerDisplay.innerText = remaining;

    timerInterval = setInterval(() => {
        remaining--;
        timerDisplay.innerText = remaining;
        if (remaining <= 0) {
            clearInterval(timerInterval);
            document.getElementById('breath-circle').classList.remove('breathing-anim');
            document.getElementById('main-btn').disabled = false;
            speak(currentLang === 'en' ? "Complete." : "Completado.");
        }
    }, 1000);
}

function applyPunishment() {
    const mainBtn = document.getElementById('main-btn');
    mainBtn.disabled = true;
    setTimeout(() => mainBtn.disabled = false, 4000);
}

function nextStep() {
    currentBlockIndex++;
    if (currentBlockIndex >= missions[currentMissionIndex].blocks.length) {
        currentMissionIndex++;
        currentBlockIndex = 0;
    }
    if (currentMissionIndex >= missions.length) {
        speak(currentLang === 'en' ? "You reached the sky." : "Has llegado al cielo.");
        currentMissionIndex = 0;
    }
    renderBlock();
}

function resetInactivity() {
    inactivitySeconds = 0;
    document.getElementById('warning-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', loadData);
window.onclick = resetInactivity;
