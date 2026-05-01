const Engine = (() => {

    /* =========================
       STATE GLOBAL (ÚNICO)
    ========================= */
    let state = {
        index: 1,
        running: false,
        phase: "idle"
    };

    let ui = {
        centerText: null,
        timer: null
    };

    let intervals = [];

    /* =========================
       INIT
    ========================= */
    function init(){
        ui.centerText = document.getElementById("centerText");
        ui.timer = document.getElementById("timer");
    }

    /* =========================
       START ENGINE
    ========================= */
    async function start(){

        if(state.running) return;

        state.running = true;

        while(state.running){

            const data = await fetchData();

            if(!data){
                await sleep(2000);
                continue;
            }

            state.index = data.index || 1;

            await storyPhase(data.story);
            await gamePhase(300);
            await missionPhase(data.mission);
            await gamePhase(300);
            await breathingPhase(state.index);

            cleanup();
        }
    }

    /* =========================
       FETCH DATA (FROM FLASK)
    ========================= */
    async function fetchData(){
        try{
            const res = await fetch("/api/session/start");
            return await res.json();
        }catch(e){
            console.error("Fetch error", e);
            return null;
        }
    }

    /* =========================
       STORY PHASE
    ========================= */
    async function storyPhase(story){

        const text = story?.en || "NO STORY";

        render(text);

        await speak(text);

        await sleep(5000);

        clearText();
    }

    /* =========================
       MISSION PHASE
    ========================= */
    async function missionPhase(mission){

        const text =
            mission?.b?.[0]?.tx?.en ||
            mission?.en ||
            "MISSION";

        render(text);

        await sleep(5000);

        clearText();
    }

    /* =========================
       GAME PHASE (CONTROLLED)
    ========================= */
    async function gamePhase(seconds){

        return new Promise(resolve => {

            let t = seconds;

            const timer = setInterval(() => {

                t--;

                ui.timer.innerText = formatTime(t);

                spawnWord();

                if(t <= 0){
                    clearInterval(timer);
                    resolve();
                }

            }, 1000);

            intervals.push(timer);
        });
    }

    /* =========================
       WORD SPAWN (NO OVERFLOW)
    ========================= */
    function spawnWord(){

        const words = ["FOCUS","CALM","TRUTH","CONTROL","POWER"];

        const el = document.createElement("div");
        el.className = "word";
        el.innerText = words[Math.floor(Math.random()*words.length)];

        el.style.left = Math.random()*window.innerWidth + "px";
        el.style.top = (window.innerHeight - 80) + "px";

        el.onclick = () => {
            el.style.transform = "scale(2)";
            el.style.opacity = "0";
            setTimeout(()=>el.remove(),200);
        };

        document.body.appendChild(el);

        setTimeout(()=>el.remove(),5000);
    }

    /* =========================
       BREATHING PHASE
    ========================= */
    async function breathingPhase(index){

        let t = 20;

        return new Promise(resolve => {

            const b = setInterval(() => {

                t--;

                ui.centerText.innerText =
                    (t % 2 === 0) ? "INHALE" : "EXHALE";

                if(t <= 0){
                    clearInterval(b);
                    resolve();
                }

            }, 1000);

            intervals.push(b);
        });
    }

    /* =========================
       SPEECH (SAFE)
    ========================= */
    function speak(text){

        return new Promise(resolve => {

            if(!text){
                resolve();
                return;
            }

            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = "en-US";
            msg.rate = 1;

            msg.onend = resolve;

            speechSynthesis.speak(msg);
        });
    }

    /* =========================
       UI HELPERS
    ========================= */
    function render(text){
        ui.centerText.innerText = text || "";
    }

    function clearText(){
        ui.centerText.innerText = "";
    }

    function formatTime(s){
        const m = Math.floor(s/60);
        const sec = s % 60;
        return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    }

    function sleep(ms){
        return new Promise(r => setTimeout(r, ms));
    }

    function cleanup(){
        intervals.forEach(i => clearInterval(i));
        intervals = [];
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
