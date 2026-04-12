// ==========================================
// AL CIELO - MOTOR DE LÓGICA NEURAL (SCRIPTS.JS)
// ==========================================

window.currentEvent = null;
let decisionTimer = null;
let bgMusic = null;
let startTime = null;
let isRecoveryActive = false;

/**
 * INICIO DEL FLUJO DE VIDA - REFORZADO
 */
async function startLifeFlow() {
    console.log("Despertando Motor Neural de May Roga...");
    
    // 1. Validar Perfil
    let profileStr = localStorage.getItem("profile");
    let profile;
    if (!profileStr) {
        profile = { age: 18, difficulty: 1, emotion: "neutral" };
        localStorage.setItem("profile", JSON.stringify(profile));
    } else {
        profile = JSON.parse(profileStr);
    }
    
    startTime = Date.now();

    // 2. Conectar con el Servidor (Ruta absoluta para evitar 404)
    try {
        const response = await fetch(window.location.origin + "/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile: profile })
        });

        if (!response.ok) {
            throw new Error(`Error de red: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Datos recibidos:", data);
        
        if (data.status === "ready") {
            // Actualizar interfaz
            if (window.updateSimState) window.updateSimState(data.state);
            window.currentEvent = data.next_event;
            
            document.getElementById("text-content").innerText = "Sincronización completa. Bienvenido a la Vía Real.";
            
            // Iniciar flujo visual y de audio
            try { setupAudio(profile, "action"); } catch(e) {}
            processEventUI(data.next_event);
        }
    } catch (error) {
        console.error("Fallo Crítico de Sincronización:", error);
        document.getElementById("text-content").innerText = "ERROR: No se pudo conectar con el Motor Neural.";
    }
}

/**
 * AUDIO DINÁMICO
 */
async function setupAudio(profile, phase = "action") {
    if (bgMusic) { bgMusic.pause(); bgMusic = null; }
    let mood = (phase === "recovery") ? "reflective_piano" : "ambient_tech";
    
    bgMusic = new Audio(`/static/audio/${mood}.mp3`);
    bgMusic.loop = true;
    bgMusic.volume = 0.2;
    
    const playAudio = () => { if (bgMusic && bgMusic.paused) bgMusic.play().catch(() => {}); };
    document.addEventListener('mousedown', playAudio, { once: true });
}

/**
 * PROCESADOR DE EVENTOS
 */
function processEventUI(nextEvent) {
    if (!nextEvent || isRecoveryActive) return;

    const messages = {
        "crisis": "Inestabilidad detectada. Protege tus activos.",
        "amor": "Vínculo emocional presente. Evalúa la inversión.",
        "tentacion": "Pulso de evasión activo. Mantén la disciplina.",
        "oportunidad": "Ventana de crecimiento abierta. Actúa rápido.",
        "conflicto": "Fricción externa detectada. ¿Acción o Poder?",
        "enfermedad": "Vulnerabilidad biológica. Rectifica el hábito.",
        "dinero": "Recurso disponible. Gestiona con astucia."
    };

    const txt = messages[nextEvent] || "El sistema genera una nueva variable de vida.";
    document.getElementById("text-content").innerText = txt;
    speak(txt);
    renderDecisionButtons();

    // Limpiar timer previo antes de iniciar uno nuevo
    if (decisionTimer) clearTimeout(decisionTimer);
    decisionTimer = setTimeout(() => {
        if (!isRecoveryActive && window.currentEvent) {
            console.log("Inacción detectada (TDM)");
            sendDecision("TDM");
        }
    }, 10000); // 10 segundos de tolerancia
}

/**
 * ENVÍO AL JUEZ (TVID)
 */
async function sendDecision(decisionType) {
    if (isRecoveryActive) return;
    if (decisionTimer) clearTimeout(decisionTimer);
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    try {
        const response = await fetch(window.location.origin + "/judge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                decision: decisionType,
                context: window.currentEvent || "neutral",
                elapsed_time: elapsed
            })
        });

        const data = await response.json();
        
        if (data.state && window.updateSimState) {
            window.updateSimState(data.state);
        }

        if (data.status === "recovery") {
            initRecoveryPhase();
        } else if (data.status === "end") {
            handleGameOver(data.type);
        } else {
            window.currentEvent = data.next_event;
            processEventUI(data.next_event);
        }
    } catch (error) {
        console.error("Error en el Juez:", error);
    }
}

/**
 * COLISIONES DESDE EL RADAR
 */
function handleCollision(eventType) {
    if (isRecoveryActive) return;
    if (eventType === "ataque_enemigo") {
        sendDecision("ataque_enemigo");
    } else if (window.currentEvent !== eventType) {
        window.currentEvent = eventType;
        processEventUI(eventType);
    }
}

/**
 * BOTONES TVID
 */
function renderDecisionButtons() {
    const container = document.getElementById("options");
    if (!container) return;
    container.innerHTML = "";
    ["TDB", "TDM", "TDN", "TDP", "TDG"].forEach(t => {
        const btn = document.createElement("button");
        btn.innerText = t;
        btn.onclick = (e) => { 
            e.stopPropagation(); 
            sendDecision(t); 
        };
        container.appendChild(btn);
    });
}

function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
}

function initRecoveryPhase() {
    isRecoveryActive = true;
    document.getElementById("options").innerHTML = "";
    if (typeof startRecoveryPhase === "function") startRecoveryPhase();
}

function handleGameOver(reason) {
    isRecoveryActive = false;
    const msg = reason ? reason.replace(/_/g, " ").toUpperCase() : "SISTEMA APAGADO";
    document.getElementById("text-content").innerText = `COLAPSO: ${msg}`;
    document.getElementById("options").innerHTML = '<button onclick="location.reload()">REINICIAR</button>';
    speak(`Simulación finalizada por ${msg}`);
}
