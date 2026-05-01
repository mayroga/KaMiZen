const Engine = (() => {

    /* =========================
       STATE ÚNICO
    ========================= */
    let state = {
        running: false,
        index: 1,
        busy: false
    };

    let ui = {
        centerText: null,
        timer: null
    };

    let timers = [];

    /* =========================
       INIT (SAFE DOM BIND)
    ========================= */
    function init(){

        ui.centerText = document.getElementById("centerText");
        ui.timer = document.getElementById("timer");

    }

    /* =========================
       START ENGINE (ONLY ONE LOOP)
    ========================= */
    async function start(){

        if(state.running) return;

        state.running = true;

        while(state.running){

            const data = await fetchSession();

            if(!data || !data.story){
                render("LOADING ERROR");
                await sleep(2000);
                continue;
            }

            state.index = data.index || 1;

            /* =========================
               1. STORY PHASE (ONLY story, NO stories confusion)
            ========================= */
            await storyPhase(data.story);

            /* =========================
               2. GAME PHASE (5 MIN)
            ========================= */
            await gamePhase(300);

            /* =========================
               3. MISSION PHASE
            ========================= */
            await missionPhase(data.mission);

            /* =========================
               4. GAME PHASE AGAIN
            ========================= */
            await gamePhase(300);

            /* =========================
               5. BREATHING PHASE
            ========================= */
            await breathingPhase(state.index);

            cleanup();
        }
    }

    /* =========================
       FETCH FROM MAIN.PY ONLY
    ========================= */
    async function fetchSession(){
        try{
            const res = await fetch("/api/session/start");
            return await res.json();
        }catch(e){
            console.error("FETCH ERROR", e);
            return null;
        }
    }

    /* =========================
       STORY PHASE (SAFE ACCESS)
    ========================= */
    async function storyPhase(story){

        const text =
            story?.en ||
            story?.es ||
            "NO STORY FOUND";

        render(text);
        speak(text);

        await sleep(5000);
        clear();
    }

    /* =========================
       MISSION PHASE (SAFE ACCESS)
    ========================= */
    async function missionPhase(mission){

        const text =
            mission?.t?.en ||
            mission?.en ||
            mission?.b?.[0]?.tx?.en ||
            "NO MISSION";

        render(text);

        await sleep(5000);
        clear();
    }

    /* =========================
       GAME PHASE (CONTROLLED LOOP)
    ========================= */
    async function gamePhase(seconds){

        return new Promise(resolve => {

            let t = seconds;

            const id = setInterval(() => {

                t--;

                if(ui.timer){
                    ui.timer.innerText = formatTime(t);
                }

                spawnWord();

                if(t <= 0){
                    clearInterval(id);
                    resolve();
                }

            }, 1000);

            timers.push(id);
        });
    }

    /* =========================
       WORD SYSTEM (NO OVERFLOW)
    ========================= */
    function spawnWord(){

        const words = [
            "FOCUS","CALM","TRUTH","CONTROL","AWARENESS"
        ];

        const el = document.createElement("div");
        el.className = "word";
        el.innerText = words[Math.floor(Math.random()*words.length)];

        el.style.left = Math.random() * 90 + "%";
        el.style.top = (Math.random() * 70 + 10) + "%";

        el.onclick = () => {

            el.style.transform = "scale(2)";
            el.style.opacity = "0";

            setTimeout(() => el.remove(), 200);

        };

        document.body.appendChild(el);

        setTimeout(() => el.remove(), 5000);
    }

    /* =========================
       BREATHING PHASE (PROGRESSIVE CONTROL)
    ========================= */
    async function breathingPhase(index){

        let t = Math.min(20 + index * 2, 180);

        return new Promise(resolve => {

            const id = setInterval(() => {

                t--;

                render((t % 2 === 0) ? "INHALE" : "EXHALE");

                if(t <= 0){
                    clearInterval(id);
                    resolve();
                }

            }, 1000);

            timers.push(id);
        });
    }

    /* =========================
       SPEECH ENGINE (SAFE)
    ========================= */
    function speak(text){

        if(!text) return;

        try{
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = "en-US";
            msg.rate = 1;

            speechSynthesis.speak(msg);
        }catch(e){}
    }

    /* =========================
       UI HELPERS
    ========================= */
    function render(text){
        if(ui.centerText){
            ui.centerText.innerText = text || "";
        }
    }

    function clear(){
        if(ui.centerText){
            ui.centerText.innerText = "";
        }
    }

    function formatTime(s){
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    }

    function sleep(ms){
        return new Promise(r => setTimeout(r, ms));
    }

    function cleanup(){
        timers.forEach(t => clearInterval(t));
        timers = [];
    }

    function stop(){
        state.running = false;
        cleanup();
    }

    /* =========================
       PUBLIC API
    ========================= */
    return {
        init,
        start,
        stop
    };

})();
