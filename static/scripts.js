const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let fileIdx = 0;
let sesionIdx = 0;

let bloques = [];
let i = 0;

const MAX = 10;



function playVoice(t) {

    return new Promise(r => {

        speechSynthesis.cancel();

        let m = new SpeechSynthesisUtterance(t);

        m.lang = "es-ES";

        m.onend = r;

        speechSynthesis.speak(m);

    });

}



function breathing(sec = 20) {

    block.innerHTML = "";

    let c = document.createElement("div");

    c.className = "breath-circle";

    block.appendChild(c);

    let b = true;

    let inter = setInterval(() => {

        c.style.transform =
            b ? "scale(1.6)" : "scale(1)";

        b = !b;

    }, 4000);

    setTimeout(() => {

        clearInterval(inter);

        nextBtn.style.display = "block";

    }, sec * 1000);

}



async function show(b) {

    nextBtn.style.display = "none";
    restartBtn.style.display = "none";

    block.innerHTML = "";

    if (!b) {

        restartBtn.style.display = "block";

        return;

    }

    let t = b.texto || "";



    if (b.tipo === "respiracion") {

        block.innerHTML = t;

        await playVoice(t);

        breathing(b.duracion || 20);

        return;

    }



    if (b.tipo === "quiz" ||
        b.tipo === "decision" ||
        b.tipo === "juego_mental") {

        block.innerHTML = "<h3>" + b.pregunta + "</h3>";

        await playVoice(b.pregunta);

        b.opciones.forEach((o, k) => {

            let btn = document.createElement("button");

            btn.innerText = o;

            btn.onclick = () => {

                nextBtn.style.display = "block";

            };

            block.appendChild(btn);

        });

        return;

    }



    if (b.tipo === "cierre") {

        block.innerHTML = t;

        await playVoice(t);

        restartBtn.style.display = "block";

        return;

    }



    block.innerHTML = t;

    if (t) {

        await playVoice(t);

    }

    nextBtn.style.display = "block";

}



function next() {

    i++;

    if (i < bloques.length) {

        show(bloques[i]);

    } else {

        nextSession();

    }

}



function nextSession() {

    sesionIdx++;

    if (sesionIdx >= MAX) {

        sesionIdx = 0;
        fileIdx++;

    }

    load();

}



async function load() {

    block.innerHTML = "Cargando...";

    let r = await fetch(
        `/session_content?file_idx=${fileIdx}&sesion_idx=${sesionIdx}`
    );

    let d = await r.json();

    bloques = d.bloques;

    i = 0;

    show(bloques[0]);

}



startBtn.onclick = () => {

    startBtn.style.display = "none";

    load();

};

nextBtn.onclick = next;

restartBtn.onclick = () => location.reload();
