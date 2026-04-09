let lang = "en";

const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");
const forwardBtn = document.getElementById("forward-btn");
const block = document.getElementById("block");
const langBtn = document.getElementById("lang-btn");

let bloques = [];
let current = 0;
let speaking = false;

let userData = JSON.parse(localStorage.getItem("kamizen")) || {
    streak: 0,
    level: 1,
    discipline: 40,
    clarity: 50,
    calm: 40
};

function t(en, es){
    return lang === "en" ? en : es;
}

/* ================= VOICE ================= */
function speak(text){
    return new Promise(resolve=>{
        window.speechSynthesis.cancel();
        let msg = new SpeechSynthesisUtterance(text);
        msg.lang = lang === "en" ? "en-US" : "es-ES";
        msg.rate = 0.9;
        msg.onend = resolve;
        window.speechSynthesis.speak(msg);
    });
}

/* ================= PANEL ================= */
function updatePanel(){
    document.getElementById("streak").innerText =
        t(`🔥 Streak: ${userData.streak}`, `🔥 Racha: ${userData.streak}`);

    document.getElementById("level").innerText =
        t(`Level: ${userData.level}`, `Nivel: ${userData.level}`);

    localStorage.setItem("kamizen", JSON.stringify(userData));
}

/* ================= BREATH RESTORED ================= */
async function breathing(b){
    block.innerHTML = "";

    const circle = document.createElement("div");
    circle.className = "breath-circle";

    const text = document.createElement("div");
    text.style.textAlign = "center";
    text.style.marginTop = "10px";
    text.innerText = b.text;

    block.appendChild(text);
    block.appendChild(circle);

    await speak(b.text);

    circle.style.transform = "scale(1.8)";
    await new Promise(r => setTimeout(r, (b.duration || 5) * 1000));

    circle.style.transform = "scale(1)";
    nextBtn.style.display = "block";
}

/* ================= BLOCK ENGINE ================= */
async function showBlock(b){
    nextBtn.style.display = "none";

    document.body.style.background = b.color || "#0f172a";

    if(b.type === "voice" || b.type === "story" || b.type === "strategy"){
        let text = lang === "en" ? b.text : (b.text_es || b.text);

        block.innerText = text;
        await speak(text);
        nextBtn.style.display = "block";
    }

    if(b.type === "breathing"){
        await breathing(b);
    }

    if(b.type === "quiz"){
        let q = lang === "en" ? b.question : (b.question_es || b.question);

        block.innerHTML = `<h3>${q}</h3>`;

        await speak(q);

        b.options.forEach((o,i)=>{
            let btn = document.createElement("button");
            btn.innerText = o;

            btn.onclick = async ()=>{
                let correct = i === b.correct;

                let msg = correct
                    ? (lang==="en"?"Correct":"Correcto")
                    : (lang==="en"?"Wrong":"Incorrecto");

                await speak(msg);

                if(correct){
                    userData.discipline += 5;
                }

                updatePanel();
                nextBtn.style.display = "block";
            };

            block.appendChild(btn);
        });
    }

    if(b.type === "closing"){
        block.innerText = b.text;
        await speak(b.text);
        restartBtn.style.display = "block";
    }
}

/* ================= FLOW ================= */
startBtn.onclick = async ()=>{
    startBtn.style.display = "none";

    let res = await fetch("/session_content");
    let data = await res.json();

    bloques = data.sessions?.[0]?.blocks || [];

    current = 0;
    showBlock(bloques[0]);
};

nextBtn.onclick = ()=>{
    current++;
    if(current < bloques.length) showBlock(bloques[current]);
};

backBtn.onclick = ()=>{
    if(current>0){
        current--;
        showBlock(bloques[current]);
    }
};

forwardBtn.onclick = ()=>{
    if(current < bloques.length-1){
        current++;
        showBlock(bloques[current]);
    }
};

restartBtn.onclick = ()=> location.reload();

/* ================= LANGUAGE TOGGLE ================= */
langBtn.onclick = ()=>{
    lang = (lang === "en") ? "es" : "en";
    langBtn.innerText = lang === "en" ? "ES" : "EN";
    updatePanel();
};
