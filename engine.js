const KamizenEngine = (() => {

    const state = {
        lang: "en"
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
    // 🔊 SIMPLE VOICE (OPTIONAL)
    // =========================
    function speak(text) {
        if (!text) return;
        try {
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = state.lang === "es" ? "es-ES" : "en-US";
            speechSynthesis.cancel();
            speechSynthesis.speak(msg);
        } catch (e) {}
    }

    // =========================
    // 🌐 FETCH MISSION ONLY
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
    // 📦 MINIMAL APPLY (NO HUD)
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

    return {
        state,
        toggleLang,
        getLang,
        speak,
        fetchMission,
        applyResult
    };

})();

// expose
window.KamizenEngine = KamizenEngine;
