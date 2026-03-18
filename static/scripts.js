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
    // Asegurar que los valores no bajen de cero ni suban de 100
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

/* MOTOR DE VOZ */
function playVoice(text){
    return new Promise(resolve => {
        speechSynthesis.cancel();
        if(skipFlag) return resolve(); 
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.9;
        msg.pitch = 0.8; // Un poco más profundo
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
    skipBtn.style.display = "block"; 
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
            label.innerText = b.voz_guia ? b.voz_guia[0] : "Inhala";
            playVoice(label.innerText);
            circle.style.transition = `transform ${b.tiempos.inhalar}s ease-in-out`;
            circle.style.transform = "scale(1.8)";
            await wait(b.tiempos.inhalar * 1000);
            
            if(skipFlag) break;
            label.innerText = b.voz_guia ? b.voz_guia[1] : "Retén";
            playVoice(label.innerText);
            await wait(b.tiempos.retener * 1000);
            
            if(skipFlag) break;
            label.innerText = b.voz_guia ? b.voz_guia[2] : "Exhala";
            playVoice(label.innerText);
            circle.style.transition = `transform ${b.tiempos.exhalar}s ease-in-out`;
            circle.style.transform = "scale(1)";
            await wait(b.tiempos.exhalar * 1000);
        }
        finishBlock();
    } 
    else if(["decision", "juego_mental", "acertijo"].includes(b.tipo)){
        skipBtn.style.display = "none"; 
        block.innerHTML = `<h3 style="margin-bottom:15px;">${b.pregunta}</h3>`;
        b.opciones.forEach((opt, i) => {
            let btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = opt;
            btn.onclick = async () => {
                const esCorrecto = i === b.correcta;
                block.innerHTML = `<p style="font-size:24px;">${esCorrecto ? "✅" : "❌"}</p><p>${b.explicacion}</p>`;
                if(esCorrecto){ userData.disciplina += 5; userData.claridad += 2; } 
                else { userData.calma += 2; userData.disciplina -= 2; }
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

/* EVENTO SALTAR (PENALIZACIÓN CRÍTICA) */
skipBtn.addEventListener("click", () => {
    skipFlag = true;
    speechSynthesis.cancel();
    if(activeInterval) clearInterval(activeInterval);
    
    // Penalización drástica: Pierde el 80% de su disciplina actual
    userData.disciplina = Math.floor(userData.disciplina * 0.2);
    userData.calma -= 5;
    
    updatePanel();
    
    // Feedback visual de la penalización
    block.innerHTML = `<p style="color:#ef4444; font-weight:bold;">DISCIPLINA QUEBRANTADA</p>
                       <p style="font-size:14px;">Saltar el entrenamiento debilita tu carácter.</p>`;
    
    playVoice("Disciplina quebrantada. El camino fácil no lleva a la cima.");
    
    setTimeout(() => {
        finishBlock();
    }, 2000);
});

/* EVENTOS DE FLUJO */
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    block.innerHTML = "Estableciendo conexión...";
    try {
        const res = await fetch("/session_content");
        const data = await res.json();
        let nextId = userData.lastSessionId + 1;
        sesionActualData = data.sesiones.find(s => s.id === nextId) || data.sesiones[0];
        bloques = sesionActualData.bloques;
        currentIdx = 0;
        
        let today = new Date().toDateString();
        if(userData.lastDay !== today){
            userData.streak++;
            userData.lastDay = today;
        }
        
        showBlock(bloques[currentIdx]);
    } catch (err) { block.innerHTML = "Error de sistema."; }
});

nextBtn.addEventListener("click", () => {
    currentIdx++;
    if(currentIdx < bloques.length){
        showBlock(bloques[currentIdx]);
    } else {
        block.innerHTML = `<h2>Sesión ${sesionActualData.id} Completada</h2>
                           <p>Has forjado tu mente un día más.</p>`;
        userData.lastSessionId = sesionActualData.id;
        userData.nivel = Math.floor(userData.disciplina / 20) + 1;
        updatePanel();
        restartBtn.style.display = "block";
        nextBtn.style.display = "none";
        skipBtn.style.display = "none";
    }
});

restartBtn.addEventListener("click", () => location.reload());
updatePanel();
