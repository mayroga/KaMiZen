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

/* RESPIRACION CON VOZ Y GLOBO REALISTA */
async function breathingAnimation(){
    block.innerHTML = "";
    let circle = document.createElement("div");
    circle.className = "breath-circle";
    circle.style.transform = "scale(0.5)"; // siempre comienza pequeño
    circle.style.transition = "transform 3s ease-in-out";
    block.appendChild(circle);

    let fases = [
        {t:"Inhala", scale:1.6},
        {t:"Retiene", scale:1.6},
        {t:"Exhala", scale:0.5},
        {t:"Retiene", scale:0.5}
    ];

    for(let i=0; i<8; i++){
        let f = fases[i%4];
        circle.style.transform = "scale("+f.scale+")";
        await playVoice(f.t);
        // esperar 3 segundos para dar sensación de respiración lenta y real
        await new Promise(r=>setTimeout(r,3000));
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
            await breathingAnimation();
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
