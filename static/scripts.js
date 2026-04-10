let currentMissionIndex = 0;
let currentBlockIndex = 0;
let missions = [];
let currentLang = 'en';
let syncScore = 0;
let timerInterval = null;
const musicPlayer = document.getElementById('bg-music');

// Imágenes de alta resolución con temática "Cyber/Abstract/Nature"
const imageBank = Array.from({length: 50}, (_, i) => `https://picsum.photos/seed/cyber-${i}/1920/1080`);

function changeBg() {
    const url = imageBank[Math.floor(Math.random() * imageBank.length)];
    const img = new Image();
    img.src = url;
    img.onload = () => {
        document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${url}')`;
    };
}

function speak(text, callback) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = currentLang === 'en' ? 'en-US' : 'es-ES';
    msg.rate = 1.0; 
    msg.pitch = 0.8; // Voz más profunda, tipo IA de juego
    
    musicPlayer.volume = 0.05;
    msg.onend = () => {
        musicPlayer.volume = 0.15;
        if (callback) callback();
    };
    window.speechSynthesis.speak(msg);
}

function updateUI() {
    document.getElementById('streak-display').innerText = `SYNC: ${syncScore}%`;
    document.getElementById('level-display').innerText = `NODE: 0${currentMissionIndex + 1}`;
}

async function loadData() {
    try {
        const response = await fetch('/session_content');
        const data = await response.json();
        missions = data.missions;
        initApp();
    } catch (e) {
        document.getElementById('text-content').innerText = "CONNECTION_ERROR: RETRYING...";
    }
}

function initApp() {
    const mainBtn = document.getElementById('main-btn');
    
    document.getElementById('lang-btn').onclick = () => {
        currentLang = currentLang === 'en' ? 'es' : 'en';
        renderBlock();
    };

    mainBtn.onclick = () => {
        if (currentMissionIndex === 0 && currentBlockIndex === 0) {
            musicPlayer.src = "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3";
            musicPlayer.play();
        }
        renderBlock();
    };

    changeBg();
    setInterval(changeBg, 20000);
}

function renderBlock() {
    const mission = missions[currentMissionIndex];
    const block = mission.blocks[currentBlockIndex];
    const textDisplay = document.getElementById('text-content');
    const circle = document.getElementById('breath-circle');
    const mainBtn = document.getElementById('main-btn');
    
    updateUI();
    if (timerInterval) clearInterval(timerInterval);
    circle.style.display = 'none';
    mainBtn.style.display = 'block';

    const oldQuiz = document.getElementById('quiz-options');
    if (oldQuiz) oldQuiz.remove();

    textDisplay.innerText = block.text ? block.text[currentLang] : block.question[currentLang];
    
    if (block.type === 'breathing') {
        circle.style.display = 'flex';
        circle.classList.add('breathing-anim');
        mainBtn.style.display = 'none';
        speak(block.text[currentLang], () => startCountdown(block.duration));
    } else if (block.type === 'quiz') {
        renderQuiz(block);
    } else {
        speak(block.text[currentLang]);
    }

    mainBtn.onclick = () => nextStep();
}

function renderQuiz(block) {
    const mainBtn = document.getElementById('main-btn');
    const container = document.getElementById('block-container');
    mainBtn.style.display = 'none';

    const quizDiv = document.createElement('div');
    quizDiv.id = "quiz-options";
    quizDiv.style.width = "100%";

    block.options[currentLang].forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.style.marginTop = "10px";
        btn.style.width = "100%";
        btn.onclick = () => {
            if (idx === block.correct) {
                syncScore += 10;
                document.body.style.boxShadow = "inset 0 0 100px #00f2ff";
                setTimeout(() => document.body.style.boxShadow = "none", 500);
                nextStep();
            } else {
                syncScore = Math.max(0, syncScore - 5);
                document.getElementById('app').classList.add('glitch-effect');
                setTimeout(() => document.getElementById('app').classList.remove('glitch-effect'), 500);
                speak(currentLang === 'en' ? "Wrong choice. Focus." : "Error. Enfócate.");
            }
        };
        quizDiv.appendChild(btn);
    });
    container.appendChild(quizDiv);
}

function startCountdown(seconds) {
    let remaining = seconds;
    const timerDisplay = document.getElementById('timer-display');
    timerInterval = setInterval(() => {
        remaining--;
        timerDisplay.innerText = remaining;
        if (remaining <= 0) {
            clearInterval(timerInterval);
            syncScore += 15;
            nextStep();
        }
    }, 1000);
}

function nextStep() {
    currentBlockIndex++;
    if (currentBlockIndex >= missions[currentMissionIndex].blocks.length) {
        currentMissionIndex++;
        currentBlockIndex = 0;
    }
    if (currentMissionIndex >= missions.length) {
        speak("Neural Architecture Complete. You are the Master.");
        currentMissionIndex = 0;
    }
    renderBlock();
}

document.addEventListener('DOMContentLoaded', loadData);
