let currentEvent = null;
let timer = null;

// VOZ PROFESIONAL (Asesoría)
function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.9; 
    window.speechSynthesis.speak(utterance);
}

// SINCRONIZACIÓN CON EL SIMULADOR
async function sendDecision(decision) {
    clearTimeout(timer);

    const response = await fetch("/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            decision: decision,
            context: currentEvent
        })
    });

    const data = await response.json();
    
    // Actualizar estado global en el simulador
    if (window.updateSimState) window.updateSimState(data.state);

    if (data.status === "end") {
        handleGameOver(data.type);
    } else {
        processNewEvent(data.next_event);
    }
}

function processNewEvent(eventName) {
    currentEvent = eventName;
    const descriptions = {
        "crisis": "Situación financiera crítica. ¿Cómo respondes?",
        "amor": "Conexión emocional detectada. Evalúa tu prioridad.",
        "enfermedad": "Tu cuerpo reclama atención inmediata.",
        "tentacion": "Un impulso de evasión intenta controlarte.",
        "oportunidad": "Puerta abierta al crecimiento. Requiere decisión.",
        "rechazo": "Interacción social fallida. Controla tu reacción."
    };

    const msg = descriptions[eventName] || "La vida te presenta un nuevo desafío.";
    document.getElementById("text-content").innerText = msg;
    speak(msg);

    renderDecisionButtons();
    
    // REGLA: Si no decides en 6 seg, la vida decide (PASO 10)
    timer = setTimeout(() => {
        speak("El tiempo se agotó. La evitación es tu decisión.");
        sendDecision("TDM");
    }, 6000);
}

function renderDecisionButtons() {
    const box = document.getElementById("options");
    box.innerHTML = "";
    const choices = ["TDB", "TDM", "TDN", "TDP", "TDG"];

    choices.forEach(c => {
        const btn = document.createElement("button");
        btn.innerText = c;
        btn.onclick = () => sendDecision(c);
        box.appendChild(btn);
    });
}

function handleGameOver(type) {
    const msg = `Simulación terminada: ${type.replace("_", " ").toUpperCase()}`;
    document.getElementById("text-content").innerText = msg;
    speak(msg);
    document.getElementById("options").innerHTML = '<button onclick="location.reload()">REENCARNAR</button>';
}
