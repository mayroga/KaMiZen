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

    console.log(`May Roga Audio: Cargando atmósfera [${mood}]`);
    bgMusic = new Audio(`/static/audio/${mood}.mp3`);
    bgMusic.loop = true;
    bgMusic.volume = 0.4;

    // Activación por interacción para cumplir políticas de navegador
    const startAudio = () => {
        if (bgMusic && bgMusic.paused) bgMusic.play().catch(e => console.log("Audio Buffer..."));
        document.removeEventListener('click', startAudio);
    };
    document.addEventListener('click', startAudio);
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
            if(window.updateSimState) window.updateSimState(data.state);
            window.currentEvent = data.next_event;
            document.getElementById("text-content").innerText = "Sincronización completa. Bienvenido a la Vía Real.";
            processEventUI(data.next_event);
        }
    } catch (error) {
        document.getElementById("text-content").innerText = "ERROR DE ENLACE CON EL MOTOR.";
    }
}

/**
 * PROCESADOR DE EVENTOS
 */
function processEventUI(nextEvent) {
    if (isRecoveryActive) return;

    const messages = {
        "crisis": "Amenaza financiera detectada. Protege tus activos.",
        "amor": "Frecuencia emocional en aumento. Decide tu inversión.",
        "tentacion": "Señal de evasión detectada. Mantén la disciplina.",
        "oportunidad": "Vórtice de crecimiento abierto. Actúa ahora.",
        "conflicto": "Fricción externa en curso. ¿Guerra o Poder?",
        "enfermedad": "Vulnerabilidad biológica activa. Rectifica hábitos."
    };

    const txt = messages[nextEvent] || "El sistema genera una nueva variable.";
    const display = document.getElementById("text-content");
    if (display) display.innerText = txt;
    
    speak(txt);
    renderDecisionButtons();

    // Temporizador de Inacción (TDM) tras 7 segundos
    clearTimeout(decisionTimer);
    decisionTimer = setTimeout(() => {
        if (!isRecoveryActive) sendDecision("TDM");
    }, 7000);
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
        if(window.updateSimState) window.updateSimState(data);

        if (data.status === "recovery") {
            initRecoveryPhase();
        } else if (data.status === "end") {
            handleGameOver(data.type);
        } else {
            window.currentEvent = data.next_event;
            processEventUI(data.next_event);
        }
    } catch (error) {
        console.error("Fallo en el Juez:", error);
    }
}

/**
 * FASE DE RECUPERACIÓN (8 MINUTOS)
 */
function initRecoveryPhase() {
    isRecoveryActive = true;
    const profile = JSON.parse(localStorage.getItem("profile")) || {};
    setupAudio(profile, "recovery");
    
    const storyBox = document.getElementById("text-content");
    const optionsBox = document.getElementById("options");
    
    if (optionsBox) optionsBox.innerHTML = '<div class="recovery-loader">REGENERANDO...</div>';

    const stories = [
        "La riqueza no es lo que tienes, es lo que eres cuando el dinero no está. Respira.",
        "El poder real es el control absoluto de tu propia reacción. Inhala éxito.",
        "Astucia social: En el silencio se escuchan las mejores oportunidades. Exhala miedo.",
        "Tu bienestar es la inversión con mayor retorno de tu vida. Retiene la calma."
    ];

    let storyIndex = 0;
    const storyInterval = setInterval(() => {
        if (!isRecoveryActive) { clearInterval(storyInterval); return; }
        if (storyBox) storyBox.innerText = stories[storyIndex];
        speak(stories[storyIndex]);
        storyIndex = (storyIndex + 1) % stories.length;
    }, 30000);

    setTimeout(() => {
        isRecoveryActive = false;
        clearInterval(storyInterval);
        document.getElementById("text-content").innerText = "CICLO COMPLETADO";
        speak("Asesoría de recuperación finalizada. Has fortalecido tu red neural.");
        startLifeFlow(); // Reinicia el flujo normal
    }, 480000); 
}

function renderDecisionButtons() {
    const container = document.getElementById("options");
    if (!container) return;
    container.innerHTML = "";
    
    const types = ["TDB", "TDM", "TDN", "TDP", "TDG"];
    types.forEach(t => {
        const btn = document.createElement("button");
        btn.innerText = t;
        btn.className = "decision-btn";
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
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

function handleGameOver(reason) {
    if (bgMusic) bgMusic.pause();
    isRecoveryActive = false;
    const reasonText = reason ? reason.replace(/_/g, " ").toUpperCase() : "DESCONOCIDO";
    document.getElementById("text-content").innerText = `COLAPSO: ${reasonText}`;
    document.getElementById("options").innerHTML = '<button class="start-btn" onclick="location.href=\'/\'">REINICIAR VIDA</button>';
    speak(`Simulación finalizada por ${reasonText}. Analiza tus decisiones.`);
}

// Iniciar al cargar
window.onload = startLifeFlow;
