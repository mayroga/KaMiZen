const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let bloques = [];
let currentIdx = 0;
let sesionActualData = null;

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
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.9; // Velocidad con peso profesional
        msg.pitch = 0.9; // Tono más serio
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* LÓGICA DE BLOQUES */
async function showBlock(b){
    block.innerHTML = "";
    nextBtn.style.display = "none";
    document.body.style.background = b.color || "#020617";

    if(b.tipo === "respiracion"){
        block.innerHTML = `<p style="margin-bottom:10px;">${b.instrucciones}</p>
                           <div class="breath-circle" id="circle"></div>
                           <p id="breath-label" style="font-size:16px; margin-top:10px; opacity:0.8;"></p>`;
        
        const circle = document.getElementById("circle");
        const label = document.getElementById("breath-label");
        const reps = b.repeticiones || 3;

        for(let i=0; i < reps; i++){
            // 1. INHALAR
            label.innerText = b.voz_guia ? b.voz_guia[0] : "Inhala";
            playVoice(label.innerText);
            circle.style.transition = `transform ${b.tiempos.inhalar}s ease-in-out`;
            circle.style.transform = "scale(1.8)";
            await new Promise(r => setTimeout(r, b.tiempos.inhalar * 1000));
            
            // 2. RETENER
            label.innerText = b.voz_guia ? b.voz_guia[1] : "Retén";
            playVoice(label.innerText);
            // Sin cambio de escala, solo pausa
            await new Promise(r => setTimeout(r, b.tiempos.retener * 1000));
            
            // 3. EXHALAR
            label.innerText = b.voz_guia ? b.voz_guia[2] : "Exhala";
            playVoice(label.innerText);
            circle.style.transition = `transform ${b.tiempos.exhalar}s ease-in-out`;
            circle.style.transform = "scale(1)";
            await new Promise(r => setTimeout(r, b.tiempos.exhalar * 1000));
        }
        
        label.innerText = "Ciclo completado.";
        nextBtn.style.display = "block";
    } 
    else if(["decision", "juego_mental", "acertijo"].includes(b.tipo)){
        block.innerHTML = `<h3 style="margin-bottom:15px;">${b.pregunta}</h3>`;
        b.opciones.forEach((opt, i) => {
            let btn = document.createElement("button");
            btn.className = "option-btn";
            btn.style.background = "#1e293b";
            btn.innerText = opt;
            btn.onclick = async () => {
                const esCorrecto = i === b.correcta;
                block.innerHTML = `<p style="font-size:24px;">${esCorrecto ? "✅" : "❌"}</p>
                                   <p>${b.explicacion}</p>`;
                
                // Actualizar stats según resultado
                if(esCorrecto){
                    userData.disciplina += 5;
                    userData.claridad += 3;
                } else {
                    userData.calma += 2;
                }
                
                updatePanel();
                await playVoice(b.explicacion);
                nextBtn.style.display = "block";
            };
            block.appendChild(btn);
        });
        await playVoice(b.pregunta);
    }
    else if(b.tipo === "ejercicio_fisico"){
        block.innerHTML = `<h3>Acción Física</h3><p>${b.texto}</p><h2 id="timer">${b.duracion}s</h2>`;
        await playVoice(b.texto);
        let timeLeft = b.duracion;
        const timerInterval = setInterval(() => {
            timeLeft--;
            document.getElementById("timer").innerText = timeLeft + "s";
            if(timeLeft <= 0){
                clearInterval(timerInterval);
                nextBtn.style.display = "block";
            }
        }, 1000);
    }
    else {
        // Tipos: voz, historia, reflexion
        block.innerHTML = b.titulo ? `<h3>${b.titulo}</h3><p>${b.texto}</p>` : `<p>${b.texto}</p>`;
        await playVoice(b.texto || b.titulo);
        nextBtn.style.display = "block";
    }
}

/* EVENTOS PRINCIPALES */
startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    block.innerHTML = "Cargando sesión...";

    try {
        const res = await fetch("/session_content");
        const data = await res.json();
        const sesiones = data.sesiones;

        // Lógica Secuencial Estricta (1 al 125)
        let nextId = userData.lastSessionId + 1;
        let sesion = sesiones.find(s => s.id === nextId);

        // Si se acaba la lista (ej. terminaste la 125), vuelve a la 1
        if(!sesion) {
            sesion = sesiones[0];
            userData.lastSessionId = 0; // Reinicio de contador
        }

        sesionActualData = sesion;
        bloques = sesion.bloques;
        currentIdx = 0;
        
        // Racha Diaria
        let today = new Date().toDateString();
        if(userData.lastDay !== today){
            userData.streak++;
            userData.lastDay = today;
        }

        showBlock(bloques[currentIdx]);
    } catch (err) {
        block.innerHTML = "Error al conectar con el servidor.";
        startBtn.style.display = "block";
    }
});

nextBtn.addEventListener("click", () => {
    currentIdx++;
    if(currentIdx < bloques.length){
        showBlock(bloques[currentIdx]);
    } else {
        block.innerHTML = `<h2>Sesión ${sesionActualData.id} Completada</h2>
                           <p>Tu disciplina ha subido. El legado continúa.</p>`;
        userData.lastSessionId = sesionActualData.id;
        // Subir nivel cada 50 puntos de disciplina
        userData.nivel = Math.floor(userData.disciplina / 50) + 1;
        updatePanel();
        restartBtn.style.display = "block";
        nextBtn.style.display = "none";
    }
});

restartBtn.addEventListener("click", () => location.reload());

// Inicialización de UI
updatePanel();
