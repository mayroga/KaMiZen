let currentBlockIndex = 0;
let missionData = null;
let inactivityCounter = 0;
let challengeInterval = null;
let currentLang = 'en'; // Default language is English

async function initSession() {
    try {
        const response = await fetch('/session_content');
        const data = await response.json();
        
        // Asumiendo que quieres cargar la primera misión o una específica
        missionData = data.missions[0]; 
        
        document.getElementById('start-btn').onclick = () => {
            document.getElementById('start-btn').style.display = 'none';
            document.getElementById('next-btn').style.display = 'block';
            renderBlock();
            startInactivityMonitor();
        };

        // Botón de idioma
        document.getElementById('lang-btn').onclick = () => {
            currentLang = currentLang === 'en' ? 'es' : 'en';
            document.getElementById('lang-btn').innerText = currentLang === 'en' ? 'ES' : 'EN';
            renderBlock();
        };

    } catch (e) { console.error("Load error:", e); }
}

function renderBlock() {
    if (!missionData) return;
    const block = missionData.blocks[currentBlockIndex];
    const textDisplay = document.getElementById('text-content');
    const timerDisplay = document.getElementById('timer-display');
    const nextBtn = document.getElementById('next-btn');

    // Limpiar estados
    timerDisplay.style.display = 'none';
    if (challengeInterval) clearInterval(challengeInterval);

    // Idioma
    textDisplay.innerText = block.text[currentLang];

    if (block.type === 'breathing') {
        nextBtn.style.display = 'none'; // BLOQUEO: Oculta el botón
        timerDisplay.style.display = 'block';
        startTimer(block.duration);
    } else {
        nextBtn.style.display = 'block';
        nextBtn.onclick = nextBlock;
    }
}

function startTimer(seconds) {
    let remaining = seconds;
    const timerDisplay = document.getElementById('timer-display');
    challengeInterval = setInterval(() => {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (remaining <= 0) {
            clearInterval(challengeInterval);
            document.getElementById('next-btn').style.display = 'block'; // DESBLOQUEO
        }
        remaining--;
    }, 1000);
}

function nextBlock() {
    currentBlockIndex++;
    if (currentBlockIndex < missionData.blocks.length) renderBlock();
}

function startInactivityMonitor() {
    setInterval(() => {
        inactivityCounter++;
        if (inactivityCounter === 59) {
            document.getElementById('warning-modal').style.display = 'flex';
        }
        if (inactivityCounter >= 240) {
            window.location.reload(); // Reiniciar por inactividad 4 min
        }
    }, 1000);
}

function resetInactivity() {
    inactivityCounter = 0;
    document.getElementById('warning-modal').style.display = 'none';
}

window.onclick = resetInactivity;
initSession();
