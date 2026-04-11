// ==========================================
// AL CIELO - MOTOR DE LÓGICA NEURAL (SCRIPTS.JS)
// ==========================================

window.currentEvent = null;
let decisionTimer = null;
let bgMusic = null;
let startTime = null;
let isRecoveryActive = false;

/**
 * CONFIGURACIÓN DE AUDIO DINÁMICO
 */
async function setupAudio(profile, phase = "action") {
    if (bgMusic) {
        bgMusic.pause();
        bgMusic = null;
    }

    let mood = "ambient_tech";
    if (phase === "recovery") {
        mood = "reflective_piano";
    } else {
        const age = parseInt(profile.age || 25);
        if (profile.emotion === "stress") mood = "dark_industrial";
        else if (age > 60) mood = "reflective_piano";
    }

    console.log(`May Roga Audio: Sincronizando atmósfera [${mood}]`);
    bgMusic = new Audio(`/static/audio/${mood}.mp3`);
    bgMusic.loop = true;
    bgMusic.volume = 0.3;

    // El audio requiere interacción del usuario para iniciar
    const startAudio = () => {
        if (bgMusic && bgMusic.paused) {
            bgMusic.play().catch(e => console.log("Audio en espera de interacción..."));
        }
    };
    document.addEventListener('click', startAudio, { once: true });
    document.addEventListener('keydown', startAudio, { once: true });
}

/**
 * INICIO DEL FLUJO DE VIDA
 */
async function startLifeFlow() {
    console.log("Despertando Motor Neural...");
    const profile = JSON.parse(localStorage.getItem("profile")) || { age: 18, difficulty: 1, emotion: "neutral" };
    
    startTime = Date.now();
    setupAudio(profile, "action");

    try {
        const response = await fetch("/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile: profile })
        });

        const data = await response.json();
        
        if (data.status === "ready") {
            window.updateSimState(data.state);
            window.currentEvent = data.next_event;
            document.getElementById("text-content").innerText = "Sincronización completa. Bienvenido a la Vía Real.";
            processEventUI(data.next_event);
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        document.getElementById("text-content").innerText = "ERROR: No hay respuesta del Motor Neural.";
    }
}

/**
 * PROCESADOR DE EVENTOS Y COLISIONES
 */
function handleCollision(eventType) {
    if (isRecoveryActive) return;
    
    // Evita bucles infinitos de la misma colisión
    if (window.currentEvent !== eventType) {
        window.currentEvent = eventType;
        const msg = `Evento Detectado: ${eventType.toUpperCase()}`;
        document.getElementById("text-content").innerText = msg;
        speak(msg);
        renderDecisionButtons();
    }
}

/**
 * ENVÍO DE DECISIÓN AL JUEZ (TVID)
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
        
        // Actualizar UI con la respuesta del Juez
        if(data.state) window.updateSimState(data.state);
        else window.updateSimState(data);

        if (data.status === "recovery") {
            initRecoveryPhase();
        } else if (data.status === "end") {
            handleGameOver(data.type);
        } else {
            window.currentEvent = data.next_event;
            processEventUI(data.next_event);
        }
    } catch (error) {
        console.error("Error en el Motor de Decisión:", error);
    }
}

/**
 * FASE DE RECUPERACIÓN TVID (8 MINUTOS)
 */
function initRecoveryPhase() {
    isRecoveryActive = true;
    const profile = JSON.parse(localStorage.getItem("profile")) || {};
    setupAudio(profile, "recovery");
    
    // Cambiar vista en HTML
    if (typeof startRecoveryPhase === "function") {
        startRecoveryPhase();
    }

    const stories = [
        "La riqueza no es lo que tienes, es lo que eres cuando el dinero no está. Respira.",
        "El poder real es el control absoluto de tu propia reacción. Inhala éxito.",
        "Astucia social: En el silencio se escuchan las mejores oportunidades. Exhala miedo.",
        "Tu bienestar es la inversión con mayor retorno de tu vida. Retiene la calma.",
        "Tú no eres tus circunstancias, eres el arquitecto de tu respuesta. Respira hondo."
    ];

    let storyIndex = 0;
    const storyBox = document.getElementById("story-box");
    
    // Ciclo de reprogramación cada 45 segundos
    const storyInterval = setInterval(() => {
        if (!isRecoveryActive) { clearInterval(storyInterval); return; }
        const text = stories[storyIndex];
        if(storyBox) storyBox.innerText = text;
        speak(text);
        storyIndex = (storyIndex + 1) % stories.length;
    }, 45000);

    // Cierre automático tras los 8 minutos (480000ms)
    setTimeout(() => {
        const finMsg = "Ciclo de recuperación completado. Has fortalecido tu red neural.";
        document.getElementById("recovery-text").innerText = "SISTEMA RECALIBRADO";
        speak(finMsg);
        // Aquí podrías redirigir o reiniciar el juego
    }, 480000); 
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

    const txt = messages[nextEvent] || "El simulador genera una nueva variable de vida.";
    document.getElementById("text-content").innerText = txt;
    speak(txt);
    renderDecisionButtons();

    // Castigo por inacción (TDM) tras 8 segundos de duda
    decisionTimer = setTimeout(() => {
        if (!isRecoveryActive && window.currentEvent) {
            speak("Duda detectada. El miedo toma el control.");
            sendDecision("TDM");
        }
    }, 8000);
}

function renderDecisionButtons() {
    const container = document.getElementById("options");
    if(!container) return;
    
    container.innerHTML = "";
    const types = ["TDB", "TDM", "TDN", "TDP", "TDG"];
    
    types.forEach(t => {
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
    utterance.rate = 0.95; // Velocidad profesional y clara
    window.speechSynthesis.speak(utterance);
}

function handleGameOver(reason) {
    if (bgMusic) bgMusic.pause();
    isRecoveryActive = false;
    const reasonText = reason ? reason.replace(/_/g, " ").toUpperCase() : "SISTEMA DESCONOCIDO";
    document.getElementById("text-content").innerText = `COLAPSO: ${reasonText}`;
    document.getElementById("options").innerHTML = '<button onclick="location.reload()">REINTENTAR VIDA</button>';
    speak(`Simulación finalizada por ${reasonText}. Analiza tus decisiones.`);
}
