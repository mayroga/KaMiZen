const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const prevBtn = document.getElementById("prev-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");
const warningEl = document.getElementById("warning");

let bloques = [];
let current = 0;
let puntos = 0;
let bloqueTimer = null;

/* DATOS USUARIO */
let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0,
    lastDay: null,
    nivel: 1,
    disciplina: 40,
    claridad: 50,
    calma: 30
};

/* PANEL */
const streakEl = document.getElementById("streak");
const levelEl = document.getElementById("level");
const discBar = document.getElementById("disciplina-bar");
const clarBar = document.getElementById("claridad-bar");
const calmBar = document.getElementById("calma-bar");

function updatePanel(){
    streakEl.innerHTML = "🔥 Racha: "+userData.streak+" días";
    levelEl.innerHTML = "Nivel KaMiZen: "+userData.nivel;
    discBar.style.width = userData.disciplina+"%";
    clarBar.style.width = userData.claridad+"%";
    calmBar.style.width = userData.calma+"%";
}
updatePanel();

/* RACHA DIARIA */
function updateStreak(){
    let today = new Date().toDateString();
    if(userData.lastDay !== today){
        userData.streak += 1;
        userData.lastDay = today;
    }
}

/* VOZ */
function playVoice(text){
    return new Promise(resolve=>{
        speechSynthesis.cancel();
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.9;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* RESPIRACION */
function breathingAnimation(instrucciones){
    block.innerHTML = `<div class="breath-circle"></div><p>${instrucciones}</p>`;
    let circle = document.querySelector(".breath-circle");
    let inhale=true;
    clearInterval(bloqueTimer);
    bloqueTimer = setInterval(()=>{
        circle.style.transform = inhale ? "scale(1.6)" : "scale(1)";
        inhale = !inhale;
    },4000);
}

/* OPCIONES */
function createOptions(b){
    b.opciones.forEach((op,i)=>{
        let btn = document.createElement("button");
        btn.innerText = op;
        btn.onclick = async ()=>{
            if(i === b.correcta){
                puntos += b.recompensa||5;
                userData.disciplina += 2;
                userData.claridad += 2;
                warningEl.style.display="none";
                alert("✅ Correcto: "+b.explicacion);
            } else {
                userData.calma += 1;
                alert("❌ Respuesta: "+b.explicacion);
            }
            updatePanel();
            nextBtn.style.display = "inline-block";
        };
        block.appendChild(btn);
    });
}

/* BLOQUE */
async function showBlock(b){
    clearInterval(bloqueTimer);
    block.innerHTML = "";
    document.body.style.background = b.color||"#0f172a";
    nextBtn.style.display="none";
    prevBtn.style.display=current>0 ? "inline-block" : "none";
    warningEl.style.display="none";

    // Completar texto faltante
    if(b.texto===undefined) b.texto = "Reflexiona sobre este bloque.";
    if(b.pregunta===undefined) b.pregunta = "Decide tu respuesta.";
    if(!b.opciones) b.opciones = ["Opción 1","Opción 2"];
    if(b.correcta===undefined) b.correcta = 0;
    if(b.recompensa===undefined) b.recompensa = 5;
    if(!b.color) b.color = "#0f172a";

    // Mostrar y hablar
    if(b.tipo==="voz" || b.tipo==="historia" || b.tipo==="reflexion" || b.tipo==="recompensa" || b.tipo==="tvid"){
        block.innerHTML="<p>"+b.texto+"</p>";
        await playVoice(b.texto);
        nextBtn.style.display="inline-block";
    }

    switch(b.tipo){
        case "respiracion":
            breathingAnimation(b.instrucciones || "Inhala, retén, exhala.");
            await playVoice(b.texto);
            setTimeout(()=>{ nextBtn.style.display = "inline-block"; },(b.repeticiones||5)*4000*2);
            break;
        case "decision":
        case "quiz":
        case "acertijo":
        case "juego_mental":
            block.innerHTML = "<h3>"+b.pregunta+"</h3>";
            createOptions(b);
            await playVoice(b.pregunta);
            break;
        case "cierre":
            updateStreak();
            puntos += 10;
            if(puntos > 50) userData.nivel +=1;

            // Guardar sesión completada
            let completed = JSON.parse(localStorage.getItem("completedSessions")) || [];
            completed.push(currentSessionIndex);
            localStorage.setItem("completedSessions", JSON.stringify(completed));

            localStorage.setItem("kamizenData", JSON.stringify(userData));
            updatePanel();
            restartBtn.style.display="inline-block";
            await playVoice(b.texto);
            break;
    }
}

/* SIGUIENTE */
function nextBlock(){
    // Penalización si pasa demasiado rápido
    if(bloqueTimer){
        userData.disciplina = Math.max(0,userData.disciplina*0.2);
        warningEl.style.display="block";
        document.body.style.background="#b91c1c"; // rojo
    }

    current++;
    if(current < bloques.length){
        showBlock(bloques[current]);
    } else {
        restartBtn.style.display="inline-block";
    }
}

/* REGRESAR */
function prevBlock(){
    if(current>0){
        current--;
        showBlock(bloques[current]);
    }
}

/* INICIO */
let currentSessionIndex = 0;

startBtn.addEventListener("click", async ()=>{
    startBtn.style.display="none";

    const res = await fetch("/session_content");
    const data = await res.json();
    const sesiones = data.sesiones;

    // Recuperar sesiones completadas
    let completed = JSON.parse(localStorage.getItem("completedSessions")) || [];

    // Filtrar sesiones no completadas
    let availableIndices = sesiones.map((_,i)=>i).filter(i => !completed.includes(i));

    if(availableIndices.length === 0){
        localStorage.removeItem("completedSessions");
        availableIndices = sesiones.map((_,i)=>i);
    }

    // Elegir sesión aleatoria
    currentSessionIndex = availableIndices[Math.floor(Math.random()*availableIndices.length)];
    bloques = sesiones[currentSessionIndex].bloques;
    current = 0;

    updateStreak();
    showBlock(bloques[0]);
});

nextBtn.addEventListener("click", nextBlock);
prevBtn.addEventListener("click", prevBlock);
restartBtn.addEventListener("click", ()=>location.reload());
