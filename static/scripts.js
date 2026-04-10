let currentMissionIndex = 0;
let currentBlockIndex = 0;
let missions = [];
let currentLang = 'en';
let syncScore = 0;
let timerInterval = null;
let isProcessing = false;

const musicPlayer = document.getElementById('bg-music');

// MÉTRICAS
let stats = {
    correct: 0,
    wrong: 0,
    breathingCompleted: 0
};

// FONDOS
const imageBank = Array.from({length: 30}, (_, i) => `https://picsum.photos/seed/cyber-${i}/1920/1080`);

function changeBg() {
    const url = imageBank[Math.floor(Math.random() * imageBank.length)];
    const img = new Image();
    img.src = url;
    img.onload = () => {
        document.body.style.backgroundImage =
            `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${url}')`;
    };
}

// VOZ
function speak(text, callback) {
    window.speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = currentLang === 'en' ? 'en-US' : 'es-ES';
    msg.rate = 1.0;
    msg.pitch = 0.8;

    musicPlayer.volume = 0.05;

    msg.onend = () => {
        musicPlayer.volume = 0.15;
        isProcessing = false;
        if (callback) callback();
    };

    window.speechSynthesis.speak(msg);
}

// UI
function updateUI() {
    document.getElementById('streak-display').innerText = `SYNC: ${syncScore}%`;
    document.getElementById('level-display').innerText = `NODE: 0${currentMissionIndex + 1}`;
}

// CARGAR DATA
async function loadData() {
    try {
        const res = await fetch('/session_content');
        const data = await res.json();
        missions = data.missions || [];
        initApp();
    } catch {
        document.getElementById('text-content').innerText = "CONNECTION ERROR";
    }
}

// INIT
function initApp() {
    const mainBtn = document.getElementById('main-btn');

    // 🔥 RECUPERAR SYNC DESDE JUEGO
    const savedSync = localStorage.getItem("syncScore");
    if (savedSync) {
        syncScore = parseInt(savedSync);
    }

    // IDIOMA
    document.getElementById('lang-btn').onclick = () => {
        currentLang = currentLang === 'en' ? 'es' : 'en';
        renderBlock();
    };

    // REBOOT
    document.getElementById('back-btn').onclick = () => {
        resetSystem();
    };

    // BOTÓN PRINCIPAL
    mainBtn.onclick = () => {
        if (isProcessing) return;

        if (currentMissionIndex === 0 && currentBlockIndex === 0) {
            musicPlayer.src = "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3";
            musicPlayer.play();
        }

        nextStep();
    };

    changeBg();
    setInterval(changeBg, 20000);

    renderBlock();
}

// RESET
function resetSystem() {
    window.speechSynthesis.cancel();
    if (timerInterval) clearInterval(timerInterval);

    currentMissionIndex = 0;
    currentBlockIndex = 0;
    syncScore = 0;

    stats = { correct: 0, wrong: 0, breathingCompleted: 0 };

    musicPlayer.pause();
    musicPlayer.currentTime = 0;

    localStorage.removeItem("syncScore");

    document.getElementById('text-content').innerText = "SYSTEM REBOOTED";

    setTimeout(() => renderBlock(), 1000);
}

// RENDER
function renderBlock() {
    const mission = missions[currentMissionIndex];
    if (!mission) return;

    const block = mission.blocks[currentBlockIndex];
    if (!block) return;

    const textDisplay = document.getElementById('text-content');
    const circle = document.getElementById('breath-circle');
    const mainBtn = document.getElementById('main-btn');

    updateUI();

    if (timerInterval) clearInterval(timerInterval);

    circle.style.display = 'none';
    mainBtn.style.display = 'block';
    mainBtn.disabled = true;

    isProcessing = true;

    const oldQuiz = document.getElementById('quiz-options');
    if (oldQuiz) oldQuiz.remove();

    // SEGURIDAD JSON
    if (block.text && block.text[currentLang]) {
        textDisplay.innerText = block.text[currentLang];
    } else if (block.question && block.question[currentLang]) {
        textDisplay.innerText = block.question[currentLang];
    } else {
        textDisplay.innerText = "DATA ERROR";
    }

    // TIPOS
    if (block.type === 'breathing') {
        circle.style.display = 'flex';
        circle.classList.add('breathing-anim');
        mainBtn.style.display = 'none';

        speak(textDisplay.innerText, () => startCountdown(block.duration || 5));

    } else if (block.type === 'quiz') {
        renderQuiz(block);

    } else {
        speak(textDisplay.innerText, () => {
            mainBtn.disabled = false;
        });
    }
}

// QUIZ
function renderQuiz(block) {
    const container = document.getElementById('block-container');
    isProcessing = false;

    const quizDiv = document.createElement('div');
    quizDiv.id = "quiz-options";

    block.options[currentLang].forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.innerText = opt;

        btn.onclick = () => {
            if (isProcessing) return;
            isProcessing = true;

            if (idx === block.correct) {
                syncScore += 10;
                stats.correct++;

                nextStep();
            } else {
                stats.wrong++;
                syncScore = Math.max(0, syncScore - 5);

                speak(currentLang === 'en' ? "Wrong. Focus." : "Error. Enfócate.", () => {
                    isProcessing = false;
                });
            }
        };

        quizDiv.appendChild(btn);
    });

    container.appendChild(quizDiv);
}

// RESPIRACIÓN
function startCountdown(seconds) {
    let remaining = seconds;
    const timerDisplay = document.getElementById('timer-display');

    timerInterval = setInterval(() => {
        remaining--;
        timerDisplay.innerText = remaining;

        if (remaining <= 0) {
            clearInterval(timerInterval);

            stats.breathingCompleted++;
            syncScore += 15;

            isProcessing = false;
            nextStep();
        }
    }, 1000);
}

// FLUJO
function nextStep() {
    currentBlockIndex++;

    if (currentBlockIndex >= missions[currentMissionIndex].blocks.length) {
        currentMissionIndex++;
        currentBlockIndex = 0;
    }

    // 🔥 AQUÍ CONECTA CON EL JUEGO
    if (currentMissionIndex >= missions.length) {

        localStorage.setItem("syncScore", syncScore);

        speak("Entering neural simulation.", () => {
            window.location.href = "/jet";
        });

        return;
    }

    renderBlock();
}

document.addEventListener('DOMContentLoaded', loadData);
