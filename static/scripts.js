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
    lastSessionId: 0 // Rastrea la última sesión completada
};

function updatePanel(){
    document.getElementById("streak").innerHTML = "🔥 Racha: " + userData.streak + " días";
    document.getElementById("level").innerHTML = "Nivel KaMiZen: " + userData.nivel;
    document.getElementById("disciplina-bar").style.width = Math.min(userData.disciplina, 100) + "%";
    document.getElementById("claridad-bar").style.width = Math.min(userData.claridad, 100) + "%";
    document.getElementById("calma-bar").style.width = Math.min(userData.calma, 100) + "%";
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}

function playVoice(text){
    return new Promise(resolve => {
        speechSynthesis.cancel();
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.95;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

async function showBlock(b){
    block.innerHTML = "";
    nextBtn.style.display = "none";
    document.body.style.background = b.color || "#020617";

    if(b.tipo === "respiracion"){
        block.innerHTML = `<p>${b.instrucciones || "Respira..."}</p><div class="breath-circle" id="circle"></div>`;
        const circle = document.getElementById("circle");
        await playVoice(b.voz_guia ? b.voz_guia.join(". ") : "Sigue el ritmo");
        
        let reps = b.repeticiones || 3;
        for(let i=0; i<reps; i++){
            circle.style.transition = `transform ${b.tiempos.inhalar}s ease-in-out`;
            circle.style.transform = "scale(1.8)";
            await new Promise(r => setTimeout(r, b.tiempos.inhalar * 1000));
            
            circle.style.transform = "scale(1.8)"; // Retener
            await new Promise(r => setTimeout(r, b.tiempos.retener * 1000));
            
            circle.style.transition = `transform ${b.tiempos.exhalar}s ease-in-out`;
            circle.style.transform = "scale(1)";
            await new Promise(r => setTimeout(r, b.tiempos.exhalar * 1000));
        }
        nextBtn.style.display = "block";
    } 
    else if(["decision", "juego_mental", "acertijo"].includes(b.tipo)){
        block.innerHTML = `<h3>${b.pregunta}</h3>`;
        b.opciones.forEach((opt, i) => {
            let btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = opt;
            btn.onclick = async () => {
                const esCorrecto = i === b.correcta;
                block.innerHTML = `<p>${esCorrecto ? "✅" : "❌"} ${b.explicacion}</p>`;
                userData.disciplina += esCorrecto ? 5 : 1;
                updatePanel();
                await playVoice(b.explicacion);
                nextBtn.style.display = "block";
            };
            block.appendChild(btn);
        });
        await playVoice(b.pregunta);
    }
    else {
        block.innerHTML = `<p>${b.texto || b.titulo || ""}</p>`;
        await playVoice(b.texto || b.titulo);
        nextBtn.style.display = "block";
    }
}

startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    const res = await fetch("/session_content");
    const data = await res.json();
    const sesiones = data.sesiones;

    // Lógica Secuencial: Buscar la siguiente sesión por ID
    let nextId = userData.lastSessionId + 1;
    let sesion = sesiones.find(s => s.id === nextId);

    // Si no existe (llegamos al final), volver a la sesión con el ID más bajo
    if(!sesion) {
        sesion = sesiones[0];
    }

    sesionActualData = sesion;
    bloques = sesion.bloques;
    currentIdx = 0;
    
    // Actualizar Racha
    let today = new Date().toDateString();
    if(userData.lastDay !== today){
        userData.streak++;
        userData.lastDay = today;
    }

    showBlock(bloques[currentIdx]);
});

nextBtn.addEventListener("click", () => {
    currentIdx++;
    if(currentIdx < bloques.length){
        showBlock(bloques[currentIdx]);
    } else {
        block.innerHTML = "<h2>Sesión Completada</h2><p>Tu mente está ahora más afilada.</p>";
        userData.lastSessionId = sesionActualData.id;
        userData.nivel = Math.floor(userData.disciplina / 20) + 1;
        updatePanel();
        restartBtn.style.display = "block";
        nextBtn.style.display = "none";
    }
});

restartBtn.addEventListener("click", () => location.reload());

updatePanel();
