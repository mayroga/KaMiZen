const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let bloques = [];
let current = 0;
let puntos = 0;

let currentSessionIndex = 0;

let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0,
    lastDay: null,
    nivel: 1,
    disciplina: 40,
    claridad: 50,
    calma: 30
};

const streakEl = document.getElementById("streak");
const levelEl = document.getElementById("level");
const discBar = document.getElementById("disciplina-bar");
const clarBar = document.getElementById("claridad-bar");
const calmBar = document.getElementById("calma-bar");

function updatePanel(){

    streakEl.innerHTML = "🔥 Racha: " + userData.streak + " días";
    levelEl.innerHTML = "Nivel KaMiZen: " + userData.nivel;

    discBar.style.width = userData.disciplina + "%";
    clarBar.style.width = userData.claridad + "%";
    calmBar.style.width = userData.calma + "%";
}

updatePanel();


function updateStreak(){

    let today = new Date().toDateString();

    if(userData.lastDay !== today){

        userData.streak++;

        userData.lastDay = today;

    }

}


function playVoice(text){

    return new Promise(resolve=>{

        if(!text){

            resolve();

            return;

        }

        speechSynthesis.cancel();

        let msg = new SpeechSynthesisUtterance(text);

        msg.lang = "es-ES";

        msg.rate = 0.9;

        msg.onend = ()=>resolve();

        msg.onerror = ()=>resolve();

        speechSynthesis.speak(msg);

    });

}


function breathingAnimation(){

    let circle = document.createElement("div");

    circle.className = "breath-circle";

    block.appendChild(circle);

    let inhale = true;

    setInterval(()=>{

        circle.style.transform = inhale ? "scale(1.6)" : "scale(1)";

        inhale = !inhale;

    },4000);

}


function createOptions(b){

    if(!b.opciones) return;

    b.opciones.forEach((op,i)=>{

        let btn = document.createElement("button");

        btn.innerText = op;

        btn.onclick = ()=>{

            if(i === b.correcta){

                puntos += b.recompensa || 5;

                userData.disciplina += 2;
                userData.claridad += 2;

                alert(b.explicacion || "Correcto");

            }else{

                userData.calma += 1;

                alert(b.explicacion || "Respuesta");

            }

            updatePanel();

            nextBtn.style.display = "inline-block";

        };

        block.appendChild(btn);

    });

}


async function showBlock(b){

    block.innerHTML = "";

    nextBtn.style.display = "none";

    document.body.style.background = b.color || "#0f172a";

    if(b.texto){

        block.innerHTML = "<p>" + b.texto + "</p>";

        await playVoice(b.texto);

    }

    switch(b.tipo){

        case "decision":
        case "juego_mental":

            block.innerHTML = "<h3>" + (b.pregunta || "") + "</h3>";

            createOptions(b);

            await playVoice(b.pregunta);

            break;


        case "respiracion":

            breathingAnimation();

            await playVoice(b.instrucciones || b.texto);

            setTimeout(()=>{

                nextBtn.style.display = "inline-block";

            },8000);

            return;


        case "recompensa":

            userData.disciplina += 3;
            userData.claridad += 3;
            userData.calma += 3;

            block.innerHTML = "<h2>" + b.texto + "</h2>";

            await playVoice(b.texto);

            break;


        case "cierre":

            updateStreak();

            puntos += 10;

            if(puntos > 50){

                userData.nivel++;

            }

            let completed = JSON.parse(
                localStorage.getItem("completedSessions")
            ) || [];

            completed.push(currentSessionIndex);

            localStorage.setItem(
                "completedSessions",
                JSON.stringify(completed)
            );

            localStorage.setItem(
                "kamizenData",
                JSON.stringify(userData)
            );

            updatePanel();

            restartBtn.style.display = "inline-block";

            await playVoice(b.texto);

            return;

    }

    setTimeout(()=>{

        nextBtn.style.display = "inline-block";

    },2000);

}



function nextBlock(){

    nextBtn.style.display = "none";

    current++;

    if(current < bloques.length){

        showBlock(bloques[current]);

    }else{

        restartBtn.style.display = "inline-block";

    }

}



startBtn.addEventListener("click", async ()=>{

    startBtn.style.display = "none";

    const res = await fetch("/session_content");

    const data = await res.json();

    const sesiones = data.sesiones || [];

    let completed =
        JSON.parse(
            localStorage.getItem("completedSessions")
        ) || [];

    let availableIndices =
        sesiones
        .map((_,i)=>i)
        .filter(i => !completed.includes(i));

    if(availableIndices.length === 0){

        localStorage.removeItem("completedSessions");

        availableIndices = sesiones.map((_,i)=>i);

    }

    currentSessionIndex =
        availableIndices[
            Math.floor(Math.random() * availableIndices.length)
        ];

    bloques = sesiones[currentSessionIndex].bloques || [];

    current = 0;

    updateStreak();

    showBlock(bloques[0]);

});


nextBtn.addEventListener("click", nextBlock);

restartBtn.addEventListener(
    "click",
    ()=>location.reload()
);
