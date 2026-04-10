let currentBlockIndex = 0;
let missionData = null;
let inactivityCounter = 0;
let challengeInterval = null;

const WARNING_TIME = 59; 
const KICK_TIME = 240; 

async function initSession() {
    try {
        const pathParts = window.location.pathname.split('/');
        const mId = pathParts[pathParts.length - 1] || 1;
        
        const response = await fetch('/api/content');
        const data = await response.json();
        
        missionData = data.missions.find(m => m.id == mId);
        
        if (missionData) {
            document.getElementById('category-label').innerText = missionData.category;
            document.getElementById('level-display').innerText = `Misión: ${missionData.id}`;
            renderBlock();
            startInactivityClock();
        }
    } catch (e) {
        console.error("Error en enlace:", e);
    }
}

function renderBlock() {
    const block = missionData.blocks[currentBlockIndex];
    const display = document.getElementById('text-display');
    const actionBtn = document.getElementById('action-btn');
    const timerDisp = document.getElementById('timer-display');
    const visual = document.getElementById('visual-element');

    actionBtn.style.display = 'none';
    timerDisp.style.display = 'none';
    visual.innerHTML = '';
    if (challengeInterval) clearInterval(challengeInterval);

    switch (block.type) {
        case 'strategy':
        case 'story':
        case 'voice':
            display.innerText = block.text.es;
            actionBtn.innerText = "Continuar";
            actionBtn.style.display = 'block';
            actionBtn.onclick = nextBlock;
            break;

        case 'breathing':
            display.innerText = block.text.es;
            startChallengeTimer(block.duration);
            break;

        case 'quiz':
            renderQuiz(block);
            break;

        case 'reward':
            display.innerHTML = `<span style="color:#fbbf24; font-size:40px;">★</span><br>${block.text.es}`;
            actionBtn.innerText = "Finalizar";
            actionBtn.style.display = 'block';
            actionBtn.onclick = () => window.location.href = '/';
            break;
    }
}

function startChallengeTimer(seconds) {
    const timerDisp = document.getElementById('timer-display');
    const actionBtn = document.getElementById('action-btn');
    
    timerDisp.style.display = 'block';
    actionBtn.style.display = 'none'; // BLOQUEO ABSOLUTO
    
    let remaining = seconds;
    challengeInterval = setInterval(() => {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timerDisp.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        
        if (remaining <= 0) {
            clearInterval(challengeInterval);
            timerDisp.style.color = "#10b981";
            actionBtn.innerText = "Reto Cumplido";
            actionBtn.style.display = 'block'; // DESBLOQUEO
            actionBtn.onclick = nextBlock;
        }
        remaining--;
    }, 1000);
}

function renderQuiz(block) {
    const visual = document.getElementById('visual-element');
    document.getElementById('text-display').innerText = block.question.es;
    
    block.options.es.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.style.background = "rgba(255,255,255,0.05)";
        btn.onclick = () => {
            if (idx === block.correct) {
                nextBlock();
            } else {
                btn.style.background = "#7f1d1d";
                setTimeout(() => btn.style.background = "rgba(255,255,255,0.05)", 500);
            }
        };
        visual.appendChild(btn);
    });
}

function nextBlock() {
    currentBlockIndex++;
    if (currentBlockIndex < missionData.blocks.length) renderBlock();
}

function startInactivityClock() {
    setInterval(() => {
        inactivityCounter++;
        if (inactivityCounter === WARNING_TIME) {
            document.getElementById('warning-modal').style.display = 'flex';
        }
        if (inactivityCounter >= KICK_TIME) {
            window.location.href = "/?expired=true";
        }
    }, 1000);
}

function resetInactivity() {
    inactivityCounter = 0;
    document.getElementById('warning-modal').style.display = 'none';
}

window.onclick = resetInactivity;
initSession();
