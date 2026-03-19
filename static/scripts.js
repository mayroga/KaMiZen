const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn");
const block = document.getElementById("block");

let bloques = [];
let currentIdx = 0;
let skipFlag = false;

// Datos de Usuario (Persistencia)
let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    disciplina: 50, claridad: 50, calma: 50, streak: 0
};

function updatePanel() {
    document.getElementById("disciplina-bar").style.width = userData.disciplina + "%";
    document.getElementById("claridad-bar").style.width = userData.claridad + "%";
    document.getElementById("calma-bar").style.width = userData.calma + "%";
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}

// VOZ PROFESIONAL
function hablar(texto) {
    return new Promise(resolve => {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(texto);
        msg.lang = 'es-US';
        msg.rate = 0.9;
        msg.onend = () => resolve();
        msg.onerror = () => resolve();
        speechSynthesis.speak(msg);
        setTimeout(resolve, 6000); // Fail-safe
    });
}

// INICIO DEL SISTEMA
startBtn.onclick = async () => {
    startBtn.style.display = "none";
    block.innerHTML = "<h3>CONECTANDO...</h3>";
    
    try {
        const res = await fetch("/session_content");
        const data = await res.json();
        bloques = data.sesiones[0].bloques;
        renderBloque();
    } catch (e) {
        block.innerHTML = "<h3>ERROR DE CARGA</h3><p>Revisa el archivo JSON.</p>";
    }
};

async function renderBloque() {
    const b = bloques[currentIdx];
    if (!b) return;

    skipFlag = false;
    block.innerHTML = "";
    nextBtn.style.display = "none";
    skipBtn.style.display = "block";
    document.body.style.background = b.color || "#000";

    // 1. TÍTULO Y TEXTO (LECTURA CLARA)
    const contenido = b.texto || b.instrucciones || b.pregunta || "";
    if (b.titulo) block.innerHTML += `<h3>${b.titulo}</h3>`;
    block.innerHTML += `<p>${contenido}</p>`;

    // 2. VOZ
    await hablar(contenido);

    // 3. CASO RESPIRACIÓN (GLOBO AZUL)
    if (b.tipo === "respiracion") {
        block.innerHTML += `<div class="breath-circle" id="circle"></div><h2 id="label"></h2>`;
        const circle = document.getElementById("circle");
        const label = document.getElementById("label");
        
        for (let i = 0; i < (b.repeticiones || 2); i++) {
            if (skipFlag) break;
            label.innerText = "INHALA";
            circle.style.transform = "scale(1.8)";
            await hablar("Inhala");
            await new Promise(r => setTimeout(r, 3000));

            label.innerText = "RETÉN";
            await hablar("Retén");
            await new Promise(r => setTimeout(r, 2000));

            label.innerText = "EXHALA";
            circle.style.transform = "scale(1)";
            await hablar("Exhala");
            await new Promise(r => setTimeout(r, 3000));
        }
    } 
    // 4. CASO DECISIÓN (BOTONES)
    else if (b.tipo === "decision") {
        skipBtn.style.display = "none";
        b.opciones.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = opt;
            btn.onclick = async () => {
                const esCorrecto = (i === b.correcta);
                userData.disciplina += esCorrecto ? 10 : -20;
                updatePanel();
                block.innerHTML = `<h3>${esCorrecto ? 'CORRECTO' : 'FALLO'}</h3><p>${b.explicacion}</p>`;
                await hablar(b.explicacion);
                mostrarBotonSiguiente();
            };
            block.appendChild(btn);
        });
        return; // No auto-finaliza, espera al botón de opción
    }

    mostrarBotonSiguiente();
}

function mostrarBotonSiguiente() {
    skipBtn.style.display = "none";
    nextBtn.style.display = "block";
}

nextBtn.onclick = () => {
    currentIdx++;
    if (currentIdx < bloques.length) renderBloque();
    else {
        block.innerHTML = "<h3>FORJA COMPLETADA</h3>";
        nextBtn.style.display = "none";
        setTimeout(() => location.reload(), 4000);
    }
};

skipBtn.onclick = () => {
    skipFlag = true;
    speechSynthesis.cancel();
    userData.disciplina = 0; // Penalización máxima
    updatePanel();
    block.innerHTML = "<h3 style='color:red;'>DISCIPLINA ROTA</h3>";
    setTimeout(mostrarBotonSiguiente, 1500);
};

updatePanel();
