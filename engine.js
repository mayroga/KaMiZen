let lang = "en";
let gameMode = "idle";

let state = {
    score: 0,
    mastery: 1,
    timer: 300,
    stats: {
        respect: 50,
        peace: 50,
        lead: 50,
        money: 100,
        happy: 50,
        safety: 100
    },
    spawnRate: 1400,
    maxWords: 18
};

let userProfile = {};

/* =========================
🧬 PROFILE ADAPTATION
========================= */
function applyProfile(profile){
    if(!profile) return;
    userProfile = profile;

    state.spawnRate = 1400;

    if(profile.impulsivity > 65) state.spawnRate -= 400;
    if(profile.focus > 70) state.spawnRate += 300;
    if(profile.calm > 65) state.spawnRate += 200;
    if(profile.fear > 65) state.spawnRate -= 200;
}

/* =========================
🔊 SAFE SPEECH (NO FREEZE)
========================= */
let speaking = false;

function speak(t){
    if(!t || speaking) return;

    speaking = true;

    let u = new SpeechSynthesisUtterance(t);
    u.lang = lang === "es" ? "es-ES" : "en-US";

    u.onend = () => speaking = false;
    u.onerror = () => speaking = false;

    speechSynthesis.cancel();
    speechSynthesis.speak(u);
}

/* =========================
📊 HUD
========================= */
function updateHUD(){
    document.getElementById("score-box").innerText = state.score;

    let m = Math.floor(state.timer / 60);
    let s = state.timer % 60;
    document.getElementById("timer-box").innerText =
        String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");

    for(let k in state.stats){
        let el = document.getElementById("v-"+k);
        if(el) el.innerText = state.stats[k];
    }
}

/* =========================
⚡ AUDIO (LIMITED, NO OVERFLOW)
========================= */
const AudioEngine = {
    ctx:null,
    lastClick:0,

    init(){
        if(this.ctx) return;
        this.ctx = new (window.AudioContext||window.webkitAudioContext)();
    },

    click(){
        if(!this.ctx) return;

        if(Date.now() - this.lastClick < 80) return;
        this.lastClick = Date.now();

        let o = this.ctx.createOscillator();
        let g = this.ctx.createGain();

        o.type = "triangle";
        o.frequency.value = 700;

        g.gain.value = 0.05;

        o.connect(g);
        g.connect(this.ctx.destination);

        o.start();
        o.stop(this.ctx.currentTime + 0.08);
    },

    explode(){
        if(!this.ctx) return;

        let buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
        let data = buffer.getChannelData(0);

        for(let i=0;i<data.length;i++) data[i] = Math.random()*2-1;

        let n = this.ctx.createBufferSource();
        n.buffer = buffer;

        let g = this.ctx.createGain();
        g.gain.value = 0.15;

        n.connect(g);
        g.connect(this.ctx.destination);

        n.start();
    }
};

document.addEventListener("click",()=>AudioEngine.init(),{once:true});

/* =========================
🌊 WORD SYSTEM (CONTROLLED SPAWN)
========================= */

const words = {
    power:["FOCUS","CONTROL","CALM","THINK"],
    risk:["RUSH","ANGER","IMPULSE","IGNORE"],
    silence:["BREATHE","OBSERVE","WAIT","RESET"],
    money:["SAVE","BUILD","INVEST","GROW"],
    business:["LEAD","SYSTEM","SCALE","VALUE"],
    growth:["LEARN","ADAPT","DISCIPLINE","IMPROVE"]
};

let activeWords = 0;
let lastSpawn = 0;

function spawnWord(){

    if(gameMode !== "words") return;

    // 🧠 HARD LIMIT (ANTI FREEZE)
    if(activeWords > state.maxWords) return;

    let now = Date.now();
    if(now - lastSpawn < state.spawnRate) return;
    lastSpawn = now;

    const cats = Object.keys(words);
    const c = cats[Math.floor(Math.random()*cats.length)];

    let div = document.createElement("div");
    div.className = "floating";
    div.innerText = words[c][Math.floor(Math.random()*words[c].length)];
    div.style.left = Math.random()*80 + "vw";

    activeWords++;

    div.onclick = () => {

        AudioEngine.click();

        let positive = !["risk"].includes(c);

        state.score += positive ? 20 : -10;

        if(c==="money") state.stats.money++;
        if(c==="business") state.stats.lead++;
        if(c==="growth") state.stats.happy++;
        if(c==="power") state.stats.respect++;
        if(c==="risk") state.stats.safety--;
        if(c==="silence") state.stats.peace++;

        updateHUD();

        div.remove();
        activeWords--;
    };

    document.body.appendChild(div);

    // 🧹 AUTO CLEANUP
    setTimeout(()=>{
        if(div.parentNode){
            div.remove();
            activeWords--;
        }
    }, 6000);
}

/* =========================
🧠 QUESTION SYSTEM
========================= */
async function triggerQuestion(){

    const res = await fetch("/api/mission/next?lang="+lang);
    const data = await res.json();

    applyProfile(data.profile);

    let overlay = document.getElementById("overlay");
    let grid = document.getElementById("decision-grid");
    let desc = document.getElementById("phase-desc");
    let title = document.getElementById("phase-title");
    let cont = document.getElementById("continue-btn");

    overlay.style.display="flex";
    grid.innerHTML="";
    cont.style.display="none";

    title.innerText = data.theme;
    desc.innerText = data.story;

    let answered = false;

    data.options.forEach(opt=>{

        let btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = opt.text.en;

        btn.onclick = ()=>{

            AudioEngine.click();

            desc.innerText = opt.explanation.en;
            speak(opt.explanation.en);

            if(!answered){
                answered = true;

                if(opt.correct){
                    state.score += 30;
                    document.body.classList.add("correct-flash");
                } else {
                    state.score -= 20;
                    document.body.classList.add("wrong-flash");
                }

                setTimeout(()=>{
                    document.body.classList.remove("correct-flash","wrong-flash");
                },400);

                document.querySelectorAll(".choice-btn")
                .forEach(b=>b.classList.add("locked"));

                cont.style.display="block";
                updateHUD();
            }
        };

        grid.appendChild(btn);
    });

    cont.onclick = ()=>{
        AudioEngine.click();
        overlay.style.display="none";
    };
}

/* =========================
⏱ SAFE TIMER
========================= */
setInterval(()=>{
    if(state.timer>0 && gameMode==="words"){
        state.timer--;
        updateHUD();
    }
},1000);

/* =========================
🔁 FRAME-BASED LOOP (NO FREEZE)
========================= */

let phaseStart = Date.now();
let phase = "words";

function loop(){

    requestAnimationFrame(loop);

    if(phase === "words"){

        spawnWord();

        if(Date.now() - phaseStart > 45000){
            phase = "question";
            phaseStart = Date.now();

            document.querySelectorAll(".floating").forEach(e=>e.remove());
            activeWords = 0;

            triggerQuestion();
        }
    }
}

function start(){
    phaseStart = Date.now();
    phase = "words";
    loop();
}

function toggleLang(){
    lang = (lang==="en")?"es":"en";
    document.getElementById("lang-btn").innerText = lang.toUpperCase();
}

/* =========================
🚀 START
========================= */
updateHUD();
start();
