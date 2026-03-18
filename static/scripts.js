const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let bloques = [];
let currentIdx = 0;
let sesionActualData = null;
let skipFlag = false; // Interruptor para saltar
let activeInterval = null;

/* PERSISTENCIA DE DATOS */
let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0,
    lastDay: null,
    nivel: 1,
    disciplina: 40,
    claridad: 50,
    calma: 30,
    lastSessionId: 0 
};

function updatePanel(){
    document.getElementById("streak").innerHTML = "🔥 Racha: " + userData.streak + " días";
    document.getElementById("level").innerHTML = "Nivel KaMiZen: " + userData.nivel;
    document.getElementById("disciplina-bar").style.width = Math.min(userData.disciplina, 100) + "%";
    document.getElementById("claridad-bar").style.width = Math.min(userData.claridad, 100) + "%";
    document.getElementById("calma-bar").style.width = Math.min(userData.calma, 100) + "%";
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}

/* MOTOR DE VOZ */
function playVoice(text){
    return new Promise(resolve => {
        speechSynthesis.cancel();
        if(skipFlag) return resolve(); // No hablar si estamos saltando
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.9;
        msg.pitch = 0.9;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* FUNCION DE ESPERA INTERRUMPIBLE */
function wait(ms) {
    return new Promise(resolve => {
        const start = Date.now();
        const check = setInterval(() => {
            if (Date.now() - start >= ms || skipFlag) {
                clearInterval(check);
                resolve();
            }
        }, 50);
    });
}

/* LÓGICA DE BLOQUES */
async function showBlock(b){
    skipFlag = false;
    if(activeInterval) clearInterval(activeInterval);
    
    block.innerHTML = "";
    nextBtn.style.display = "none";
    skipBtn.style.display = "block"; // Mostrar siempre el botón saltar
    document.body.style.background = b.color || "#020617";

    if(b.tipo === "respiracion"){
        block.innerHTML = `<p style="margin-bottom:10px;">${b.instrucciones}</p>
                           <div class="breath-circle" id="circle"></div>
                           <p id="breath-label" style="font-size:16px; margin-top:10px; opacity:0.8;"></p>`;
        
        const circle = document.getElementById("circle");
        const label = document.getElementById("breath-label");
        const reps = b.repeticiones || 3;

        for(let i=0; i < reps; i++){
            if(skipFlag) break;

            // 1. INHALAR
            label.innerText = b.voz_guia ? b.voz_guia[0] : "Inhala";
            playVoice(label.innerText);
            circle.style.transition = `transform ${b.tiempos.inhalar}s ease-in-out`;
            circle.style.transform = "scale(1.8)";
            await wait(b.tiempos.inhalar * 1000);
            
            if(skipFlag) break;

            // 2. RETENER
            label.innerText = b.voz_guia ? b.voz_guia[1] : "Retén";
            playVoice(label.innerText);
            await wait(b.tiempos.retener * 1000);
            
            if(skipFlag) break;

            // 3. EXHALAR
            label.innerText = b.voz_guia ? b.voz_guia[2] : "Exhala";
            playVoice(label.innerText);
            circle.style.transition = `transform ${b.tiempos.exhalar}s ease-in-out`;
            circle.style.transform = "scale(1)";
            await wait(b.tiempos.exhalar * 1000);
        }
        finishBlock();
    } 
    else if(["decision", "juego_mental", "acertijo"].includes(b.tipo)){
        skipBtn.style.display = "none"; // En decisiones no se salta, hay que elegir
        block.innerHTML = `<h3 style="margin-bottom:15px;">${b.pregunta}</h3>`;
        b.opciones.forEach((opt, i) => {
            let btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = opt;
            btn.onclick = async () => {
                const esCorrecto = i === b.correcta;
                block.innerHTML = `<p style="font-size:24px;">${esCorrecto ? "✅" : "❌"}</p><p>${b.explicacion}</p>`;
                if(esCorrecto){ userData.disciplina += 5; } else { userData.calma += 2; }
                updatePanel();
                await playVoice(b.explicacion);
                finishBlock();
            };
            block.appendChild(btn);
        });
        await playVoice(b.pregunta);
    }
    else if(b.tipo === "ejercicio_fisico"){
        block.innerHTML = `<h3>Acción Física</h3><p>${b.texto}</p><h2 id="timer">${b.duracion}s</h2>`;
        playVoice(b.texto);
        let timeLeft = b.duracion;
        activeInterval = setInterval(() => {
            timeLeft--;
            if(document.getElementById("timer")) document.getElementById("timer").innerText = timeLeft + "s";
            if(timeLeft <= 0 || skipFlag){
                clearInterval(activeInterval);
                finishBlock();
            }
        }, 1000);
    }
    else {
        block.innerHTML = b.titulo ? `<h3>${b.titulo}</h3><p>${b.texto}</p>` : `<p>${b.texto}</p>`;
        playVoice(b.texto || b.titulo).then(() => {
            if(!skipFlag) finishBlock();
        });
    }
}

function finishBlock() {
    skipBtn.style.display = "none";
    nextBtn.style.display = "block";
}

/* EVENTOS */
skipBtn.addEventListener("click", () => {
    skipFlag = true;
    speechSynthesis.cancel();
    if(activeInterval) clearInterval(activeInterval);
    finishBlock();
});

startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    block.innerHTML = "Cargando...";
    try {
        const res = await fetch("/session_content");
        const data = await res.json();
        let nextId = userData.lastSessionId + 1;
        sesionActualData = data.sesiones.find(s => s.id === nextId) || data.sesiones[0];
        bloques = sesionActualData.bloques;
        currentIdx = 0;
        showBlock(bloques[currentIdx]);
    } catch (err) { block.innerHTML = "Error de conexión."; }
});

nextBtn.addEventListener("click", () => {
    currentIdx++;
    if(currentIdx < bloques.length){
        showBlock(bloques[currentIdx]);
    } else {
        block.innerHTML = `<h2>Sesión ${sesionActualData.id} Completada</h2>`;
        userData.lastSessionId = sesionActualData.id;
        updatePanel();
        restartBtn.style.display = "block";
        nextBtn.style.display = "none";
        skipBtn.style.display = "none";
    }
});

restartBtn.addEventListener("click", () => location.reload());
updatePanel();
