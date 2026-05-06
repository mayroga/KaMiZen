let state = {
    stories: [],
    missions: [],
    index: 0,
    step: "story",
    bIndex: 0,
    loaded: false
};

window.addEventListener("load", init);

async function init(){
    const [s, m] = await Promise.all([
        fetch("/api/stories"),
        fetch("/api/missions")
    ]);

    const sd = await s.json();
    const md = await m.json();

    state.stories = sd.stories || [];
    state.missions = md.missions || [];

    render();
}

/* =========================
   MAIN FLOW CONTROLLER
========================= */

function render(){

    const app = document.getElementById("app");
    if(!app) return;

    const story = state.stories[state.index];
    const mission = state.missions[state.index];

    if(!story || !mission){
        state.index = 0; // 🔁 LOOP RESET
        state.step = "story";
        state.bIndex = 0;
        return render();
    }

    /* STORY MODE */
    if(state.step === "story"){
        app.innerHTML = `
            <div class="card">
                <h2>STORY ${story.id}</h2>
                <p>${story.en}</p>
            </div>

            <button onclick="startMission()" style="width:100%;padding:12px;">
                START MISSION
            </button>
        `;

        speak(story.en);
        return;
    }

    /* MISSION MODE */
    if(state.step === "mission"){
        const block = mission.b[state.bIndex];

        if(!block){
            nextCycle();
            return;
        }

        renderBlock(block);
    }
}

/* =========================
   BLOCK RENDER
========================= */

function renderBlock(b){
    const app = document.getElementById("app");

    let html = "";

    if(b.t === "v"){
        html += `<div class="card"><h2>${b.tx.en}</h2></div>`;
    }

    if(b.t === "h"){
        html += `<div class="card"><p>${b.tx.en}</p></div>`;
    }

    if(b.story){
        html += `<div class="card"><p>${b.story.en}</p></div>`;
    }

    if(b.t === "d"){
        html += `<div class="card">
            <p>${b.q.en}</p>
        `;

        b.op.forEach((o,i)=>{
            html += `
                <div onclick="answer(${i},${b.c})"
                     style="padding:10px;margin:5px;background:#1f2937;cursor:pointer;">
                    ${o}
                </div>
            `;
        });

        html += `</div>`;
    }

    if(b.t === "breath_auto"){
        html += `
        <div class="card">
            <div id="circle" style="
                width:120px;height:120px;border-radius:50%;
                margin:auto;
                border:4px solid #3b82f6;
                animation:breathe 6s infinite;
            "></div>
            <p>${b.tx?.en || ""}</p>
        </div>`;
    }

    html += `<button onclick="nextBlock()" style="width:100%;padding:12px;">CONTINUE</button>`;

    app.innerHTML = html;
}

/* =========================
   CONTROL FLOW
========================= */

function startMission(){
    state.step = "mission";
    state.bIndex = 0;
    render();
}

function nextBlock(){
    state.bIndex++;
    render();
}

function nextCycle(){
    state.index++;

    if(state.index >= state.stories.length){
        state.index = 0; // 🔁 LOOP FINAL
    }

    state.step = "story";
    state.bIndex = 0;

    render();
}

/* =========================
   ANSWER
========================= */

function answer(i,c){
    if(i === c){
        alert("CORRECT");
    }else{
        alert("TRY AGAIN");
    }
}

/* =========================
   SPEECH
========================= */

function speak(t){
    if(!t) return;
    const s = new SpeechSynthesisUtterance(t);
    s.lang = "en-US";
    speechSynthesis.speak(s);
}

/* CSS ANIMATION INJECTION */
const style = document.createElement("style");
style.innerHTML = `
@keyframes breathe{
    0%{transform:scale(0.8)}
    50%{transform:scale(1.2)}
    100%{transform:scale(0.8)}
}`;
document.head.appendChild(style);
