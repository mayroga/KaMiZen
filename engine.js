const KamizenEngine = (() => {

const state = {
    score: 0,
    lang: "en",
    mission: null,
    locked: false,
    silenceActive: false,
    silenceTime: 180
};

const Lock = {
    on(){ state.locked = true; document.body.style.pointerEvents="none"; },
    off(){ state.locked = false; document.body.style.pointerEvents="auto"; },
    is(){ return state.locked; }
};

const AudioSystem = {
    init(){
        this.bg = document.getElementById("bg");
        this.ok = document.getElementById("ok");
        this.bad = document.getElementById("bad");

        if(this.bg){
            this.bg.volume = 0.3;
            this.bg.play().catch(()=>{});
        }
    },
    play(type){
        if(type==="win") this.ok?.play();
        if(type==="bad") this.bad?.play();
    }
};

const Speech = {
    say(text){
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = state.lang==="en"?"en-US":"es-ES";
        u.rate = 0.9;
        speechSynthesis.speak(u);
    }
};

const UI = {
    setText(id,val){
        const el = document.getElementById(id);
        if(el) el.innerText = val;
    },

    updateScore(){
        this.setText("score-display","PUNTOS: "+state.score);
    },

    clearOptions(){
        const el = document.getElementById("options");
        if(el) el.innerHTML = "";
    },

    showBreath(show){
        const el = document.getElementById("breath");
        if(el) el.style.display = show?"block":"none";
    },

    renderOptions(options){
        const container = document.getElementById("options");
        container.innerHTML = "";

        options.forEach(opt=>{
            const b = document.createElement("button");
            b.className = "opt-btn";
            b.innerText = opt.text[state.lang];
            b.onclick = ()=>Decision.handle(opt);
            container.appendChild(b);
        });
    }
};

const FloatingWords = {
    start(){
        setInterval(()=>this.spawn(),2000);
    },

    spawn(){
        const types = [
            {cls:"word-good",val:10,words:["TRUTH","POWER","FOCUS"]},
            {cls:"word-bad",val:-10,words:["FEAR","LIE","CHAOS"]},
            {cls:"word-neutral",val:0,words:["CITY","WAIT","WALK"]}
        ];

        const t = types[Math.floor(Math.random()*types.length)];
        const el = document.createElement("div");

        el.className = "floating "+t.cls;
        el.innerText = t.words[Math.floor(Math.random()*t.words.length)];
        el.style.left = Math.random()*90+"vw";

        el.onclick = ()=>{
            state.score += t.val;
            UI.updateScore();
            AudioSystem.play(t.val>=0?"win":"bad");
            el.remove();
        };

        document.body.appendChild(el);
        setTimeout(()=>el.remove(),5000);
    }
};

const Mission = {
    async loadNext(){
        try{
            const r = await fetch("/api/mission/next");
            state.mission = await r.json();
            this.render(state.mission);
        }catch(e){
            UI.setText("story","ERROR MISSION");
        }
    },

    render(m){
        const story = m.blocks.find(b=>b.type==="story").text[state.lang];
        const analysis = m.blocks.find(b=>b.type==="analysis").text[state.lang];

        UI.setText("story",story);
        Speech.say(story);

        setTimeout(()=>{
            UI.setText("analysis",analysis);
            Speech.say(analysis);
        },3000);

        setTimeout(()=>{
            UI.renderOptions(m.blocks.find(b=>b.type==="decision").options);
        },6000);
    }
};

const Decision = {
    handle(opt){
        Lock.on();

        const box = document.getElementById("explanation-box");
        box.style.display="block";
        box.innerText = opt.explanation[state.lang];

        if(opt.correct){
            document.body.style.background="#004400";
            state.score += 20;
            AudioSystem.play("win");
        }else{
            document.body.style.background="#440000";
            state.score -= 10;
            AudioSystem.play("bad");
        }

        UI.updateScore();

        setTimeout(()=>{
            document.body.style.background="";
            box.style.display="none";
            Silence.start();
        },3500);
    }
};

const Silence = {
    start(){
        state.silenceActive = true;
        UI.clearOptions();

        Speech.say("Silence mode");

        setTimeout(()=>{
            state.silenceActive = false;
            Lock.off();
            Mission.loadNext();
        },5000);
    }
};

return {
    init(){
        AudioSystem.init();
        FloatingWords.start();
        Mission.loadNext();
    },

    toggleLang(){
        state.lang = state.lang==="en"?"es":"en";
        if(state.mission) Mission.render(state.mission);
    }
};

})();

window.onload = ()=>KamizenEngine.init();
