let currentBlockIndex = 0;
let missionData = null;
let inactivityCounter = 0;
const WARNING_TIME = 59;
const KICK_TIME = 240; // 4 minutos

// Cargar datos inyectados por el server o fetch
async function initSession() {
    const pathParts = window.location.pathname.split('/');
    const mId = pathParts[pathParts.length - 1];
    const response = await fetch('/api/content');
    const data = await response.json();
    missionData = data.missions.find(m => m.id == mId);
    
    document.getElementById('category-label').innerText = missionData.category;
    renderBlock();
    startInactivityTimer();
}

function renderBlock() {
    const block = missionData.blocks[currentBlockIndex];
    const display = document.getElementById('text-display');
    const actionBtn = document.getElementById('action-btn');
    const timerDisp = document.getElementById('timer-display');
    const visual = document.getElementById('visual-element');

    // Reset view
    actionBtn.classList.add('hidden');
    timerDisp.classList.add('hidden');
    visual.innerHTML = '';
    
    // Aplicar Color si existe
    if(block.color) document.body.style.backgroundColor = block.color;

    // Lógica por tipo
    switch(block.type) {
        case 'voice':
        case 'story':
        case 'strategy':
            display.innerText = block.text.es; // Default a Español
            actionBtn.classList.remove('hidden');
            break;

        case 'breathing':
            display.innerText = block.text.es;
            startChallengeTimer(block.duration);
            break;

        case 'quiz':
            renderQuiz(block);
            break;

        case 'reward':
            display.innerHTML = `<span class="text-yellow-400">★ ${block.text.es}</span><br><small>+${block.points} pts</small>`;
            actionBtn.innerText = "Finalizar Misión";
            actionBtn.classList.remove('hidden');
            actionBtn.onclick = () => window.location.href = '/';
            break;
    }
}

function startChallengeTimer(seconds) {
    const timerDisp = document.getElementById('timer-display');
    timerDisp.classList.remove('hidden');
    let remaining = seconds;

    const interval = setInterval(() => {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timerDisp.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        
        if (remaining <= 0) {
            clearInterval(interval);
            timerDisp.classList.add('text-green-500');
            document.getElementById('action-btn').classList.remove('hidden');
        }
        remaining--;
    }, 1000);
}

function renderQuiz(block) {
    const display = document.getElementById('text-display');
    display.innerText = block.question.es;
    const visual = document.getElementById('visual-element');
    
    block.options.es.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "block w-full mb-2 p-4 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition";
        btn.innerText = opt;
        btn.onclick = () => {
            if(idx === block.correct) {
                alert(block.explanation.es.correct);
                nextBlock();
            } else {
                alert(block.explanation.es.wrong);
            }
        };
        visual.appendChild(btn);
    });
}

function nextBlock() {
    currentBlockIndex++;
    if(currentBlockIndex < missionData.blocks.length) {
        renderBlock();
    }
}

document.getElementById('action-btn').onclick = nextBlock;

// --- GESTIÓN DE INACTIVIDAD ---
function startInactivityTimer() {
    setInterval(() => {
        inactivityCounter++;
        if(inactivityCounter === WARNING_TIME) {
            document.getElementById('warning-modal').classList.remove('hidden');
        }
        if(inactivityCounter >= KICK_TIME) {
            window.location.href = "/?msg=session_expired";
        }
    }, 1000);
}

function resetInactivity() {
    inactivityCounter = 0;
    document.getElementById('warning-modal').classList.add('hidden');
}

// Escuchar toques para resetear
window.onclick = resetInactivity;
window.onkeypress = resetInactivity;

initSession();
