let currentMissionIndex = 0;
let currentBlockIndex = 0;
let missions = [];
let currentLang = 'en';
let inactivitySeconds = 0;
let timerInterval = null;
let musicPlayer = document.getElementById('bg-music');

// Banco de 80 imágenes naturales para evitar repetición rápida
const imageBank = Array.from({length: 80}, (_, i) => `https://picsum.photos/seed/al-cielo-${i}/1600/900`);

// Librería de música por categoría/vibe
const musicLibrary = {
    dopamine: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
    power: "https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3",
    wealth: "https://assets.mixkit.co/music/preview/mixkit-complex-772.mp3",
    love: "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3",
    action: "https://assets.mixkit.co/music/preview/mixkit-glitchy-reverb-764.mp3",
    zen: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
};

function changeBg() {
    const img = new Image();
    const url = imageBank[Math.floor(Math.random() * imageBank.length)];
    img.src = url;
    img.onload = () => {
        document.body.style.backgroundImage = `url('${url}')`;
    };
}

function updateMusic(level, category = "") {
    let selectedTrack = musicLibrary.zen;
    const cat = category.toLowerCase();

    if (level === 1) selectedTrack = musicLibrary.dopamine;
    else if (level === 2) {
        if (cat.includes('wealth') || cat.includes('economic')) selectedTrack = musicLibrary.wealth;
        else if (cat.includes('stability') || cat.includes('love')) selectedTrack = musicLibrary.love;
        else selectedTrack = musicLibrary.power;
    } else {
        selectedTrack = musicLibrary.action;
    }

    if (musicPlayer.src !== selectedTrack) {
        musicPlayer.src = selectedTrack;
        musicPlayer.volume = 0.15; 
        musicPlayer.play().catch(() => {});
    }
}

function speak(text, callback) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = currentLang === 'en' ? 'en-US' : 'es-ES';
    msg.volume = 1.0; 
    msg.rate = 0.95;

    musicPlayer.volume = 0.05; // Ducking
    msg.onend = () => {
        musicPlayer.volume = 0.15;
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
    } catch (e) { console.error("Error cargando JSON"); }
}

function initApp() {
    document.getElementById('main-btn').onclick = () => renderBlock();
    
    const punishBtn = (id) => {
        document.getElementById(id).onclick = () => {
            const msg = currentLang === 'en' ? "Discipline is required. Wait." : "Se requiere disciplina. Espera.";
            speak(msg);
            applyPunishment();
        };
    };
    punishBtn('back-btn');
    punishBtn('fwd-btn');

    document.getElementById('lang-btn').onclick = () => {
        currentLang = currentLang === 'en' ? 'es' : 'en';
        document.getElementById('lang-btn').innerText = currentLang.toUpperCase();
        renderBlock();
    };

    // Inicializar visual y musicalmente
    changeBg();
    setInterval(changeBg, 12000); // Fondo cambia cada 12s
    updateMusic(1);
    
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
    const mainBtn = document.getElementById('main-btn');

    updateMusic(mission.level, mission.category);
    document.getElementById('level-display').innerText = `Lv. ${mission.level}`;
    
    if (timerInterval) clearInterval(timerInterval);
    circle.style.display = 'none';
    mainBtn.disabled = false;
    const oldQuiz = document.getElementById('quiz-options');
    if (oldQuiz) oldQuiz.remove();

    if (block.type === 'quiz') {
        renderQuiz(block);
    } else if (block.type === 'breathing') {
        textDisplay.innerText = block.text[currentLang];
        circle.style.display = 'flex';
        circle.classList.add('breathing-anim');
        mainBtn.disabled = true;
        speak(block.text[currentLang], () => {
            startCountdown(block.duration);
        });
    } else {
        textDisplay.innerText = block.text[currentLang];
        speak(block.text[currentLang]);
    }

    mainBtn.onclick = () => nextStep();
}

function renderQuiz(block) {
    const mainBtn = document.getElementById('main-btn');
    const textDisplay = document.getElementById('text-content');
    mainBtn.style.display = 'none';

    let fullQuizText = block.question[currentLang] + ". ";
    const options = block.options[currentLang];
    options.forEach((opt, i) => {
        fullQuizText += (currentLang === 'en' ? "Option " : "Opción ") + (i + 1) + ": " + opt + ". ";
    });

    textDisplay.innerText = block.question[currentLang];
    speak(fullQuizText);

    const container = document.getElementById('block-container');
    const quizDiv = document.createElement('div');
    quizDiv.id = "quiz-options";
    quizDiv.style.width = "100%";

    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = "secondary";
        btn.style.marginTop = "10px";
        btn.onclick = () => {
            if (idx === block.correct) {
                const winMsg = currentLang === 'en' ? "Correct. Well done." : "Correcto. Bien hecho.";
                speak(winMsg, () => {
                    quizDiv.remove();
                    mainBtn.style.display = 'block';
                    nextStep();
                });
            } else {
                const failMsg = currentLang === 'en' ? "Incorrect. Focus and try again." : "Incorrecto. Enfócate e intenta de nuevo.";
                speak(failMsg);
                btn.style.borderColor = "#ef4444";
            }
        };
        quizDiv.appendChild(btn);
    });
    container.appendChild(quizDiv);
}

function startCountdown(seconds) {
    let remaining = seconds;
    const display = document.getElementById('timer-display');
    const mainBtn = document.getElementById('main-btn');
    display.style.display = 'block';

    timerInterval = setInterval(() => {
        display.innerText = remaining;
        if (remaining <= 0) {
            clearInterval(timerInterval);
            mainBtn.disabled = false;
            mainBtn.innerText = currentLang === 'en' ? 'CONTINUE' : 'CONTINUAR';
            speak(currentLang === 'en' ? "Done. Continue." : "Listo. Continúa.");
        }
        remaining--;
    }, 1000);
}

function applyPunishment() {
    const mainBtn = document.getElementById('main-btn');
    mainBtn.disabled = true;
    setTimeout(() => { mainBtn.disabled = false; }, 3000);
}

function nextStep() {
    currentBlockIndex++;
    if (currentBlockIndex >= missions[currentMissionIndex].blocks.length) {
        currentMissionIndex++;
        currentBlockIndex = 0;
    }
    if (currentMissionIndex >= missions.length) {
        speak(currentLang === 'en' ? "You have reached the sky." : "Has alcanzado el cielo.");
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
