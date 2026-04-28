const KamizenEngine = (() => {

    const state = {
        lang: "en",
        silenceActive: false,
        silenceTimer: 0,
        silenceInterval: null
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
    // 🔊 VOZ MASCULINA CALMADA (EN/ES PERFECTO)
    // =========================
    function speak(text) {
        if (!text) return;

        try {
            let msg = new SpeechSynthesisUtterance(text);

            msg.lang = (state.lang === "es") ? "es-ES" : "en-US";

            let voices = speechSynthesis.getVoices();

            let maleVoice =
                voices.find(v => v.name.toLowerCase().includes("male")) ||
                voices.find(v => v.name.toLowerCase().includes("daniel")) ||
                voices.find(v => v.name.toLowerCase().includes("google")) ||
                voices[0];

            if (maleVoice) msg.voice = maleVoice;

            msg.pitch = 0.75;   // grave = masculino calmado
            msg.rate = 0.95;    // lento controlado

            speechSynthesis.cancel();
            speechSynthesis.speak(msg);

        } catch (e) {}
    }

    // =========================
    // 🌐 FETCH MISSION
    // =========================
    async function fetchMission() {
        try {
            const res = await fetch(`/api/mission/next?lang=${state.lang}`);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    // =========================
    // 📦 APPLY RESULT
    // =========================
    function applyResult(stateRef, opt) {
        if (!opt || !stateRef) return;

        stateRef.score += opt.score || 0;

        if (opt.correct) {
            stateRef.stats.respect++;
            stateRef.stats.happy++;
        } else {
            stateRef.stats.safety--;
        }
    }

    // =========================
    // 🧠 SILENCE MODE ENGINE (NEW CORE)
    // =========================
    function startSilence(data) {

        state.silenceActive = true;
        state.silenceTimer = data.d || 60;

        let circle = document.getElementById("breath-circle");
        let text = document.getElementById("breath-text");
        let science = document.getElementById("breath-science");
        let timer = document.getElementById("breath-timer");

        if (!circle) return;

        circle.style.display = "flex";

        if (science) {
            science.innerText =
                data.inf?.[state.lang] ||
                data.inf?.en ||
                "Neural regulation active";
        }

        const phases = ["INHALE", "HOLD", "EXHALE", "SILENCE"];
        let i = 0;

        clearInterval(state.silenceInterval);

        state.silenceInterval = setInterval(() => {

            if (timer) timer.innerText = state.silenceTimer + "s";

            if (text) text.innerText = phases[i % phases.length];
            i++;

            state.silenceTimer--;

            if (state.silenceTimer <= 0) {
                clearInterval(state.silenceInterval);
                circle.style.display = "none";
                state.silenceActive = false;
            }

        }, 1000);
    }

    // =========================
    // 🔒 BLOCK CHECK (USE IN FRONTEND)
    // =========================
    function isBlocked() {
        return state.silenceActive;
    }

    return {
        state,
        toggleLang,
        getLang,
        speak,
        fetchMission,
        applyResult,
        startSilence,
        isBlocked
    };

})();

// expose global
window.KamizenEngine = KamizenEngine;
