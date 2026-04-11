// ==========================================
// AL CIELO - MOTOR DE LÓGICA NEURAL (SCRIPTS.JS)
// ==========================================

window.currentEvent = null;
let decisionTimer = null;
let bgMusic = null;

async function setupAudio(profile) {
    let mood = "ambient_tech"; 
    const age = parseInt(profile.age || 25);
    if (age < 18) mood = "energetic_lofi";
    else if (age > 60) mood = "reflective_piano";
    else if (profile.emotion === "stress") mood = "dark_industrial";

    console.log(`Lyria 3 Engine: Generando atmósfera [${mood}]`);
    bgMusic = new Audio(`/static/audio/${mood}.mp3`);
    bgMusic.loop = true;
    bgMusic.volume = 0.4;

    document.addEventListener('click', () => {
        if (bgMusic.paused) bgMusic.play().catch(e => console.log("Audio waiting..."));
    }, { once: true });
}

/**
 * INICIO DEL FLUJO DE VIDA - CON DESPERTAR DE SERVIDOR
 */
async function startLifeFlow() {
    console.log("Iniciando flujo de vida...");
    
    const profile = JSON.parse(localStorage.getItem("profile")) || { age: 18, difficulty: 1, emotion: "neutral" };
    setupAudio(profile);

    try {
        const response = await fetch("/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile: profile })
        });

        const data = await response.json();
        
        if (data.status === "ready") {
            window.updateSimState(data.state);
            localStorage.setItem("state", JSON.stringify(data.state));
            window.currentEvent = data.next_event;
            
            document.getElementById("text-content").innerText = "Conexión establecida. Iniciando Vía Real...";
            processEventUI(data.next_event);
        }
    } catch (error) {
        console.error("Fallo de conexión con el servidor:", error);
        document.getElementById("text-content").innerText = "ERROR DE ENLACE CON EL MOTOR.";
    }
}

/**
 * MANEJO DE COLISIONES E INTERACCIONES
 */
function handleCollision(eventType) {
    if (window.currentEvent === eventType) return; 

    window.currentEvent = eventType;
    const msg = `Evento: ${eventType.toUpperCase()} detectado en la Vía Real.`;
    document.getElementById("text-content").innerText = msg;
    speak(msg);

    // Si es una amenaza directa, la inacción (TDM) es automática si no se decide
    if (eventType === "enfermedad" || eventType === "crisis") {
        renderDecisionButtons();
    } else {
        renderDecisionButtons();
    }
}

/**
 * ENVÍO DE DECISIÓN AL JUEZ
 */
async function sendDecision(decisionType) {
    clearTimeout(decisionTimer);
    
    try {
        const response = await fetch("/judge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                decision: decisionType,
                context: window.currentEvent || "neutral"
            })
        });

        const data = await response.json();
        window.updateSimState(data.state);
        localStorage.setItem("state", JSON.stringify(data.state));

        if (data.status === "end") {
            handleGameOver(data.type);
        } else {
            window.currentEvent = data.next_event;
            processEventUI(data.next_event);
        }
    } catch (error) {
        console.error("Error en el Motor de Decisión:", error);
    }
}

function processEventUI(nextEvent) {
    const messages = {
        "crisis": "Inestabilidad financiera. ¿Cómo protegerás tu capital?",
        "amor": "Vínculo emocional detectado. Evalúa tu inversión afectiva.",
        "tentacion": "Impulso de evasión presente. Controla el vicio.",
        "oportunidad": "Puerta abierta al crecimiento. Requiere acción.",
        "conflicto": "Entorno hostil. Prepárate para la confrontación.",
        "dinero": "Recurso disponible. Gestiona con responsabilidad."
    };

    const txt = messages[nextEvent] || "La vida presenta un nuevo desafío.";
    document.getElementById("text-content").innerText = txt;
    speak(txt);
    renderDecisionButtons();

    decisionTimer = setTimeout(() => {
        if (window.currentEvent) {
            speak("Inacción detectada.");
            sendDecision("TDM");
        }
    }, 9000); 
}

function renderDecisionButtons() {
    const container = document.getElementById("options");
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
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
}

function handleGameOver(reason) {
    if (bgMusic) bgMusic.pause();
    const reasonText = reason.replace(/_/g, " ").toUpperCase();
    document.getElementById("text-content").innerText = `COLAPSO: ${reasonText}`;
    document.getElementById("options").innerHTML = '<button onclick="location.href=\'/\'">REINICIAR VIDA</button>';
    speak(`Simulación finalizada por ${reasonText}.`);
}
