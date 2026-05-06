/* =============================================================
   AURA BY MAY ROGA - KaMiZen ENGINE V3 (STRICT LINEAR)
   Procesa bloques uno a uno: Story -> Mission Blocks -> Complete
   ============================================================= */

let state = {
    name: "",
    step: "welcome", // welcome, training, complete
    mIndex: 0,       // Índice de la misión actual
    bIndex: 0,       // Índice del bloque actual dentro de la misión
    lang: "en",
    missions: [],
    initialized: false
};

window.addEventListener("load", async () => {
    await loadData();
    render();
});

async function loadData() {
    try {
        const res = await fetch("/api/missions");
        const data = await res.json();
        state.missions = data.missions || [];
        state.initialized = true;
    } catch (err) {
        console.error("Error cargando misiones");
    }
}

function speak(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = state.lang === "en" ? "en-US" : "es-ES";
    window.speechSynthesis.speak(msg);
}

function render() {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = "";

    if (state.step === "welcome") {
        app.innerHTML = `
            <h1>KAMIZEN LIFE SAFETY</h1>
            <div class="card">
                <input id="nameInput" type="text" placeholder="Full Name" />
            </div>
            <button class="primary" onclick="startApp()">BEGIN PROTOCOL</button>
        `;
        return;
    }

    if (state.step === "training") {
        const mission = state.missions[state.mIndex];
        if (!mission) {
            state.step = "complete";
            render();
            return;
        }

        const block = mission.b[state.bIndex];
        renderBlock(block, mission.b.length);
    }

    if (state.step === "complete") {
        app.innerHTML = `<h1>Entrenamiento Finalizado</h1><button class="primary" onclick="location.reload()">REINICIAR</button>`;
    }
}

function renderBlock(block, totalBlocks) {
    const app = document.getElementById("app");
    const isLast = state.bIndex === totalBlocks - 1;
    
    let content = "";
    let autoNext = false;

    // Lógica por tipo de bloque (t)
    switch (block.t || (block.story ? "story" : "")) {
        case "v": // Video/Título
            content = `<h2 class="title-block">${state.lang === 'en' ? block.tx.en : block.tx.es}</h2>`;
            speak(state.lang === 'en' ? block.tx.en : block.tx.es);
            break;

        case "h": // Hint/Ayuda
            content = `<div class="card hint"><h3>Tip:</h3><p>${state.lang === 'en' ? block.tx.en : block.tx.es}</p></div>`;
            speak(state.lang === 'en' ? block.tx.en : block.tx.es);
            break;

        case "story": // Historia
            content = `<div class="card story"><h3>Philosophy</h3><p>${state.lang === 'en' ? block.story.en : block.story.es}</p></div>`;
            speak(state.lang === 'en' ? block.story.en : block.story.es);
            break;

        case "br": // Respiración manual (pausa corta)
            content = `
                <div class="circle-container">
                    <div class="circle breath-manual"><span>${state.lang === 'en' ? block.tx.en : block.tx.es}</span></div>
                </div>`;
            speak(state.lang === 'en' ? block.tx.en : block.tx.es);
            break;

        case "d": // Decisión (Pregunta)
            const q = state.lang === 'en' ? block.q.en : block.q.es;
            content = `
                <div class="card">
                    <p class="question">${q}</p>
                    <div id="answers">
                        ${block.op.map((opt, i) => `<div class="answer" onclick="handleDecision(${i}, ${block.c}, ${JSON.stringify(block.ex).replace(/"/g, '&quot;')})">${opt}</div>`).join("")}
                    </div>
                    <div id="feedback"></div>
                </div>`;
            speak(q);
            return app.innerHTML = content; // No mostramos el botón "Next" hasta que responda

        case "sil": // Silencio
            content = `<div class="card"><h3>${state.lang === 'en' ? block.tx.en : block.tx.es}</h3><p>${state.lang === 'en' ? block.inf.en : block.inf.es}</p></div>`;
            autoNext = true;
            break;

        case "breath_auto": // Respiración Automática
            content = `
                <div class="circle-container">
                    <div class="circle blue-breath"><span id="breathAction">...</span></div>
                </div>
                <div class="card"><p>${state.lang === 'en' ? block.inf.en : block.inf.es}</p></div>`;
            app.innerHTML = content;
            return startAutoBreath(block.d);

        case "r": // Recompensa / Puntos
            content = `<div class="reward">⭐ ${block.tx} [${block.p} pts]</div>`;
            break;

        case "c": // Conclusión
            content = `<div class="card conclusion"><p>${state.lang === 'en' ? block.tx.en : block.tx.es}</p></div>`;
            speak(state.lang === 'en' ? block.tx.en : block.tx.es);
            break;
    }

    app.innerHTML = content + `<button class="primary" id="nextBlockBtn" onclick="nextBlock()">CONTINUE</button>`;
}

/* --- ACCIONES --- */

function startApp() {
    state.name = document.getElementById("nameInput").value || "User";
    state.step = "training";
    render();
}

function nextBlock() {
    const mission = state.missions[state.mIndex];
    if (state.bIndex < mission.b.length - 1) {
        state.bIndex++;
    } else {
        state.mIndex++;
        state.bIndex = 0;
    }
    render();
}

function handleDecision(idx, correct, explanations) {
    const isCorrect = idx === correct;
    const fb = document.getElementById("feedback");
    const exp = explanations[idx];
    
    fb.innerHTML = `<div class="exp-box ${isCorrect?'ok':'no'}"><p>${isCorrect?'CORRECT':'REVISE'}</p><span>${exp}</span></div>
                    <button class="primary" onclick="nextBlock()">CONTINUE</button>`;
    speak(exp);
}

function startAutoBreath(seconds) {
    let timeLeft = seconds;
    let phase = true; // true = inhale, false = exhale
    const label = document.getElementById("breathAction");
    
    const interval = setInterval(() => {
        if (!label) { clearInterval(interval); return; }
        
        const actionText = phase ? (state.lang === 'en' ? "INHALE" : "INHALA") : (state.lang === 'en' ? "EXHALE" : "EXHALA");
        label.innerText = actionText;
        speak(actionText);
        
        phase = !phase;
        timeLeft -= 4;
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            document.getElementById("app").innerHTML += `<button class="primary" onclick="nextBlock()">COMPLETE LEVEL</button>`;
        }
    }, 4000);
}
