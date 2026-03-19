const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");

let fileIdx = 0;
let sesionIdx = 0;

let bloques = [];
let i = 0;

const MAX = 10;


// =========================
// VOZ
// =========================

function speak(t) {

    return new Promise(r => {

        speechSynthesis.cancel();

        let m = new SpeechSynthesisUtterance(t);

        m.lang = "es-ES";

        m.onend = r;

        speechSynthesis.speak(m);

    });

}


// =========================
// RESPIRACION
// =========================

function respirar(sec) {

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


// =========================
// MOSTRAR BLOQUE UNIVERSAL
// =========================

async function show(b) {

    nextBtn.style.display = "none";
    restartBtn.style.display = "none";

    block.innerHTML = "";

    if (!b) {

        restartBtn.style.display = "block";
        return;

    }

    if (b.color) {

        document.body.style.background = b.color;

    }

    // TEXTO

    if (b.texto) {

        block.innerHTML += `<p>${b.texto}</p>`;

        await speak(b.texto);

    }

    // PREGUNTA

    if (b.pregunta) {

        block.innerHTML += `<h3>${b.pregunta}</h3>`;

        await speak(b.pregunta);

    }

    // OPCIONES

    if (b.opciones) {

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

    // RESPIRACION

    if (b.duracion) {

        respirar(b.duracion);

        return;
    }

    // CIERRE

    if (b.tipo === "cierre") {

        restartBtn.style.display = "block";

        return;
    }

    nextBtn.style.display = "block";

}


// =========================
// NEXT BLOQUE
// =========================

function next() {

    i++;

    if (i < bloques.length) {

        show(bloques[i]);

    } else {

        nextSession();

    }

}


// =========================
// NEXT SESSION
// =========================

function nextSession() {

    sesionIdx++;

    if (sesionIdx >= MAX) {

        sesionIdx = 0;
        fileIdx++;

    }

    load();

}


// =========================
// LOAD SESSION
// =========================

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


// =========================
// BOTONES
// =========================

startBtn.onclick = () => {

    startBtn.style.display = "none";

    load();

};

nextBtn.onclick = next;

restartBtn.onclick = () => location.reload();
