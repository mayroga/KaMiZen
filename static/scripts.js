let currentMissionIndex = 0;
let currentBlockIndex = 0;
let missions = [];
let currentLang = 'en';
let inactivitySeconds = 0;
let timerInterval = null;

// Configuración de fondos
const images = [
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b"
];

function changeBg() {
    const randomImg = images[Math.floor(Math.random() * images.length)];
    document.body.style.backgroundImage = `url('${randomImg}?auto=format&fit=crop&w=1600&q=80')`;
}

// Monitor de inactividad (Regla de 59s / 4min)
function startInactivityMonitor() {
    setInterval(() => {
        inactivitySeconds++;
        if (inactivitySeconds === 59) {
            document.getElementById('warning-modal').style.display = 'flex';
        }
        if (inactivitySeconds >= 240) {
            location.reload(); 
        }
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
        missions = data.missions;
        initApp();
    } catch (e) {
        document.getElementById('text-content').innerText = "Error loading AURA Engine.";
    }
}

function initApp() {
    const mainBtn = document.getElementById('main-btn');
    const langBtn = document.getElementById('lang-btn');

    mainBtn.onclick = () => {
        renderBlock();
    };

    langBtn.onclick = () => {
        currentLang = currentLang === 'en' ? 'es' : 'en';
        langBtn.innerText = currentLang === 'en' ? 'ES' : 'EN';
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

    // Actualizar Panel
    document.getElementById('level').innerText = `Level: ${mission.level}`;
    
    // Limpiar estados previos
    if (timerInterval) clearInterval(timerInterval);
    timerDisplay.style.display = 'none';
    mainBtn.disabled = false;
    mainBtn.innerText = currentLang === 'en' ? 'Next' : 'Siguiente';

    // Mostrar Contenido
    textDisplay.innerText = block.text[currentLang];

    // Lógica de Reto de Silencio
    if (block.type === 'breathing') {
        mainBtn.disabled = true; // BLOQUEO MECÁNICO
        const alertMsg = currentLang === 'en' ? 
            "SILENCE CHALLENGE: Stay still. Button will appear when done." : 
            "RETO DE SILENCIO: Mantente presente. El botón aparecerá al finalizar.";
        
        textDisplay.innerText = `${block.text[currentLang]}\n\n${alertMsg}`;
        timerDisplay.style.display = 'block';
        startSilenceTimer(block.duration);
    } 
    
    // Lógica de Quizzes
    else if (block.type === 'quiz') {
        renderQuiz(block);
    }

    mainBtn.onclick = () => {
        nextStep();
    };
}

function startSilenceTimer(seconds) {
    let remaining = seconds;
    const display = document.getElementById('timer-display');
    const mainBtn = document.getElementById('main-btn');

    timerInterval = setInterval(() => {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        display.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            mainBtn.disabled = false; // SE LIBERA EL RETO
            mainBtn.innerText = currentLang === 'en' ? 'Challenge Completed - Next' : 'Reto Cumplido - Siguiente';
        }
        remaining--;
    }, 1000);
}

function renderQuiz(block) {
    const mainBtn = document.getElementById('main-btn');
    mainBtn.style.display = 'none'; // Ocultar hasta que responda
    
    const container = document.getElementById('block-container');
    const quizDiv = document.createElement('div');
    quizDiv.id = "quiz-options";
    quizDiv.style.marginTop = "20px";

    block.options[currentLang].forEach((opt, idx) => {
        const optBtn = document.createElement('button');
        optBtn.innerText = opt;
        optBtn.className = "secondary";
        optBtn.onclick = () => {
            if (idx === block.correct) {
                document.getElementById('text-content').innerText = currentLang === 'en' ? "Correct!" : "¡Correcto!";
                quizDiv.remove();
                mainBtn.style.display = 'block';
                mainBtn.disabled = false;
            } else {
                optBtn.style.background = "#7f1d1d";
                document.getElementById('text-content').innerText = currentLang === 'en' ? "Try again." : "Intenta de nuevo.";
            }
        };
        quizDiv.appendChild(optBtn);
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

    if (currentMissionIndex < missions.length) {
        renderBlock();
    } else {
        document.getElementById('text-content').innerText = "CONGRATULATIONS. ALL MISSIONS COMPLETE.";
        document.getElementById('main-btn').style.display = 'none';
    }
}

// Iniciar
document.addEventListener('DOMContentLoaded', loadData);
window.onclick = resetInactivity;
