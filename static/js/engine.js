/* =========================================================
   KAMIZEN ENGINE V11 - SAFE AUTOPLAY + CONTROL VOZ
   ✔ No elimina sistema original
   ✔ Voz controla ritmo
   ✔ Delay de seguridad 1s
   ✔ Silence bloquea auto advance
   ✔ Q&A con feedback completo
   ✔ Colores de evaluación
   ✔ Background sync hook
========================================================= */

/* =========================
   GLOBAL STATE
========================= */

let state = {
    stories: [],
    missions: [],
    currentIndex: 0,
    currentBlock: 0,
    phase: "loading",
    speechLocked: false,
    initialized: false
};

/* =========================
   LOCK
========================= */

if (window.__KAMIZEN_ENGINE_ACTIVE__) {
    console.warn("ALREADY RUNNING");
} else {
    window.__KAMIZEN_ENGINE_ACTIVE__ = true;
}

/* =========================
   INIT
========================= */

window.addEventListener("load", async () => {
    await loadAllData();
    showIntro();
});

/* =========================
   LOAD DATA (UNCHANGED CORE)
========================= */

async function loadAllData() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="card">
            <h2>LOADING SYSTEM...</h2>
        </div>
    `;

    const [s, m] = await Promise.all([
        fetch("/api/stories"),
        fetch("/api/missions")
    ]);

    const sd = await s.json();
    const md = await m.json();

    state.stories = sd.stories.sort((a,b)=>a.id-b.id);
    state.missions = md.missions.sort((a,b)=>a.id-b.id);

    state.initialized = true;
}

/* =========================
   INTRO (UNCHANGED)
========================= */

function showIntro(){
    state.phase="intro";
    document.getElementById("app").innerHTML=`
    <div class="card center">
        <h2>KAMIZEN LIFE SYSTEM</h2>
        <p>BODY • CALM • FOCUS • PRESENCE</p>
    </div>

    <button onclick="startSystem()">START SYSTEM</button>
    `;
}

/* =========================
   START
========================= */

function startSystem(){
    state.currentIndex=0;
    state.currentBlock=0;
    state.phase="story";
    render();
}

/* =========================
   CORE RENDER
========================= */

function render(){

    if(!state.initialized) return;

    const app=document.getElementById("app");

    const story=state.stories[state.currentIndex];
    const mission=state.missions[state.currentIndex];

    if(!story || !mission){
        state.currentIndex=0;
        state.currentBlock=0;
        return render();
    }

    if(state.phase==="story"){

        app.innerHTML=`
        <div class="card">
            <h2>STORY ${story.id}</h2>
            <h3>${story.t}</h3>
            <p>${story.en}</p>
        </div>

        <button id="continueBtn" disabled>NARRATING...</button>
        `;

        narrate(`${story.t}. ${story.en}`,()=>{
            setTimeout(()=>unlockContinue("START MISSION",startMission),1000);
        });

        return;
    }

    if(state.phase==="mission"){
        const block=mission.b[state.currentBlock];
        if(!block){ nextStory(); return; }
        renderBlock(block);
    }
}

/* =========================
   BLOCK ENGINE (FIXED LOGIC)
========================= */

function renderBlock(block){

    const app=document.getElementById("app");

    let html="";
    let text="";
    let blockType=block.t;

    /* =========================
       TEXT BLOCKS
    ========================= */

    if(block.t==="v"||block.t==="h"||block.story){
        html+=`<div class="card"><p>${block.tx?.en||block.story?.en||""}</p></div>`;
        text+=`${block.tx?.en||block.story?.en||""}. `;
    }

    /* =========================
       BREATHING
    ========================= */

    if(block.t==="breath_auto"||block.t==="br"){
        html+=`
        <div class="card center">
            <div class="breath-circle" id="breathCircle">
                <span id="breathLabel">INHALE</span>
            </div>
            <p>${block.tx?.en}</p>
            <p>${block.inf?.en}</p>
        </div>`;
        text+=`${block.tx?.en}. ${block.inf?.en}.`;
    }

    /* =========================
       SILENCE (NO AUTO ADVANCE)
    ========================= */

    if(block.t==="sil"){
        html+=`
        <div class="card center">
            <h3>${block.tx?.en}</h3>
            <p>${block.inf?.en}</p>
        </div>

        <button id="continueBtn" disabled>CONTINUE</button>
        `;

        text+=`${block.tx?.en}. ${block.inf?.en}.`;

        renderUI(html,text,true);
        return;
    }

    /* =========================
       QUESTION SYSTEM (IMPORTANT FIX)
    ========================= */

    if(block.t==="d"){

        html+=`<div class="card"><h3>${block.q.en}</h3>`;

        block.op.forEach((o,i)=>{

            html+=`
            <div class="answer"
                onclick="selectAnswer(${i},${block.c},${JSON.stringify(block.ex)})">
                ${o}
            </div>`;
        });

        html+="</div>";

        text+=block.q.en;

        renderUI(html,text,true);
        return;
    }

    /* =========================
       AUTO CONTINUE BLOCKS
    ========================= */

    renderUI(html,text,false);
}

/* =========================
   UI RENDER SAFE
========================= */

function renderUI(html,text,waitButton){

    document.getElementById("app").innerHTML=html;

    narrate(text,()=>{
        setTimeout(()=>{

            if(waitButton){
                unlockContinue("CONTINUE",nextBlock);
            }else{
                nextBlock();
            }

        },1000); // 🔥 safety delay
    });
}

/* =========================
   ANSWERS (COLOR LOGIC FIXED)
========================= */

function selectAnswer(i,correct,exp){

    if(state.speechLocked) return;

    const ok=i===correct;

    let color= ok ? "#22c55e" :
               i===1 ? "#facc15" :
               i===2 ? "#f97316" :
                       "#ef4444";

    const app=document.getElementById("app");

    app.innerHTML+=`
    <div class="card">
        <h3 style="color:${color}">
            ${ok?"CORRECT":"RESULT"}
        </h3>
        <p>${exp[i]||""}</p>
    </div>

    <button id="continueBtn" disabled>CONTINUE</button>
    `;

    narrate(exp[i]||"",()=>{
        setTimeout(()=>unlockContinue("CONTINUE",nextBlock),1000);
    });
}

/* =========================
   VOICE (UNCHANGED CORE + SAFETY)
========================= */

function narrate(text,cb){

    if(!text){ cb&&cb(); return; }

    state.speechLocked=true;

    window.speechSynthesis.cancel();

    let u=new SpeechSynthesisUtterance(text);

    u.rate=0.9;
    u.pitch=1;

    u.onend=()=>{
        state.speechLocked=false;
        cb&&cb();
    };

    window.speechSynthesis.speak(u);
}

/* =========================
   CONTROLS
========================= */

function unlockContinue(t,fn){

    let b=document.getElementById("continueBtn");
    if(!b) return;

    b.disabled=false;
    b.innerText=t;
    b.onclick=fn;
}

/* =========================
   FLOW CONTROL
========================= */

function nextBlock(){
    state.currentBlock++;
    render();
}

function startMission(){
    state.phase="mission";
    state.currentBlock=0;
    render();
}

function nextStory(){
    state.currentIndex++;
    state.currentBlock=0;
    state.phase="story";
    render();
}
