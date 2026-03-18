const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");
const block = document.getElementById("block");

let bloques = [];
let currentIdx = 0;
let sesionActualData = null;
let skipFlag = false;
let activeInterval = null;


/* =========================
PERSISTENCIA
========================= */

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

    document.getElementById("streak").innerHTML =
        "🔥 Racha: " + userData.streak + " días";

    document.getElementById("level").innerHTML =
        "Nivel KaMiZen: " + userData.nivel;

    document.getElementById("disciplina-bar").style.width =
        userData.disciplina + "%";

    document.getElementById("claridad-bar").style.width =
        userData.claridad + "%";

    document.getElementById("calma-bar").style.width =
        userData.calma + "%";

    localStorage.setItem("kamizenData", JSON.stringify(userData));

}


/* =========================
VOZ
========================= */

function playVoice(text){

    return new Promise(resolve => {

        speechSynthesis.cancel();

        if(skipFlag) return resolve();

        let msg = new SpeechSynthesisUtterance(text);

        msg.lang = "es-ES";

        msg.rate = 0.9;

        msg.pitch = 0.8;

        msg.onend = resolve;

        speechSynthesis.speak(msg);

    });

}


/* =========================
WAIT
========================= */

function wait(ms){

    return new Promise(resolve => {

        const start = Date.now();

        const check = setInterval(() => {

            if(Date.now() - start >= ms || skipFlag){

                clearInterval(check);

                resolve();

            }

        }, 50);

    });

}


/* =========================
MOSTRAR BLOQUE
========================= */

async function showBlock(b){

    skipFlag = false;

    if(activeInterval) clearInterval(activeInterval);

    block.innerHTML = "";

    nextBtn.style.display = "none";

    skipBtn.style.display = "block";

    if(currentIdx > 0){

        backBtn.style.display = "block";

    } else {

        backBtn.style.display = "none";

    }

    document.body.style.background =
        b.color || "#020617";


    if(b.tipo === "respiracion"){

        block.innerHTML =
            "<p>" + b.instrucciones + "</p>" +
            "<div class='breath-circle' id='circle'></div>" +
            "<p id='breath-label'></p>";

        const circle = document.getElementById("circle");

        const label = document.getElementById("breath-label");

        const reps = b.repeticiones || 3;

        for(let i=0;i<reps;i++){

            if(skipFlag) break;

            label.innerText = "Inhala";

            playVoice("Inhala");

            circle.style.transform = "scale(1.8)";

            await wait(3000);

            if(skipFlag) break;

            label.innerText = "Exhala";

            playVoice("Exhala");

            circle.style.transform = "scale(1)";

            await wait(3000);

        }

        finishBlock();

    }

    else{

        block.innerHTML =
            b.texto
            ? "<p>" + b.texto + "</p>"
            : "<p>" + b.titulo + "</p>";

        await playVoice(b.texto || b.titulo);

        finishBlock();

    }

}


function finishBlock(){

    skipBtn.style.display = "none";

    nextBtn.style.display = "block";

}


/* =========================
ATRAS
========================= */

backBtn.addEventListener("click", () => {

    if(currentIdx > 0){

        currentIdx--;

        showBlock(bloques[currentIdx]);

    }

});


/* =========================
SIGUIENTE
========================= */

nextBtn.addEventListener("click", () => {

    currentIdx++;

    if(currentIdx < bloques.length){

        showBlock(bloques[currentIdx]);

    } else {

        block.innerHTML =
            "<h2>Sesión completada</h2>";

        restartBtn.style.display = "block";

        nextBtn.style.display = "none";

        skipBtn.style.display = "none";

        backBtn.style.display = "none";

    }

});


/* =========================
INICIAR
========================= */

startBtn.addEventListener("click", async () => {

    startBtn.style.display = "none";

    backBtn.style.display = "none";

    block.innerHTML = "Cargando...";

    const res = await fetch("/session_content");

    const data = await res.json();

    sesionActualData = data.sesiones[0];

    bloques = sesionActualData.bloques;

    currentIdx = 0;

    showBlock(bloques[0]);

});


restartBtn.addEventListener("click", () => location.reload());

updatePanel();
