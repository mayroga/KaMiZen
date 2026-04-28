const KamizenEngine = (() => {

    const state = {
        lang: "en",

        phase: "FLOAT_5",

        timer: 300, // 5 min inicial

        floatTimer: 300,
        extendedTimer: 600,
        silenceTimer: 120,

        stats: {
            respect: 50,
            peace: 50,
            lead: 50,
            money: 100,
            happy: 50,
            safety: 100
        },

        score: 0,
        spawnRate: 1300,

        lockInput: false,
        silenceLocked: false
    };

    // =========================
    // 🌐 LANGUAGE
    // =========================
    function toggleLang() {
        state.lang = (state.lang === "en") ? "es" : "en";
        const btn = document.getElementById("lang-btn");
        if (btn) btn.innerText = state.lang.toUpperCase();
    }

    function getLang() {
        return state.lang;
    }

    // =========================
    // 🔊 VOICE
    // =========================
    function speak(text) {
        if (!text) return;
        try {
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = state.lang === "es" ? "es-ES" : "en-US";
            msg.rate = 0.9;
            msg.pitch = 0.9;
            speechSynthesis.cancel();
            speechSynthesis.speak(msg);
        } catch (e) {}
    }

    // =========================
    // 🫁 BREATH SYSTEM VISUAL CONTROL
    // =========================
    function breath(type) {
        const circle = document.getElementById("breath-circle");
        if (!circle) return;

        circle.style.display = "flex";

        let map = {
            inhale: "INHALE",
            hold: "HOLD",
            exhale: "EXHALE",
            silence: "SILENCE"
        };

        circle.innerText = map[type] || type.toUpperCase();
    }

    // =========================
    // 📊 UPDATE STATS UI
    // =========================
    function updateStatsUI() {
        for (let k in state.stats) {
            let el = document.getElementById("v-" + k);
            if (el) el.innerText = state.stats[k];
        }
    }

    // =========================
    // 📈 APPLY WORD RESULT
    // =========================
    function applyWord(type) {
        state.score++;

        if (type === "money") state.stats.money++;
        if (type === "business") state.stats.lead++;
        if (type === "growth") state.stats.happy++;
        if (type === "power") state.stats.respect++;
        if (type === "risk") state.stats.safety--;
        if (type === "silence") state.stats.peace++;

        updateStatsUI();
    }

    // =========================
    // ⏱️ TIMER ENGINE
    // =========================
    setInterval(() => {

        // FLOAT 5 MIN
        if (state.phase === "FLOAT_5") {
            state.floatTimer--;
            if (state.floatTimer <= 0) {
                startExtended();
            }
        }

        // EXTENDED 10 MIN
        else if (state.phase === "EXTENDED") {
            state.extendedTimer--;

            if (state.extendedTimer % 120 === 0) {
                triggerMiniMission();
            }

            if (state.extendedTimer <= 0) {
                startMission();
            }
        }

        // SILENCE
        else if (state.phase === "SILENCE") {
            state.silenceTimer--;

            breathCycle();

            if (state.silenceTimer <= 0) {
                allowContinue();
            }
        }

        updateHUD();

    }, 1000);

    // =========================
    // 🫁 BREATH CYCLE AUTOMATIC
    // =========================
    let breathStep = 0;
    function breathCycle() {
        const steps = ["inhale", "hold", "exhale"];
        breath(steps[breathStep]);
        breathStep = (breathStep + 1) % steps.length;
    }

    // =========================
    // 🌟 PHASE SWITCHING
    // =========================
    function startExtended() {
        state.phase = "EXTENDED";
        state.extendedTimer = 600;
        speak("Extended training started");
    }

    function startMission() {
        state.phase = "MISSION";
        speak("Mission phase starting");
        triggerQuestion();
    }

    function startSilence() {
        state.phase = "SILENCE";
        state.silenceTimer = 120;
        state.lockInput = true;
        state.silenceLocked = true;

        speak(state.lang === "es"
            ? "Entrenamiento de silencio activado"
            : "Silence training activated"
        );
    }

    function allowContinue() {
        const overlay = document.getElementById("overlay");

        const warn = state.lang === "es"
            ? "Si continúas sin disciplina, solo tendrás 45 segundos de juego libre"
            : "If you continue without discipline, only 45 seconds free play";

        speak(warn);
        alert(warn);

        state.lockInput = false;
        state.silenceLocked = false;

        overlay.style.display = "none";
        state.phase = "FLOAT_5";
        state.floatTimer = 300;
    }

    // =========================
    // ⚠️ MINI INTERRUPTION
    // =========================
    function triggerMiniMission() {
        if (state.phase !== "EXTENDED") return;
        triggerQuestion();
    }

    // =========================
    // 🧠 FETCH MISSION (FROM HTML SYSTEM)
    // =========================
    async function fetchMission() {
        try {
            const res = await fetch(`/api/mission/next?lang=${state.lang}`);
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    // =========================
    // 📊 HUD CONTROL
    // =========================
    function updateHUD() {
        const timer = document.getElementById("timer-box");

        if (timer) {
            let t = 0;

            if (state.phase === "FLOAT_5") t = state.floatTimer;
            if (state.phase === "EXTENDED") t = state.extendedTimer;
            if (state.phase === "SILENCE") t = state.silenceTimer;

            let m = Math.floor(t / 60);
            let s = t % 60;

            timer.innerText =
                String(m).padStart(2, "0") + ":" +
                String(s).padStart(2, "0");
        }

        const score = document.getElementById("score-box");
        if (score) score.innerText = state.score;
    }

    // =========================
    // 🌐 PUBLIC API
    // =========================
    return {
        state,
        toggleLang,
        getLang,
        speak,
        breath,
        applyWord,
        fetchMission,
        updateHUD,
        startSilence
    };

})();

window.KamizenEngine = KamizenEngine;
