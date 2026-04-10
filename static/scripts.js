let currentMissionIndex = 0;
let currentBlockIndex = 0;
let missions = [];
let currentLang = 'en';
let inactivitySeconds = 0;
let timerInterval = null;
const musicPlayer = document.getElementById('bg-music');

// Banco de imágenes naturales (PICSUM con seed para consistencia)
const imageBank = Array.from({length: 80}, (_, i) => `https://picsum.photos/seed/al-cielo-${i}/1600/900`);

// Librería de música optimizada
const musicLibrary = {
    dopamine: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
    power: "https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3",
    wealth: "https://assets.mixkit.co/music/preview/mixkit-complex-772.mp3",
    love: "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3",
    action: "https://assets.mixkit.co/music/preview/mixkit-glitchy-reverb-764.mp3",
    zen: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
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
    const cat = category.toLowerCase();

    if (level === 1) selectedTrack = musicLibrary.dopamine;
    else if (level === 2) {
        if (cat.includes('wealth') || cat.includes('economic')) selectedTrack = musicLibrary.wealth;
        else if (cat.includes('stability') || cat.includes('love')) selectedTrack = musicLibrary.love;
        else selectedTrack = musicLibrary.power;
    } else if (level >= 3) {
        selectedTrack = musicLibrary.action;
    }

    if (musicPlayer.src !== selectedTrack) {
        musicPlayer.src = selectedTrack;
        musicPlayer.volume = 0.15;
        musicPlayer.play().catch(() => console.log("Interacción requerida para audio"));
    }
}

function speak(text, callback) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = currentLang === 'en' ? 'en-US' : 'es-ES';
    msg.volume = 1.0;
    msg.rate = 0.95;

    // Ducking: Baja el volumen de la música mientras habla
    musicPlayer.volume = 0.05;
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
    } catch (e) {
        console.error("Error cargando misiones");
        document.getElementById('text-content').innerText = "Error: Connection failed";
    }
}

function initApp() {
    const mainBtn = document.getElementById('main-btn');
    mainBtn.onclick = () => {
        if (currentMissionIndex === 0 && currentBlockIndex === 0) {
            updateMusic(1); // Inicia música al primer clic
        }
        renderBlock();
    };

    // Botones de penalización (Disciplina)
    const setupPunish = (id) => {
        document.getElementById(id).onclick = () => {
            const msg = currentLang === 'en' ? "Discipline is focus. Stay here." : "La disciplina es enfoque. Quédate aquí.";
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

    // Fondo y Temporizadores
    changeBg();
    setInterval(changeBg, 12000);

    setInterval(() => {
        inactivitySeconds++;
        if (inactivitySeconds === 59) {
            document.getElementById('warning-modal').style.display = 'flex';
        }
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

    // Actualizar UI
    updateMusic(mission.level, mission.category);
    document.getElementById('level-display').innerText = `Lv. ${mission.level}`;
    
    if (timerInterval) clearInterval(timerInterval);
    circle.style.display = 'none';
    timerDisplay.style.display = 'none';
    mainBtn.disabled = false;
    mainBtn.style.display = 'block';

    const oldQuiz = document.getElementById('quiz-options');
    if (oldQuiz) oldQuiz.remove();

    // Lógica por tipo de bloque
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
        btn.onclick = () => {
            if (idx === block.correct) {
                const winMsg = currentLang === 'en' ? "Correct. Next step." : "Correcto. Siguiente paso.";
                speak(winMsg, () => {
                    quizDiv.remove();
                    mainBtn.style.display = 'block';
                    nextStep();
                });
            } else {
                const failMsg = currentLang === 'en' ? "Focus. Try again." : "Enfócate. Intenta de nuevo.";
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
    const timerDisplay = document.getElementById('timer-display');
    const mainBtn = document.getElementById('main-btn');
    
    timerDisplay.style.display = 'block';
    timerDisplay.innerText = remaining;

    timerInterval = setInterval(() => {
        remaining--;
        timerDisplay.innerText = remaining;
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            document.getElementById('breath-circle').classList.remove('breathing-anim');
            mainBtn.disabled = false;
            mainBtn.innerText = currentLang === 'en' ? 'CONTINUE' : 'CONTINUAR';
            speak(currentLang === 'en' ? "Complete. Let's move on." : "Completado. Continuemos.");
        }
    }, 1000);
}

function applyPunishment() {
    const mainBtn = document.getElementById('main-btn');
    mainBtn.disabled = true;
    mainBtn.innerText = currentLang === 'en' ? "WAIT..." : "ESPERA...";
    setTimeout(() => { 
        mainBtn.disabled = false;
        mainBtn.innerText = currentLang === 'en' ? "CONTINUE" : "CONTINUAR";
    }, 4000);
}

function nextStep() {
    currentBlockIndex++;
    const mission = missions[currentMissionIndex];
    
    if (currentBlockIndex >= mission.blocks.length) {
        currentMissionIndex++;
        currentBlockIndex = 0;
    }
    
    if (currentMissionIndex >= missions.length) {
        speak(currentLang === 'en' ? "You have reached the sky." : "Has alcanzado el cielo.");
        currentMissionIndex = 0;
        currentBlockIndex = 0;
    }
    renderBlock();
}

function resetInactivity() {
    inactivitySeconds = 0;
    document.getElementById('warning-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', loadData);
window.onclick = resetInactivity;
