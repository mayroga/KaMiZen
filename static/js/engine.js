/* =========================================
   KAMIZEN ENGINE CORE — UPDATED VERSION
   File: static/js/engine.js
   Handles session flow, state, timing, API sync
   ========================================= */

const KamizenEngine = (() => {

    // =========================
    // STATE
    // =========================
    let state = {
        userName: null,
        missionIndex: 1,
        phase: "idle",
        isRunning: false
    };

    // =========================
    // INIT FROM LOCAL STORAGE
    // =========================
    function init(){
        state.userName = localStorage.getItem("kamizen_name") || null;
        state.missionIndex = parseInt(localStorage.getItem("mission_index") || "1");
    }

    // =========================
    // SAVE STATE
    // =========================
    function save(){
        localStorage.setItem("kamizen_name", state.userName);
        localStorage.setItem("mission_index", state.missionIndex);
    }

    // =========================
    // START SESSION
    // =========================
    async function startSession(){

        if(state.isRunning) return;
        state.isRunning = true;

        try {
            const res = await fetch("/api/session/start");
            const data = await res.json();

            state.missionIndex = data.index;
            save();

            await runStory(data.story);
            await runFloatingPhase(300);
            await runMission(data.mission);
            await runFloatingPhase(300);
            await runBreathingPhase(state.missionIndex);

            endSession();

        } catch(err){
            console.error("Engine error:", err);
        }

        state.isRunning = false;
    }

    // =========================
    // STORY
    // =========================
    function runStory(story){
        return new Promise(resolve => {

            if(!story){ resolve(); return; }

            const el = document.getElementById("centerText");
            if(!el){ resolve(); return; }

            el.innerText = story?.story?.en || "";

            setTimeout(() => {
                el.innerText = "";
                resolve();
            }, 5000);
        });
    }

    // =========================
    // MISSION
    // =========================
    function runMission(mission){
        return new Promise(resolve => {

            if(!mission){ resolve(); return; }

            const el = document.getElementById("centerText");
            if(!el){ resolve(); return; }

            const title = mission?.b?.[0]?.tx?.en || "MISSION";

            el.innerText = title;

            setTimeout(() => {
                el.innerText = "";
                resolve();
            }, 6000);
        });
    }

    // =========================
    // FLOATING GAME PHASE
    // =========================
    function runFloatingPhase(duration){
        return new Promise(resolve => {

            let time = duration;
            const timerEl = document.getElementById("timer");

            const words = ["FOCUS","CALM","TRUTH","CONTROL","AWARENESS","BREATH"];

            const interval = setInterval(() => {

                time--;

                if(timerEl) timerEl.innerText = time;

                spawnWord(words);

                if(time <= 0){
                    clearInterval(interval);
                    resolve();
                }

            }, 1000);
        });
    }

    function spawnWord(words){
        const word = document.createElement("div");
        word.className = "word";

        word.innerText = words[Math.floor(Math.random()*words.length)];

        word.style.position = "absolute";
        word.style.left = Math.random() * window.innerWidth + "px";
        word.style.top = Math.random() * window.innerHeight + "px";

        document.body.appendChild(word);

        setTimeout(() => {
            word.remove();
        }, 5000);
    }

    // =========================
    // BREATHING + SILENCE
    // =========================
    function runBreathingPhase(index){
        return new Promise(resolve => {

            let silenceTime = Math.min(30 + (index * 5), 180);

            let t = 30;
            const center = document.getElementById("centerText");

            const breath = setInterval(() => {

                if(center) center.innerText = (t % 2 === 0) ? "INHALE" : "EXHALE";

                t--;

                if(t <= 0){
                    clearInterval(breath);
                    runSilence(silenceTime, resolve);
                }

            }, 1000);
        });
    }

    function runSilence(seconds, resolve){

        let t = seconds;
        const timerEl = document.getElementById("timer");
        const center = document.getElementById("centerText");

        if(center) center.innerText = "SILENCE";

        const s = setInterval(() => {

            t--;

            if(timerEl) timerEl.innerText = t;

            if(t <= 0){
                clearInterval(s);
                resolve();
            }

        }, 1000);
    }

    // =========================
    // END SESSION
    // =========================
    function endSession(){

        const el = document.getElementById("centerText");

        if(el) el.innerText = "SESSION COMPLETE";

        setTimeout(() => {
            window.location.reload();
        }, 4000);
    }

    // =========================
    // PUBLIC API
    // =========================
    return {
        init,
        startSession,
        getState: () => state
    };

})();

// Auto init
window.addEventListener("load", () => {
    KamizenEngine.init();
});
