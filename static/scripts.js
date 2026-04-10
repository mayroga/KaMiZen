let currentMissionIndex = 0;
let currentBlockIndex = 0;
let missions = [];
let currentLang = 'en';
let inactivitySeconds = 0;
let timerInterval = null;
let musicLevel = 0;

// 80 Fondos Dinámicos (Ejemplos representativos para evitar repetición)
const imageBank = Array.from({length: 80}, (_, i) => `https://picsum.photos/seed/${i + 120}/1600/900`);

// Configuración de Música por Niveles
const musicTracks = [
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Level 1: Paz
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", // Level 2: Energía
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" // Level 3: Poder/Adrenalina
];

function updateMusic(level) {
    const audio = document.getElementById('bg-music');
    let trackIndex = level - 1;
    if (trackIndex > 2) trackIndex = 2;
    
    if (musicLevel !== level) {
        audio.src = musicTracks[trackIndex];
        audio.play().catch(() => console.log("User must interact first"));
        musicLevel = level;
    }
}

function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === 'en' ? 'en-US' : 'es-ES';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

function changeBg() {
    const randomImg = imageBank[Math.floor(Math.random() * imageBank.length)];
    document.body.style.backgroundImage = `url('${randomImg}')`;
}

function startInactivityMonitor() {
    setInterval(() => {
        inactivitySeconds++;
        if (inactivitySeconds === 59) document.getElementById('warning-modal').style.display = 'flex';
        if (inactivitySeconds >= 240) location.reload();
    }, 1000);
}

function resetInactivity() {
    inactivitySeconds = 0;
    document.getElementById('warning-modal').style.display = 'none';
}

async function loadData() {
    try {
        const response = await fetch('/session_content');
        const data = await response.json();
        // Ordenamos estrictamente del 1 al 40
        missions = data.missions.sort((a, b) => a.id - b.id);
        initApp();
    } catch (e) {
        document.getElementById('text-content').innerText = "Engine Error. Check Connection.";
    }
}

function initApp() {
    document.getElementById('main-btn').onclick = () => {
        document.getElementById('bg-music').play();
        renderBlock();
    };

    document.getElementById('lang-btn').onclick = () => {
        currentLang = currentLang === 'en' ? 'es' : 'en';
        document.getElementById('lang-btn').innerText = currentLang === 'en' ? 'ES' : 'EN';
        renderBlock();
    };

    changeBg();
    setInterval(changeBg, 10000);
    startInactivityMonitor();
}

function renderBlock() {
    const mission = missions[currentMissionIndex];
    const block = mission.blocks[currentBlockIndex];
    const textDisplay = document.getElementById('text-content');
    const timerDisplay = document.getElementById('timer-display');
    const mainBtn = document.getElementById('main-btn');
    const circle = document.getElementById('breath-circle');

    updateMusic(mission.level);
    document.getElementById('level-display').innerText = `Level: ${mission.level}`;
    
    if (timerInterval) clearInterval(timerInterval);
    timerDisplay.style.display = 'none';
    circle.style.display = 'none';
    circle.classList.remove('breathing-anim');
    mainBtn.disabled = false;
    mainBtn.style.display = 'block';

    // Eliminar opciones de quiz previas
    const oldQuiz = document.getElementById('quiz-options');
    if (oldQuiz) oldQuiz.remove();

    textDisplay.innerText = block.text[currentLang];

    // LÓGICA POR TIPO
    if (block.type === 'voice' || block.type === 'story' || block.type === 'strategy') {
        speak(block.text[currentLang]);
    } 
    
    else if (block.type === 'breathing') {
        // En ejercicio de respiración SI hay voz y círculo
        speak(block.text[currentLang]);
        mainBtn.disabled = true;
        circle.style.display = 'flex';
        circle.classList.add('breathing-anim');
        timerDisplay.style.display = 'block';
        startCountdown(block.duration, true);
    } 
    
    else if (block.type === 'quiz') {
        renderQuiz(block);
    }

    mainBtn.onclick = () => nextStep();
}

function startCountdown(seconds, isBreathing) {
    let remaining = seconds;
    const display = document.getElementById('timer-display');
    const mainBtn = document.getElementById('main-btn');
    const circle = document.getElementById('breath-circle');
    const breathText = document.getElementById('breath-text');

    timerInterval = setInterval(() => {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        display.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        // Lógica de ayuda aleatoria en retos largos (> 3 min)
        if (!isBreathing && seconds >= 180) {
            // Aparece el círculo de respiración aleatoriamente para ayudar
            if (remaining % 60 === 0 && remaining > 0) {
                circle.style.display = 'flex';
                circle.classList.add('breathing-anim');
                breathText.innerText = currentLang === 'en' ? "BREATHE" : "RESPIRA";
                speak(breathText.innerText);
                setTimeout(() => { 
                    circle.style.display = 'none'; 
                    circle.classList.remove('breathing-anim');
                }, 30000);
            }
        }

        if (remaining <= 0) {
            clearInterval(timerInterval);
            mainBtn.disabled = false;
            circle.style.display = 'none';
            mainBtn.innerText = currentLang === 'en' ? 'Complete - Next' : 'Cumplido - Siguiente';
        }
        remaining--;
    }, 1000);
}

function renderQuiz(block) {
    const mainBtn = document.getElementById('main-btn');
    mainBtn.style.display = 'none';
    speak(block.question[currentLang]);

    const container = document.getElementById('block-container');
    const quizDiv = document.createElement('div');
    quizDiv.id = "quiz-options";
    quizDiv.style.width = "100%";

    block.options[currentLang].forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = "secondary";
        btn.onclick = () => {
            if (idx === block.correct) {
                speak(block.explanation ? block.explanation[currentLang].correct : "Correct");
                quizDiv.remove();
                mainBtn.style.display = 'block';
                mainBtn.innerText = "Next";
            } else {
                speak(block.explanation ? block.explanation[currentLang].wrong : "Try again");
                btn.style.borderColor = "#ef4444";
            }
        };
        quizDiv.appendChild(btn);
    });
    container.appendChild(quizDiv);
}

function nextStep() {
    const mission = missions[currentMissionIndex];
    currentBlockIndex++;

    if (currentBlockIndex >= mission.blocks.length) {
        currentMissionIndex++;
        currentBlockIndex = 0;
    }

    // CICLO INFINITO: Si llega al final del 40, vuelve al 1
    if (currentMissionIndex >= missions.length) {
        currentMissionIndex = 0;
    }

    renderBlock();
}

document.addEventListener('DOMContentLoaded', loadData);
window.onclick = resetInactivity;
