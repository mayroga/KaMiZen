// ==========================================
// AL CIELO - MOTOR DE LÓGICA NEURAL (SCRIPTS.JS)
// ==========================================

window.currentEvent = null;
let decisionTimer = null;
let bgMusic = null;
let startTime = null;
let isRecoveryActive = false;

/**
 * INICIO DEL FLUJO DE VIDA - BLINDADO
 */
async function startLifeFlow() {
    console.log("Despertando Motor Neural de May Roga...");
    
    // Obtener perfil o crear uno por defecto si no existe (Evita el bloqueo)
    let profileStr = localStorage.getItem("profile");
    let profile;
    
    if (!profileStr) {
        console.log("Perfil no detectado. Creando configuración base...");
        profile = { age: 18, difficulty: 1, emotion: "neutral" };
        localStorage.setItem("profile", JSON.stringify(profile));
    } else {
        profile = JSON.parse(profileStr);
    }
    
    startTime = Date.now();
    
    // Intentar configurar audio (fallará silenciosamente si no hay interacción, es normal)
    try { setupAudio(profile, "action"); } catch(e) { console.log("Audio en espera."); }

    try {
        const response = await fetch("/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile: profile })
        });

        if (!response.ok) throw new Error("Error en respuesta del servidor");
        
        const data = await response.json();
        
        if (data.status === "ready") {
            console.log("Conexión Exitosa. Sincronizando UI...");
            window.updateSimState(data.state);
            window.currentEvent = data.next_event;
            document.getElementById("text-content").innerText = "Sincronización completa. Bienvenido a la Vía Real.";
            processEventUI(data.next_event);
        }
    } catch (error) {
        console.error("Fallo Crítico:", error);
        document.getElementById("text-content").innerText = "ERROR: Motor Neural fuera de línea. Reintente.";
    }
}

/**
 * CONFIGURACIÓN DE AUDIO
 */
async function setupAudio(profile, phase = "action") {
    if (bgMusic) { bgMusic.pause(); bgMusic = null; }

    let mood = "ambient_tech";
    if (phase === "recovery") mood = "reflective_piano";
    else {
        if (profile.emotion === "stress") mood = "dark_industrial";
        else if (profile.age > 60) mood = "reflective_piano";
    }

    bgMusic = new Audio(`/static/audio/${mood}.mp3`);
    bgMusic.loop = true;
    bgMusic.volume = 0.2;

    const playAudio = () => {
        if (bgMusic && bgMusic.paused) bgMusic.play().catch(() => {});
    };
    document.addEventListener('click', playAudio, { once: true });
}

/**
 * PROCESADOR DE COLISIONES (Desde jet.html)
 */
function handleCollision(eventType) {
    if (isRecoveryActive) return;
    
    // Solo procesar si el evento es nuevo o es un ataque directo
    if (window.currentEvent !== eventType || eventType === "ataque_enemigo") {
        window.currentEvent = eventType;
        if (eventType === "ataque_enemigo") {
            sendDecision("ataque_enemigo");
        } else {
            const msg = `Evento Detectado: ${eventType.toUpperCase()}`;
            document.getElementById("text-content").innerText = msg;
            speak(msg);
            renderDecisionButtons();
        }
    }
}

/**
 * ENVÍO DE DECISIÓN AL JUEZ
 */
async function sendDecision(decisionType) {
    if (isRecoveryActive) return;
    clearTimeout(decisionTimer);
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    try {
        const response = await fetch("/judge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                decision: decisionType,
                context: window.currentEvent || "neutral",
                elapsed_time: elapsed
            })
        });

        const data = await response.json();
        
        if(data.state) window.updateSimState(data.state);

        if (data.status === "recovery") {
            initRecoveryPhase();
        } else if (data.status === "end") {
            handleGameOver(data.type);
        } else {
            window.currentEvent = data.next_event;
            processEventUI(data.next_event);
        }
    } catch (error) {
        console.error("Error en Juez:", error);
    }
}

/**
 * RECUPERACIÓN (8 MINUTOS)
 */
function initRecoveryPhase() {
    isRecoveryActive = true;
    document.getElementById("options").innerHTML = "";
    if (typeof startRecoveryPhase === "function") startRecoveryPhase();

    const stories = [
        "La riqueza no es lo que tienes, es lo que eres cuando el dinero no está.",
        "El poder real es el control absoluto de tu propia reacción.",
        "En el silencio se escuchan las mejores oportunidades.",
        "Tu bienestar es la inversión con mayor retorno de tu vida."
    ];

    let i = 0;
    const storyBox = document.getElementById("story-box");
    const interval = setInterval(() => {
        if (!isRecoveryActive) { clearInterval(interval); return; }
        if(storyBox) {
            storyBox.innerText = stories[i];
            speak(stories[i]);
            i = (i + 1) % stories.length;
        }
    }, 45000);
}

function processEventUI(nextEvent) {
    const messages = {
        "crisis": "Inestabilidad detectada. Protege tus activos.",
        "amor": "Vínculo emocional presente. Evalúa la inversión.",
        "tentacion": "Pulso de evasión activo. Mantén la disciplina.",
        "oportunidad": "Ventana de crecimiento abierta. Actúa rápido.",
        "conflicto": "Fricción externa detectada. ¿Acción o Poder?",
        "enfermedad": "Vulnerabilidad biológica. Rectifica el hábito.",
        "dinero": "Recurso disponible. Gestiona con astucia."
    };

    const txt = messages[nextEvent] || "El sistema genera una nueva variable.";
    document.getElementById("text-content").innerText = txt;
    speak(txt);
    renderDecisionButtons();

    // TDM automático por inacción
    decisionTimer = setTimeout(() => {
        if (!isRecoveryActive) sendDecision("TDM");
    }, 8000);
}

function renderDecisionButtons() {
    const container = document.getElementById("options");
    if(!container) return;
    container.innerHTML = "";
    ["TDB", "TDM", "TDN", "TDP", "TDG"].forEach(t => {
        const btn = document.createElement("button");
        btn.innerText = t;
        btn.onclick = (e) => { e.stopPropagation(); sendDecision(t); };
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

function handleGameOver(reason) {
    isRecoveryActive = false;
    const msg = reason ? reason.replace(/_/g, " ").toUpperCase() : "COLAPSO";
    document.getElementById("text-content").innerText = `COLAPSO: ${msg}`;
    document.getElementById("options").innerHTML = '<button onclick="location.reload()">REINICIAR VIDA</button>';
    speak(`Simulación finalizada por ${msg}`);
}
