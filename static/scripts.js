/* =================== KAMIZEN ENGINE V4 =================== */

const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");
const forwardBtn = document.getElementById("forward-btn");
const block = document.getElementById("block");

let bloques = [];
let current = 0;
let currentSessionIndex = 0;

let lang = localStorage.getItem("kamizenLang") || "en";

/* =================== USER DATA =================== */

let userData = JSON.parse(localStorage.getItem("kamizenData")) || {
    streak: 0,
    nivel: 1,
    disciplina: 40,
    claridad: 50,
    calma: 30
};

let completedSessions = JSON.parse(localStorage.getItem("completedSessions")) || [];

/* =================== UI TEXT =================== */

const t = {
    en: {
        start: "Start Session",
        next: "Next",
        back: "Back",
        forward: "Forward",
        restart: "Restart",
        warning: "Skipping breaks your discipline."
    },
    es: {
        start: "Iniciar sesión",
        next: "Siguiente",
        back: "Atrás",
        forward: "Adelantar",
        restart: "Reiniciar",
        warning: "Saltar pasos rompe tu disciplina."
    }
};

/* =================== BACKGROUND SYSTEM =================== */

let bgEnabled = true;
let bgIndex = 0;
let bgSlides = [];

const keywords = [
"forest","mountain","ocean","river","desert","waterfall","canyon","lake",
"valley","sunset","cliffs","snow","autumn","tropical","island","field",
"mist","aurora","jungle","beach","sky","clouds","zen","glacier","cave"
];

function initBackground(){
    const container = document.getElementById("bg-gallery");
    if(!container) return;

    container.innerHTML = "";

    keywords.forEach((w,i)=>{
        const div = document.createElement("div");
        div.className = "bg-slide" + (i===0 ? " active" : "");
        div.style.backgroundImage =
        `url('https://source.unsplash.com/1920x1080/?${w}')`;
        container.appendChild(div);
    });

    bgSlides = document.querySelectorAll(".bg-slide");

    setInterval(()=>{
        if(!bgEnabled) return;

        bgSlides[bgIndex].classList.remove("active");
        bgIndex = (bgIndex + 1) % bgSlides.length;
        bgSlides[bgIndex].classList.add("active");

    },7000);
}

function toggleBG(){
    bgEnabled = !bgEnabled;
}

/* =================== LEVEL SYSTEM =================== */

function levelName(n){
    return n===1?"Easy":n===2?"Medium":"Hard";
}

function multiplier(){
    return userData.nivel===1?1:userData.nivel===2?1.5:2.2;
}

/* =================== PANEL =================== */

function updatePanel(){
    document.getElementById("streak").innerText =
    `🔥 Streak: ${userData.streak}`;

    document.getElementById("level").innerText =
    `Level: ${levelName(userData.nivel)}`;

    document.getElementById("disciplina-bar").style.width = userData.disciplina+"%";
    document.getElementById("claridad-bar").style.width = userData.claridad+"%";
    document.getElementById("calma-bar").style.width = userData.calma+"%";

    localStorage.setItem("kamizenData",JSON.stringify(userData));
}

/* =================== VOICE =================== */

function speak(text){
    return new Promise(res=>{
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = lang==="es"?"es-ES":"en-US";
        msg.rate = 0.9;
        msg.onend = res;
        speechSynthesis.speak(msg);
    });
}

/* =================== SHOW BLOCK =================== */

async function showBlock(b){

    block.innerHTML="";
    nextBtn.style.display="none";
    document.body.style.background="#000";

    const type = b.type;

    /* TEXT */
    if(["voice","tvid","strategy","story","visualization","reward","closing"].includes(type)){
        const text = b.text || "";
        block.innerHTML=`<div>${text}</div>`;
        await speak(text);

        if(type==="reward"){
            userData.disciplina += (b.points||10)*multiplier();
            updatePanel();
        }

        setTimeout(()=>nextBtn.style.display="block",800);
    }

    /* BREATHING */
    if(type==="breathing"){
        block.innerHTML=`<div>${b.text}</div>`;
        await speak(b.text);
        setTimeout(()=>nextBtn.style.display="block",800);
    }

    /* QUIZ */
    if(["quiz","mental_game","decision"].includes(type)){
        const q = b.question||"";
        block.innerHTML=`<h3>${q}</h3>`;
        await speak(q);

        const area = document.createElement("div");

        (b.options||[]).forEach((o,i)=>{
            const btn=document.createElement("button");
            btn.innerText=o;

            btn.onclick=async()=>{
                const ok = i===b.correct;
                const msg = ok?"Correct":"Incorrect";

                await speak(msg);

                if(ok){
                    userData.disciplina += (b.reward||5)*multiplier();
                    updatePanel();
                    nextBtn.style.display="block";
                } else {
                    userData.calma+=2;
                    updatePanel();
                }
            };

            area.appendChild(btn);
        });

        block.appendChild(area);
    }

    /* CLOSING */
    if(type==="closing"){
        block.innerHTML=`<h2>${b.text}</h2>`;
        await speak(b.text);

        completedSessions.push(currentSessionIndex);
        localStorage.setItem("completedSessions",JSON.stringify(completedSessions));

        restartBtn.style.display="block";
    }
}

/* =================== START =================== */

startBtn.addEventListener("click",async()=>{

initBackground();

const res = await fetch("/session_content");
const data = await res.json();

const sessions = data.sessions||[];

let available = sessions.map((_,i)=>i)
.filter(i=>!completedSessions.includes(i));

if(available.length===0){
completedSessions=[];
available=sessions.map((_,i)=>i);
}

currentSessionIndex = available[Math.floor(Math.random()*available.length)];
bloques = sessions[currentSessionIndex].blocks;

current=0;
showBlock(bloques[0]);

startBtn.style.display="none";
});

/* =================== NAV =================== */

nextBtn.onclick=()=>{current++;showBlock(bloques[current]);};

backBtn.onclick=()=>{
if(current>0){current--;showBlock(bloques[current]);}
};

forwardBtn.onclick=()=>{
if(current<bloques.length-1){
current++;showBlock(bloques[current]);
}
};

restartBtn.onclick=()=>location.reload();

/* INIT */
updatePanel();
