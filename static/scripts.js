let currentMissionIndex = 0;
let currentBlockIndex = 0;
let missions = [];
let currentLang = 'en';
let inactivitySeconds = 0;
let timerInterval = null;
let musicPlayer = document.getElementById('bg-music');

// 80 Imágenes para evitar repetición rápida
const imageBank = Array.from({length: 80}, (_, i) => `https://picsum.photos/seed/kzen${i}/1600/900`);

// Librería de música categorizada por "vibe" según el JSON
const musicLibrary = {
    dopamine: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
    power: "https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3",
    wealth: "https://assets.mixkit.co/music/preview/mixkit-complex-772.mp3",
    love: "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3",
    zen: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
};

function updateMusic(level, category = "") {
    let selectedTrack = musicLibrary.zen;
    const cat = category.toLowerCase();

    if (level === 1) {
        selectedTrack = cat.includes("stability") ? musicLibrary.love : musicLibrary.dopamine;
    } else if (level === 2) {
        selectedTrack = cat.includes("economic") ? musicLibrary.wealth : musicLibrary.power;
    } else {
        selectedTrack = musicLibrary.wealth;
    }

    if (musicPlayer.src !== selectedTrack) {
        musicPlayer.src = selectedTrack;
        musicPlayer.volume = 0.2; // Música de fondo al 20%
        musicPlayer.play().catch(() => {});
    }
}

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = currentLang === 'en' ? 'en-US' : 'es-ES';
    
    // Bajamos música para que la voz tenga peso
    musicPlayer.volume = 0.05; 
    msg.volume = 1.0; 
    msg.rate = 0.95;

    msg.onend = () => { musicPlayer.volume = 0.2; };
    window.speechSynthesis.speak(msg);
}

function changeBg() {
    const url = imageBank[Math.floor(Math.random() * imageBank.length)];
    document.body.style.backgroundImage = `url('${url}')`;
}

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

// CARGA DESDE EL NUEVO JSON
async function loadData() {
    try {
        const response = await fetch('/static/kamizen_content.json');
        const data = await response.json();
        missions = data.missions;
        initApp();
    } catch (e) { 
        console.error("Error cargando kamizen_content.json", e); 
    }
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
    setInterval(changeBg, 12000);
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
    const timerDisplay = document.getElementById('timer-display');
    const mainBtn = document.getElementById('main-btn');
    const circle = document.getElementById('breath-circle');

    updateMusic(mission.level, mission.category);
    document.getElementById('level-display').innerText = `Lv. ${mission.level}`;
    
    if (timerInterval) clearInterval(timerInterval);
    timerDisplay.style.display = 'none';
    circle.style.display = 'none';
    circle.classList.remove('breathing-anim');
    mainBtn.disabled = false;
    mainBtn.style.display = 'block';
    mainBtn.innerText = currentLang === 'en' ? 'NEXT' : 'SIGUIENTE';

    const oldQuiz = document.getElementById('quiz-options');
    if (oldQuiz) oldQuiz.remove();

    // Lógica para tipos de bloques: voice, story, strategy, breathing
    textDisplay.innerText = block.text[currentLang];
    if (block.color) textDisplay.style.color = block.color;
    else textDisplay.style.color = "white";

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
        display.innerText = remaining;
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
    const textDisplay = document.getElementById('text-content');
    textDisplay.innerText = block.question[currentLang];
    speak(block.question[currentLang]);

    const container = document.getElementById('block-container');
    const quizDiv = document.createElement('div');
    quizDiv.id = "quiz-options";
    quizDiv.style.width = "100%";

    block.options[currentLang].forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = "secondary";
        btn.style.marginTop = "8px";
        btn.onclick = () => {
            if (idx === block.correct) {
                speak(currentLang === 'en' ? "Correct." : "Correcto.");
                quizDiv.remove();
                mainBtn.style.display = 'block';
                nextStep();
            } else {
                btn.style.borderColor = "#ef4444";
                speak(currentLang === 'en' ? "Try again." : "Intenta de nuevo.");
            }
        };
        quizDiv.appendChild(btn);
    });
    container.appendChild(quizDiv);
}

function nextStep() {
    currentBlockIndex++;
    if (currentBlockIndex >= missions[currentMissionIndex].blocks.length) {
        currentMissionIndex++;
        currentBlockIndex = 0;
    }
    if (currentMissionIndex >= missions.length) {
        currentMissionIndex = 0; // Reinicia el ciclo
    }
    renderBlock();
}

function resetInactivity() {
    inactivitySeconds = 0;
    document.getElementById('warning-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', loadData);
window.onclick = resetInactivity;
