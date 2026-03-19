const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn");
const restartBtn = document.getElementById("restart-btn");
const block = document.getElementById("block");
const banner = document.getElementById("banner");

let bloques = [];
let currentIdx = 0;
let sesionActualData = null;
let skipFlag = false;
let activeInterval = null;
let isAdmin = false;

let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0, lastDay: null, nivel: 1, disciplina: 40, claridad: 50, calma: 30, lastSessionId: 0
};

function updatePanel(){
    userData.disciplina = Math.max(0, Math.min(userData.disciplina, 100));
    document.getElementById("streak").innerHTML = "🔥 Racha: " + userData.streak + " días";
    document.getElementById("level").innerHTML = "Nivel: " + userData.nivel;
    document.getElementById("disciplina-bar").style.width = userData.disciplina + "%";
    document.getElementById("claridad-bar").style.width = userData.claridad + "%";
    document.getElementById("calma-bar").style.width = userData.calma + "%";
    localStorage.setItem("kamizenData", JSON.stringify(userData));
}

function playVoice(text){
    return new Promise(resolve => {
        if (!text) return resolve();
        speechSynthesis.cancel();
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = "es-US";
        msg.rate = 0.9;
        const forceContinue = setTimeout(() => resolve(), 4000);
        msg.onend = () => { clearTimeout(forceContinue); resolve(); };
        speechSynthesis.speak(msg);
    });
}

function wait(ms) {
    return new Promise(resolve => {
        const start = Date.now();
        const check = setInterval(() => {
            if (Date.now() - start >= ms || skipFlag) { clearInterval(check); resolve(); }
        }, 50);
    });
}

// LOGIN ADMIN
document.getElementById("logo").ondblclick = async () => {
    const u = prompt("User:"), p = prompt("Pass:");
    const res = await fetch("/admin_auth", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user:u, pass_word:p})
    });
    if(res.ok) { isAdmin = true; banner.style.background = "#059669"; alert("MODO ADMIN ACTIVO"); }
};

async function checkSystem() {
    if (isAdmin) return;
    const res = await fetch("/api/status");
    const st = await res.json();
    if (!st.is_open) {
        startBtn.style.display = "none";
        block.innerHTML = `<h3>SISTEMA CERRADO</h3><p>Próxima forja: ${st.next}</p>`;
    }
}

async function showBlock(b){
    if(!b) return;
    skipFlag = false;
    if(activeInterval) clearInterval(activeInterval);
    block.innerHTML = "";
    nextBtn.style.display = "none";
    skipBtn.style.display = "block";
    document.body.style.background = b.color || "#020617";

    if(b.tipo === "respiracion"){
        block.innerHTML = `<p>${b.instrucciones}</p><div class="breath-circle" id="circle"></div><h3 id="label"></h3>`;
        const circle = document.getElementById("circle");
        const label = document.getElementById("label");
        const reps = b.repeticiones || 3;
        for(let i=0; i < reps; i++){
            if(skipFlag) break;
            label.innerText = "Inhala"; circle.style.transform = "scale(1.8)";
            await playVoice("Inhala"); await wait(b.tiempos.inhalar * 1000);
            if(skipFlag) break;
            label.innerText = "Retén";
            await playVoice("Retén"); await wait(b.tiempos.retener * 1000);
            if(skipFlag) break;
            label.innerText = "Exhala"; circle.style.transform = "scale(1)";
            await playVoice("Exhala"); await wait(b.tiempos.exhalar * 1000);
        }
        finishBlock();
    }
    else if(b.tipo === "decision"){
        skipBtn.style.display = "none";
        block.innerHTML = `<h3>${b.pregunta}</h3>`;
        b.opciones.forEach((opt, i) => {
            let btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = opt;
            btn.onclick = async () => {
                const esCorrecto = i === b.correcta;
                userData.disciplina += esCorrecto ? 10 : -5;
                updatePanel();
                block.innerHTML = `<h3>${esCorrecto ? 'EXCELENTE' : 'ERROR'}</h3><p>${b.explicacion}</p>`;
                await playVoice(b.explicacion);
                finishBlock();
            };
            block.appendChild(btn);
        });
        await playVoice(b.pregunta);
    }
    else {
        const contenido = b.texto || b.instrucciones || b.titulo;
        block.innerHTML = b.titulo ? `<h3>${b.titulo}</h3><p>${contenido}</p>` : `<p>${contenido}</p>`;
        await playVoice(contenido);
        finishBlock();
    }
}

function finishBlock() {
    skipBtn.style.display = "none";
    nextBtn.style.display = "block";
}

skipBtn.onclick = () => {
    skipFlag = true;
    speechSynthesis.cancel();
    userData.disciplina = Math.floor(userData.disciplina * 0.2);
    updatePanel();
    block.innerHTML = `<h3 style="color:#ef4444;">DISCIPLINA ROTA</h3>`;
    setTimeout(finishBlock, 1500);
};

startBtn.onclick = async () => {
    try {
        const response = await fetch("/session_content", { headers: {"X-Admin-Access": isAdmin ? "true" : "false"} });
        if(!response.ok) throw new Error("Cerrado");
        const data = await response.json();
        bloques = data.sesiones[0].bloques;
        startBtn.style.display = "none";
        showBlock(bloques[0]);
    } catch (err) { alert("Sistema Cerrado o Error de Conexión"); }
};

nextBtn.onclick = () => {
    currentIdx++;
    if(currentIdx < bloques.length) showBlock(bloques[currentIdx]);
    else {
        block.innerHTML = `<h2>Mente Forjada</h2>`;
        restartBtn.style.display = "block";
        nextBtn.style.display = "none";
    }
};

restartBtn.onclick = () => location.reload();
updatePanel();
checkSystem();
