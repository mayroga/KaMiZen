let lang = "es";
let gameMode = "idle"; // idle | action | mission
let sessionTime = 300;

// Configuración de Voz Masculina
const speak = (text) => {
    if (!text) return;
    speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    ut.voice = voices.find(v => v.name.includes("Male") || v.lang.includes("es-MX")) || voices[0];
    ut.lang = lang === "es" ? "es-ES" : "en-US";
    ut.rate = 0.85; // Peso y autoridad
    speechSynthesis.speak(ut);
};

// Ciclo de Misión: Procesa los bloques b[] secuencialmente
async function runMission() {
    gameMode = "mission";
    const res = await fetch(`/api/mission/next?lang=${lang}`);
    const data = await res.json();
    
    if (data.end) return showEndScreen();

    const blocks = data.mission.b;
    const overlay = document.getElementById("overlay");
    overlay.style.display = "flex";

    for (let block of blocks) {
        await processBlock(block);
    }

    overlay.style.display = "none";
    gameMode = "action"; // Vuelve a las palabras flotantes
}

async function processBlock(b) {
    const title = document.getElementById("phase-title");
    const desc = document.getElementById("phase-desc");
    const grid = document.getElementById("decision-grid");

    switch(b.t) {
        case "v": // Visual Title
            title.innerText = b.tx[lang];
            break;
        
        case "story": // Narrativa
            desc.innerText = b[lang];
            speak(b[lang]);
            await new Promise(r => setTimeout(r, 3000)); // Pausa para lectura
            break;

        case "d": // Decisión (Interactiva)
            grid.innerHTML = "";
            return new Promise((resolve) => {
                b.op.forEach((option, idx) => {
                    const btn = document.createElement("button");
                    btn.className = "choice-btn";
                    btn.innerText = option.split(" / ")[lang === "es" ? 1 : 0];
                    btn.onclick = () => {
                        const isCorrect = idx === b.c;
                        desc.innerText = b.ex[idx].split(" / ")[lang === "es" ? 1 : 0];
                        speak(desc.innerText);
                        document.body.className = isCorrect ? "correct-flash" : "wrong-flash";
                        setTimeout(() => { 
                            document.body.className = ""; 
                            grid.innerHTML = ""; 
                            resolve(); 
                        }, 4000); // Tiempo para asimilar explicación
                    };
                    grid.appendChild(btn);
                });
            });

        case "br": // Respiración
            return new Promise(async (resolve) => {
                const circle = document.getElementById("breath-circle");
                circle.style.display = "flex";
                document.getElementById("breath-txt").innerText = b.tx[lang];
                
                let time = b.d;
                while (time > 0) {
                    document.getElementById("breath-timer").innerText = time-- + "s";
                    await new Promise(r => setTimeout(r, 1000));
                }
                circle.style.display = "none";
                resolve();
            });
    }
}

// Bucle de Acción (Palabras Flotantes)
function actionLoop() {
    if (gameMode === "action") {
        spawnWord(); 
    }
    requestAnimationFrame(actionLoop);
}

// Iniciar Sistema
window.onload = () => {
    updateHUD();
    actionLoop();
    setInterval(runMission, 45000); // Misión cada 45 segundos
    runMission(); // Primera misión inmediata
};
