const KamizenEngine = (() => {

const state = {
    score: 0,
    lang: "en",
    missionId: 1,
    mission: null,
    player: { name: "", hero: "" },
    silence: 180
};

// ================= AUDIO =================
const Audio = {
    bg:null, ok:null, bad:null,
    init(){
        this.bg = document.getElementById("bg");
        this.ok = document.getElementById("ok");
        this.bad = document.getElementById("bad");
        if(this.bg){
            this.bg.volume = 0.3;
            this.bg.play().catch(()=>{});
        }
    }
};

// ================= SPEECH =================
function speak(t){
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = state.lang==="en"?"en-US":"es-ES";
    u.rate = 0.9;
    speechSynthesis.speak(u);
}

// ================= UI =================
const UI = {
    set(id,val){
        const el = document.getElementById(id);
        if(el) el.innerText = val;
    },
    score(){
        this.set("score-display","PUNTOS: "+state.score);
    },
    renderOptions(options){
        const c = document.getElementById("options");
        c.innerHTML = "";
        options.forEach(o=>{
            const b = document.createElement("button");
            b.className="opt-btn";
            b.innerText=o.text[state.lang];
            b.onclick=()=>Decision(o);
            c.appendChild(b);
        });
    }
};

// ================= INIT =================
async function init(){
    state.player.name = prompt("Nombre:") || "Player";
    state.player.hero = prompt("Heroe:") || "Kamizen";

    document.getElementById("hero-name").innerText = state.player.hero;

    Audio.init();
    loadMission();
}

// ================= MISSION =================
async function loadMission(){
    const r = await fetch("/api/mission/"+state.missionId);
    const m = await r.json();
    state.mission = m;

    const story = m.blocks.find(b=>b.type==="story").text[state.lang];
    const analysis = m.blocks.find(b=>b.type==="analysis").text[state.lang];
    const decision = m.blocks.find(b=>b.type==="decision");

    UI.set("story",story);
    UI.set("analysis","");
    speak(story);

    setTimeout(()=>{
        UI.set("analysis",analysis);
        speak(analysis);
    },3000);

    setTimeout(()=>{
        UI.renderOptions(decision.options);
    },6000);
}

// ================= DECISION =================
function Decision(opt){
    document.getElementById("options").innerHTML="";
    const box=document.getElementById("explanation-box");

    box.style.display="block";
    box.innerText=opt.explanation[state.lang];

    if(opt.correct){
        state.score+=20;
        Audio.ok.play();
        speak("Correct. "+opt.explanation[state.lang]);
        document.body.style.background="#004400";
    }else{
        state.score-=10;
        Audio.bad.play();
        speak("Wrong. "+opt.explanation[state.lang]);
        document.body.style.background="#440000";
    }

    UI.score();

    setTimeout(()=>{
        document.body.style.background="";
        state.missionId++;
        loadMission();
    },4000);
}

// ================= LANG =================
function toggleLang(){
    state.lang = state.lang==="en"?"es":"en";
    if(state.mission) loadMission();
}

// ================= FLOATING WORDS =================
setInterval(()=>{
    const words=["FOCUS","TRUTH","FEAR","POWER"];
    const w = words[Math.random()*words.length|0];

    const el=document.createElement("div");
    el.className="floating word-good";
    el.innerText=w;
    el.style.left=Math.random()*90+"vw";

    el.onclick=()=>{
        state.score+=5;
        UI.score();
        el.remove();
    };

    document.body.appendChild(el);
    setTimeout(()=>el.remove(),4000);
},2000);

// ================= EXPORT =================
return { init, toggleLang };

})();

window.onload = ()=>KamizenEngine.init();
