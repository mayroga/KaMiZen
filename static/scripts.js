/* =================== VARIABLES PRINCIPALES =================== */
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let bloques = [];
let currentIdx = 0;
let sesionActualData = null;
let skipFlag = false;
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
    userData.disciplina = Math.max(0, Math.min(userData.disciplina, 100));
    userData.claridad = Math.max(0, Math.min(userData.claridad, 100));
    userData.calma = Math.max(0, Math.min(userData.calma, 100));

    document.getElementById("streak").innerHTML = "🔥 Racha: " + userData.streak + " días";
    document.getElementById("level").innerHTML = "Nivel KaMiZen: " + userData.nivel;
    document.getElementById("disciplina-bar").style.width = userData.disciplina + "%";
    document.getElementById("claridad-bar").style.width = userData.claridad + "%";
    document.getElementById("calma-bar").style.width = userData.calma + "%";
   
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}

/* MOTOR DE VOZ CON FAIL-SAFE */
function playVoice(text){
    return new Promise(resolve => {
        if (!text) return resolve();
        speechSynthesis.cancel();
       
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.9;
       
        const forceContinue = setTimeout(() => { resolve(); }, 3500);
        msg.onend = () => { clearTimeout(forceContinue); resolve(); };
        msg.onerror = () => { clearTimeout(forceContinue); resolve(); };

        speechSynthesis.speak(msg);
    });
}

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

/* =================== MOSTRAR BLOQUE =================== */
async function showBlock(b){
    if(!b) return;
    skipFlag = false;
    if(activeInterval) clearInterval(activeInterval);
   
    block.innerHTML = "";
    nextBtn.style.display = "none";
    skipBtn.style.display = "block";
    document.body.style.background = b.color || "#020617";

    if(b.tipo === "respiracion"){
        // Contenedor y globo
        block.innerHTML = `<p id="breath-objetivo">${b.objetivo || "Respira con atención"}</p>
                           <div class="breath-circle" id="circle"></div>
                           <p id="breath-label"></p>`;
        const circle = document.getElementById("circle");
        const label = document.getElementById("breath-label");
        const objetivo = document.getElementById("breath-objetivo");

        // Tamaño inicial pequeño (como exhalando)
        circle.style.width = "50px";
        circle.style.height = "50px";
        circle.style.borderRadius = "50%";
        circle.style.backgroundColor = "#60a5fa";
        circle.style.margin = "20px auto";
        circle.style.transition = "transform 2s ease-in-out";

        const reps = b.repeticiones || 3;

        for(let i=0; i<reps; i++){
            if(skipFlag) break;

            // INHALA
            label.innerText = b.voz_guia ? b.voz_guia[0] : "Inhala";
            await playVoice(label.innerText);
            circle.style.transform = "scale(1.8)";
            await wait(b.tiempos.inhalar*1000);

            if(skipFlag) break;

            // RETEN
            label.innerText = b.voz_guia ? b.voz_guia[1] : "Retén";
            await playVoice(label.innerText);
            circle.style.transform = "scale(1.8)";
            await wait(b.tiempos.retener*1000);

            if(skipFlag) break;

            // EXHALA
            label.innerText = b.voz_guia ? b.voz_guia[2] : "Exhala";
            await playVoice(label.innerText);
            circle.style.transform = "scale(1)";
            await wait(b.tiempos.exhalar*1000);
        }
        finishBlock();
    }
    else if(["decision", "juego_mental", "acertijo"].includes(b.tipo)){
        skipBtn.style.display = "none";
        block.innerHTML = `<h3>${b.pregunta}</h3>`;
        b.opciones.forEach((opt, i) => {
            let btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = opt;
            btn.onclick = async () => {
                const esCorrecto = i === b.correcta;
                block.innerHTML = `<p>${esCorrecto ? "✅" : "❌"}</p><p>${b.explicacion}</p>`;
                userData.disciplina += esCorrecto ? 5 : -2;
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
            if(timeLeft <= 0 || skipFlag) { clearInterval(activeInterval); finishBlock(); }
        }, 1000);
    }
    else {
        const contenido = b.texto || b.instrucciones || b.titulo;
        block.innerHTML = b.titulo ? `<h3>${b.titulo}</h3><p>${contenido}</p>` : `<p>${contenido}</p>`;
        await playVoice(contenido);
        if(!skipFlag) finishBlock();
    }
}

function finishBlock() {
    skipBtn.style.display = "none";
    nextBtn.style.display = "block";
}

skipBtn.addEventListener("click", () => {
    skipFlag = true;
    speechSynthesis.cancel();
    if(activeInterval) clearInterval(activeInterval);
    userData.disciplina = Math.floor(userData.disciplina * 0.2);
    updatePanel();
    block.innerHTML = `<p style="color:#ef4444;">DISCIPLINA QUEBRANTADA</p>`;
    setTimeout(() => { finishBlock(); }, 1000);
});

/* INICIO SEGURO */
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    block.innerHTML = "Sincronizando Mente...";

    try {
        const response = await fetch("/session_content");
        if(!response.ok) throw new Error("Error en red");
        const data = await response.json();

        let nextId = userData.lastSessionId + 1;
        sesionActualData = data.sesiones.find(s => s.id === nextId) || data.sesiones[0];
        bloques = sesionActualData.bloques;
        currentIdx = 0;

        let today = new Date().toDateString();
        if(userData.lastDay !== today){
            userData.streak++;
            userData.lastDay = today;
        }
        updatePanel();
        showBlock(bloques[currentIdx]);
    } catch (err) {
        console.error(err);
        block.innerHTML = "Error de conexión. Revisa el servidor.";
        startBtn.style.display = "block";
    }
});

nextBtn.addEventListener("click", () => {
    currentIdx++;
    if(currentIdx < bloques.length) {
        showBlock(bloques[currentIdx]);
    } else {
        block.innerHTML = `<h2>Mente Forjada</h2><p>Sesión ${sesionActualData.id} terminada.</p>`;
        userData.lastSessionId = sesionActualData.id;
        userData.nivel = Math.floor(userData.disciplina / 20) + 1;
        updatePanel();
        restartBtn.style.display = "block";
        nextBtn.style.display = "none";
    }
});

restartBtn.addEventListener("click", () => location.reload());
updatePanel();
