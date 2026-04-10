let currentMissionIndex = 0;
let currentBlockIndex = 0;
let missions = [];
let currentLang = 'en';
let inactivitySeconds = 0;
let timerInterval = null;
let musicPlayer = document.getElementById('bg-music');

// 80 Imágenes para evitar repetición rápida
const imageBank = Array.from({length: 80}, (_, i) => `https://picsum.photos/seed/kzen${i}/1600/900`);

const musicTracks = [
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", 
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", 
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
];

function updateMusic(level) {
    let track = Math.min(level - 1, 2);
    if (musicPlayer.src !== musicTracks[track]) {
        musicPlayer.src = musicTracks[track];
        musicPlayer.volume = 0.2; // MÚSICA BAJITA (20%)
        musicPlayer.play().catch(() => {});
    }
}

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = currentLang === 'en' ? 'en-US' : 'es-ES';
    msg.volume = 1.0; // VOZ FUERTE (100%)
    msg.rate = 0.95;
    window.speechSynthesis.speak(msg);
}

function changeBg() {
    const img = new Image();
    const url = imageBank[Math.floor(Math.random() * imageBank.length)];
    img.src = url;
    img.onload = () => {
        document.body.style.backgroundImage = `url('${url}')`;
    };
}

// SISTEMA DE CASTIGO POR INTENTAR SALTAR
function applyPunishment() {
    const text = currentLang === 'en' ? 
        "Discipline is key. 3 seconds of forced meditation for trying to bypass the lesson." : 
        "La disciplina es clave. 3 segundos de meditación forzada por intentar saltar la lección.";
    
    const display = document.getElementById('text-content');
    const mainBtn = document.getElementById('main-btn');
    const backBtn = document.getElementById('back-btn');
    const fwdBtn = document.getElementById('fwd-btn');

    [mainBtn, backBtn, fwdBtn].forEach(b => b.disabled = true);
    display.innerText = text;
    speak(text);
    
    let time = 3;
    const pInterval = setInterval(() => {
        time--;
        if (time <= 0) {
            clearInterval(pInterval);
            [mainBtn, backBtn, fwdBtn].forEach(b => b.disabled = false);
            renderBlock();
        }
    }, 1000);
}

async function loadData() {
    try {
        const response = await fetch('/session_content');
        const data = await response.json();
        missions = data.missions.sort((a, b) => a.id - b.id);
        initApp();
    } catch (e) { console.error("Data error"); }
}

function initApp() {
    document.getElementById('main-btn').onclick = () => renderBlock();
    document.getElementById('back-btn').onclick = () => applyPunishment();
    document.getElementById('fwd-btn').onclick = () => applyPunishment();
    
    document.getElementById('lang-btn').onclick = () => {
        currentLang = currentLang === 'en' ? 'es' : 'en';
        document.getElementById('lang-btn').innerText = currentLang === 'en' ? 'ES' : 'EN';
        renderBlock();
    };

    changeBg();
    setInterval(changeBg, 12000); // Cambio lento cada 12s
    updateMusic(1);
    
    setInterval(() => {
        inactivitySeconds++;
        if (inactivitySeconds === 59) document.getElementById('warning-modal').style.display = 'flex';
        if (inactivitySeconds >= 240) location.reload();
    }, 1000);
}

function renderBlock() {
    const mission = missions[currentMissionIndex];
    const block = mission.blocks[currentBlockIndex];
    const textDisplay = document.getElementById('text-content');
    const timerDisplay = document.getElementById('timer-display');
    const mainBtn = document.getElementById('main-btn');
    const circle = document.getElementById('breath-circle');

    updateMusic(mission.level);
    document.getElementById('level-display').innerText = `Lv. ${mission.level}`;
    
    if (timerInterval) clearInterval(timerInterval);
    timerDisplay.style.display = 'none';
    circle.style.display = 'none';
    circle.classList.remove('breathing-anim');
    mainBtn.disabled = false;
    mainBtn.style.display = 'block';

    const oldQuiz = document.getElementById('quiz-options');
    if (oldQuiz) oldQuiz.remove();

    textDisplay.innerText = block.text[currentLang];

    if (block.type === 'breathing') {
        mainBtn.disabled = true;
        circle.style.display = 'flex';
        circle.classList.add('breathing-anim');
        timerDisplay.style.display = 'block';
        speak(block.text[currentLang]);
        startCountdown(block.duration);
    } else if (block.type === 'quiz') {
        renderQuiz(block);
    } else {
        speak(block.text[currentLang]);
    }

    mainBtn.onclick = () => nextStep();
}

function startCountdown(seconds) {
    let remaining = seconds;
    const display = document.getElementById('timer-display');
    const mainBtn = document.getElementById('main-btn');

    timerInterval = setInterval(() => {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        display.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (remaining <= 0) {
            clearInterval(timerInterval);
            mainBtn.disabled = false;
            mainBtn.innerText = currentLang === 'en' ? 'CONTINUE' : 'CONTINUAR';
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
            const isCorrect = idx === block.correct;
            const explanation = isCorrect ? block.explanation[currentLang].correct : block.explanation[currentLang].wrong;
            
            document.getElementById('text-content').innerText = explanation;
            speak(explanation);

            if (isCorrect) {
                quizDiv.remove();
                mainBtn.style.display = 'block';
            } else {
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
    if (currentMissionIndex >= missions.length) currentMissionIndex = 0;
    renderBlock();
}

function resetInactivity() {
    inactivitySeconds = 0;
    document.getElementById('warning-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', loadData);
window.onclick = resetInactivity;
