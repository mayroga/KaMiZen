/**
 * AL CIELO - Core Engine
 * Gestión de misiones, retos de silencio progresivos y seguridad de inactividad.
 */

let currentBlockIndex = 0;
let missionData = null;
let inactivityCounter = 0;
let challengeInterval = null;

// Tiempos de control según reglas de negocio
const WARNING_TIME = 59; // Advertencia de toque
const KICK_TIME = 240;   // 4 minutos: Expulsión y re-pago

async function initSession() {
    try {
        const pathParts = window.location.pathname.split('/');
        const mId = pathParts[pathParts.length - 1];
        
        const response = await fetch('/api/content');
        const data = await response.json();
        
        missionData = data.missions.find(m => m.id == mId);
        
        if (!missionData) {
            console.error("Misión no encontrada");
            window.location.href = "/";
            return;
        }

        document.getElementById('category-label').innerText = missionData.category;
        renderBlock();
        startInactivityMonitoring();
    } catch (error) {
        console.error("Error inicializando sesión:", error);
    }
}

function renderBlock() {
    const block = missionData.blocks[currentBlockIndex];
    const display = document.getElementById('text-display');
    const actionBtn = document.getElementById('action-btn');
    const timerDisp = document.getElementById('timer-display');
    const visual = document.getElementById('visual-element');

    // Limpiar estado previo
    actionBtn.classList.add('hidden');
    timerDisp.classList.add('hidden');
    timerDisp.classList.remove('text-green-500');
    visual.innerHTML = '';
    if (challengeInterval) clearInterval(challengeInterval);
    
    // Aplicar color de fondo si el bloque lo define (Estrategias de poder)
    if (block.color) {
        document.body.style.backgroundColor = block.color;
    } else {
        document.body.style.backgroundColor = "#000000";
    }

    // Lógica por tipo de bloque
    switch (block.type) {
        case 'strategy':
        case 'story':
        case 'voice':
            // En estos bloques el botón SI está disponible para avanzar tras leer
            display.innerText = block.text.es;
            actionBtn.innerText = "Continuar";
            actionBtn.classList.remove('hidden');
            actionBtn.onclick = nextBlock;
            break;

        case 'breathing':
            // RETO DE SILENCIO: Bloqueo total hasta que el tiempo expire
            display.innerText = block.text.es;
            startChallengeTimer(block.duration);
            break;

        case 'quiz':
            renderQuiz(block);
            break;

        case 'reward':
            display.innerHTML = `
                <div class="animate-bounce text-yellow-400 text-5xl mb-4">★</div>
                <div class="text-3xl font-bold uppercase">${block.text.es}</div>
                <div class="text-blue-500 mt-2">+${block.points} PTS</div>
            `;
            actionBtn.innerText = "Finalizar Misión";
            actionBtn.classList.remove('hidden');
            actionBtn.onclick = () => window.location.href = '/';
            break;
    }
}

function startChallengeTimer(seconds) {
    const timerDisp = document.getElementById('timer-display');
    const actionBtn = document.getElementById('action-btn');
    
    // El botón se oculta obligatoriamente
    actionBtn.classList.add('hidden');
    timerDisp.classList.remove('hidden');
    
    let remaining = seconds;

    challengeInterval = setInterval(() => {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        
        // Formato MM:SS para retos largos de hasta 30 min
        timerDisp.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        
        if (remaining <= 0) {
            clearInterval(challengeInterval);
            timerDisp.classList.add('text-green-500');
            // Solo aquí se desbloquea el avance
            actionBtn.innerText = "Reto Vencido - Continuar";
            actionBtn.classList.remove('hidden');
            actionBtn.onclick = nextBlock;
        }
        remaining--;
    }, 1000);
}

function renderQuiz(block) {
    const display = document.getElementById('text-display');
    const visual = document.getElementById('visual-element');
    
    display.innerText = block.question.es;
    
    block.options.es.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "block w-full max-w-md mx-auto mb-3 p-5 bg-zinc-900 border border-zinc-700 rounded-xl hover:bg-blue-600 hover:border-blue-400 transition-all text-lg font-medium";
        btn.innerText = opt;
        btn.onclick = () => {
            if (idx === block.correct) {
                // Feedback visual rápido y avanza
                btn.classList.replace('bg-zinc-900', 'bg-green-600');
                setTimeout(nextBlock, 800);
            } else {
                btn.classList.add('animate-shake', 'bg-red-600');
                setTimeout(() => btn.classList.remove('bg-red-600'), 500);
            }
        };
        visual.appendChild(btn);
    });
}

function nextBlock() {
    currentBlockIndex++;
    if (missionData && currentBlockIndex < missionData.blocks.length) {
        renderBlock();
    }
}

// --- SISTEMA DE SEGURIDAD E INACTIVIDAD ---

function startInactivityMonitoring() {
    setInterval(() => {
        inactivityCounter++;
        
        // Advertencia visual a los 59 segundos
        if (inactivityCounter === WARNING_TIME) {
            const modal = document.getElementById('warning-modal');
            if (modal) modal.classList.remove('hidden');
        }
        
        // Expulsión a los 4 minutos (240 segundos)
        if (inactivityCounter >= KICK_TIME) {
            window.location.href = "/?session=expired"; 
        }
    }, 1000);
}

function resetInactivity() {
    inactivityCounter = 0;
    const modal = document.getElementById('warning-modal');
    if (modal) modal.classList.add('hidden');
}

// Resetear contador ante cualquier interacción real
window.onclick = resetInactivity;
window.ontouchstart = resetInactivity;
window.onkeypress = resetInactivity;

// Iniciar aplicación
document.addEventListener('DOMContentLoaded', initSession);
