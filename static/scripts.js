// CONFIGURACIÓN DE MÚSICA ADAPTATIVA (LYRIA 3 CONCEPT)
let bgMusic = null;
window.currentEvent = null;
let decisionTimer = null;

async function setupAudio(profile) {
    // Definir atmósfera según EDAD y ESTADO
    let mood = "ambient_tech"; 
    if(profile.age < 18) mood = "energetic_lofi";
    if(profile.age > 60) mood = "reflective_piano";
    if(profile.emotion === "stress") mood = "dark_industrial";

    console.log(`Lyria 3 generando atmósfera: ${mood}`);
    
    // Simulación de carga de audio dinámico
    bgMusic = new Audio(`/static/audio/${mood}.mp3`);
    bgMusic.loop = true;
    bgMusic.volume = 0.4;
    
    // Iniciar al primer click
    document.addEventListener('click', () => {
        bgMusic.play().catch(() => {});
    }, { once: true });
}

// FLUJO DE VIDA
async function startLifeFlow() {
    const profile = JSON.parse(localStorage.getItem("profile"));
    if(profile) setupAudio(profile);
    
    // Primer evento
    const state = JSON.parse(localStorage.getItem("state"));
    processNewEvent("oportunidad"); 
}

async function handleCollision(eventType) {
    // Si chocas, la vida te obliga a una decisión rápida o daño automático
    window.currentEvent = eventType;
    const msg = `¡IMPACTO! Evento de ${eventType.toUpperCase()} detectado.`;
    document.getElementById("text-content").innerText = msg;
    
    // Si es enfermedad (tractor), daño directo
    if(eventType === "enfermedad") {
        sendDecision("TDM"); // La evitación en enfermedad cuesta salud
    } else {
        renderDecisionButtons();
    }
}

async function sendDecision(decisionType) {
    clearTimeout(decisionTimer);
    
    const res = await fetch("/judge", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            decision: decisionType,
            context: window.currentEvent
        })
    });

    const data = await res.json();
    window.updateSimState(data.state);
    
    if(data.status === "end") {
        gameOver(data.type);
    } else {
        window.currentEvent = data.next_event;
        updateUI(data.next_event);
    }
}

function updateUI(nextEvent) {
    const messages = {
        "crisis": "La presión financiera aumenta. ¿Qué sacrificas?",
        "amor": "Una conexión requiere tiempo. ¿Lo das?",
        "tentacion": "El vacío busca llenarse con vicios.",
        "oportunidad": "Un camino nuevo aparece delante de ti.",
        "conflicto": "Helicópteros en el cielo. El entorno es hostil."
    };
    
    const txt = messages[nextEvent] || "La vida sigue su curso...";
    document.getElementById("text-content").innerText = txt;
    speak(txt);
    renderDecisionButtons();

    // PASO 10: No decidir es decidir (TDM)
    decisionTimer = setTimeout(() => {
        speak("Inacción detectada. La vida decide por ti.");
        sendDecision("TDM");
    }, 8000);
}

function renderDecisionButtons() {
    const container = document.getElementById("options");
    container.innerHTML = "";
    const types = ["TDB", "TDM", "TDN", "TDP", "TDG"];
    
    types.forEach(t => {
        const btn = document.createElement("button");
        btn.innerText = t;
        btn.onclick = () => sendDecision(t);
        container.appendChild(btn);
    });
}

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'es-ES';
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
}

function gameOver(reason) {
    if(bgMusic) bgMusic.pause();
    document.getElementById("text-content").innerText = `COLAPSO: ${reason.replace("_", " ").toUpperCase()}`;
    document.getElementById("options").innerHTML = '<button onclick="location.href=\'/\'">REINTENTAR</button>';
    speak("La simulación ha terminado. Tu legado ha sido procesado.");
}
