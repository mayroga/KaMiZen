const startBtn = document.getElementById("start-btn"); 
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");
const forwardBtn = document.getElementById("forward-btn");
const block = document.getElementById("block");

let bloques = [];
let current = 0;
let puntos = 0;

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
    if(userData.disciplina < 0) userData.disciplina = 0;
    if(userData.claridad < 0) userData.claridad = 0;
    streakEl.innerHTML = "🔥 Racha: "+userData.streak+" días";
    levelEl.innerHTML = "Nivel KaMiZen: "+userData.nivel;
    discBar.style.width = userData.disciplina+"%";
    clarBar.style.width = userData.claridad+"%";
    calmBar.style.width = userData.calma+"%";
}
updatePanel();

/* CASTIGO */
function penalizar(){
    userData.disciplina = Math.floor(userData.disciplina * 0.8);
    userData.claridad = Math.floor(userData.claridad * 0.1);
    alert("⚠ No debes adelantar o retroceder.\nDisciplina y claridad reducidas");
    updatePanel();
}

/* RACHA */
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
        if(!text) text = "En la siguiente sesión lo harás mejor. Siente poder, éxito y bienestar.";
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-ES";
        msg.rate = 0.9;
        msg.onend = resolve;
        speechSynthesis.speak(msg);
    });
}

/* RESPIRACION PROFESIONAL CON GLOBO AZUL */
async function breathingAnimation(mandoText){
    block.innerHTML = "";

    // Mostrar el globo azul
    let circle = document.createElement("div");
    circle.className = "breath-circle";
    circle.style.width = "50px";
    circle.style.height = "50px";
    circle.style.background = "#3b82f6";
    circle.style.borderRadius = "50%";
    circle.style.margin = "50px auto";
    circle.style.transition = "transform 3s ease-in-out";
    block.appendChild(circle);

    // Mostrar el texto del mando en pantalla
    let instruction = document.createElement("p");
    instruction.style.textAlign = "center";
    instruction.style.fontSize = "1.2em";
    instruction.style.color = "#ffffff";
    instruction.style.marginTop = "20px";
    instruction.innerText = mandoText || "Inhala y exhala con calma";
    block.appendChild(instruction);

    // Fases de respiración: Inhala, Retiene, Exhala, Retiene
    let fases = [
        {t:"Inhala", scale:2.0},
        {t:"Retiene", scale:2.0},
        {t:"Exhala", scale:0.5},
        {t:"Retiene", scale:0.5}
    ];

    // Hacer 4 ciclos de respiración (modificable)
    for(let i=0; i<4; i++){
        for(let f of fases){
            // Animación del globo
            circle.style.transform = `scale(${f.scale})`;
            // Texto dinámico del mando
            instruction.innerText = `${f.t} - ${mandoText || ""}`;
            await playVoice(`${f.t} - ${mandoText || ""}`);
            await new Promise(r=>setTimeout(r,3000));
        }
    }
}

/* OPCIONES */
function createOptions(b){
    if(!b.opciones) return;
    b.opciones.forEach((op,i)=>{
        let btn = document.createElement("button");
        btn.innerText = op;
        btn.onclick = ()=>{
            if(i === b.correcta){
                puntos += b.recompensa||5;
                userData.disciplina += 2;
                userData.claridad += 2;
                alert("Correcto");
            }else{
                userData.calma += 1;
                alert("Respuesta: "+(b.explicacion||"En la siguiente sesión lo harás mejor. Siente poder, éxito y bienestar."));
            }
            updatePanel();
            nextBtn.style.display = "inline-block";
        };
        block.appendChild(btn);
    });
}

/* BLOQUE */
async function showBlock(b){
    block.innerHTML = "";
    document.body.style.background = b.color||"#0f172a";

    if(b.texto){
        block.innerHTML = "<p>"+b.texto+"</p>";
        await playVoice(b.texto);
    }

    switch(b.tipo){
        case "quiz":
        case "acertijo":
        case "decision":
        case "juego_mental":
            block.innerHTML = "<h3>"+(b.pregunta||"En la siguiente sesión lo harás mejor. Siente poder, éxito y bienestar.")+"</h3>";
            createOptions(b);
            await playVoice(b.pregunta);
            break;

        case "respiracion":
            await breathingAnimation(b.texto);
            nextBtn.style.display = "inline-block";
            return;

        case "recompensa":
            userData.disciplina+=3;
            userData.claridad+=3;
            userData.calma+=3;
            block.innerHTML="<h2>"+b.texto+"</h2>";
            await playVoice(b.texto);
            break;

        case "cierre":
            updateStreak();
            puntos += 10;
            if(puntos > 50) userData.nivel +=1;
            localStorage.setItem("kamizenData", JSON.stringify(userData));
            updatePanel();
            restartBtn.style.display="inline-block";
            await playVoice(b.texto);
            return;
    }

    setTimeout(()=>{ nextBtn.style.display="inline-block"; },3000);
}

/* SIGUIENTE */
function nextBlock(){
    nextBtn.style.display="none";
    current++;
    if(current < bloques.length){
        showBlock(bloques[current]);
    }
}

/* ATRAS */
function backBlock(){
    penalizar();
    if(current>0){
        current--;
        showBlock(bloques[current]);
    }
}

/* ADELANTE */
function forwardBlock(){
    penalizar();
    if(current<bloques.length-1){
        current++;
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
    currentSessionIndex = Math.floor(Math.random()*sesiones.length);
    bloques = sesiones[currentSessionIndex].bloques;
    current=0;
    updateStreak();
    showBlock(bloques[0]);
});

nextBtn.addEventListener("click", nextBlock);
backBtn.addEventListener("click", backBlock);
forwardBtn.addEventListener("click", forwardBlock);
restartBtn.addEventListener("click", ()=>location.reload());
