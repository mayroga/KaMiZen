// ==========================================
// AL CIELO - MOTOR DE LÓGICA NEURAL (SCRIPTS.JS)
// ==========================================

window.currentEvent = null;
let decisionTimer = null;
let bgMusic = null;

/**
 * CONFIGURACIÓN DE AUDIO ADAPTATIVO
 * Basado en la edad y el perfil de entrada.
 */
async function setupAudio(profile) {
    let mood = "ambient_tech"; 
    const age = parseInt(profile.age || 25);
    
    // Selección de atmósfera según etapa de vida
    if (age < 18) mood = "energetic_lofi";
    else if (age > 60) mood = "reflective_piano";
    else if (profile.emotion === "stress") mood = "dark_industrial";

    console.log(`Lyria 3 Engine: Generando atmósfera [${mood}]`);
    
    // El audio se activa tras la primera interacción del usuario
    bgMusic = new Audio(`/static/audio/${mood}.mp3`);
    bgMusic.loop = true;
    bgMusic.volume = 0.4;

    document.addEventListener('click', () => {
        if (bgMusic.paused) bgMusic.play().catch(e => console.log("Audio waiting..."));
    }, { once: true });
}

/**
 * INICIO DEL FLUJO DE VIDA
 * Sincroniza con el servidor para obtener el primer evento real.
 */
async function startLifeFlow() {
    const profile = JSON.parse(localStorage.getItem("profile"));
    const savedState = JSON.parse(localStorage.getItem("state"));

    if (profile) setupAudio(profile);
    
    // Notificamos al sistema que la vida ha comenzado
    // Enviamos una decisión neutra (TDB) para disparar el primer evento
    if (savedState) {
        window.updateSimState(savedState);
        await sendDecision("TDB"); 
    }
}

/**
 * MANEJO DE COLISIONES (IMPACTO VISUAL)
 * Se activa cuando el jugador choca con un icono en JET.HTML.
 */
function handleCollision(eventType) {
    if (window.currentEvent === eventType) return; // Evitar duplicados inmediatos

    window.currentEvent = eventType;
    const msg = `Impacto detectado: Evento de ${eventType.toUpperCase()} en curso.`;
    document.getElementById("text-content").innerText = msg;
    speak(msg);

    // Si es enfermedad (tractor), el daño es automático por negligencia (TDM)
    if (eventType === "enfermedad") {
        sendDecision("TDM");
    } else {
        renderDecisionButtons();
    }
}

/**
 * ENVÍO DE DECISIÓN AL JUEZ (BACKEND)
 * Procesa la lógica TVID y devuelve el nuevo estado de vida.
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
        
        // Actualizamos la interfaz del simulador
        window.updateSimState(data.state);
        localStorage.setItem("state", JSON.stringify(data.state));

        if (data.status === "end") {
            handleGameOver(data.type);
        } else {
            // Preparamos el siguiente evento que aparecerá en el simulador
            window.currentEvent = data.next_event;
            processEventUI(data.next_event);
        }
    } catch (error) {
        console.error("Error en el Motor de Decisión:", error);
    }
}

/**
 * PROCESAMIENTO DE INTERFAZ PARA NUEVOS EVENTOS
 */
function processEventUI(nextEvent) {
    const messages = {
        "crisis": "Inestabilidad financiera. ¿Cómo protegerás tu capital?",
        "amor": "Vínculo emocional detectado. Evalúa tu inversión afectiva.",
        "tentacion": "Impulso de evasión presente. Controla el vicio.",
        "oportunidad": "Puerta abierta al crecimiento. Requiere acción inmediata.",
        "conflicto": "Entorno hostil. Prepárate para la confrontación.",
        "dinero": "Recurso disponible. Gestiona con responsabilidad."
    };

    const txt = messages[nextEvent] || "La vida te presenta un nuevo desafío.";
    document.getElementById("text-content").innerText = txt;
    speak(txt);
    
    renderDecisionButtons();

    // REGLA DE ORO (PASO 10): No decidir es una decisión (TDM)
    decisionTimer = setTimeout(() => {
        if (window.currentEvent) {
            speak("Tiempo agotado. La inacción tiene consecuencias.");
            sendDecision("TDM");
        }
    }, 9000); // 9 segundos para reaccionar
}

/**
 * RENDERIZADO DE BOTONES TVID
 */
function renderDecisionButtons() {
    const container = document.getElementById("options");
    container.innerHTML = "";
    
    // TDB: Bien Consciente, TDM: Miedo/Vicio, TDN: Niño/Emoción, TDP: Poder, TDG: Guerra
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

/**
 * SISTEMA DE VOZ (ASESORÍA PROFESIONAL)
 */
function speak(text) {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
}

/**
 * FINALIZACIÓN DE LA SIMULACIÓN
 */
function handleGameOver(reason) {
    if (bgMusic) bgMusic.pause();
    
    const reasonText = reason.replace(/_/g, " ").toUpperCase();
    document.getElementById("text-content").innerText = `COLAPSO: ${reasonText}`;
    document.getElementById("options").innerHTML = '<button onclick="location.href=\'/\'">REINICIAR VIDA</button>';
    
    speak(`Simulación interrumpida por ${reasonText}. Tu mensaje final ha sido procesado.`);
}
