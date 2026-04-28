const KamizenEngine = (() => {

    // =========================
    // 🧠 CORE STATE (MINIMAL)
    // =========================
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
    // 🔊 VOICE (SAFE)
    // =========================
    function speak(text) {
        if (!text) return;

        try {
            const msg = new SpeechSynthesisUtterance(text);

            msg.lang = state.lang === "es"
                ? "es-ES"
                : "en-US";

            msg.rate = 0.9;
            msg.pitch = 0.9;

            speechSynthesis.cancel();
            speechSynthesis.speak(msg);

        } catch (e) {
            // silent fail
        }
    }

    // =========================
    // 🌐 FETCH MISSION
    // =========================
    async function fetchMission() {

        try {
            const res = await fetch(`/api/mission/next?lang=${state.lang}`);

            if (!res.ok) {
                console.warn("Mission fetch failed:", res.status);
                return null;
            }

            const data = await res.json();

            if (!data || !data.options) {
                console.warn("Invalid mission data");
                return null;
            }

            return data;

        } catch (e) {
            console.warn("Fetch error:", e);
            return null;
        }
    }

    // =========================
    // 📊 APPLY RESULT (PURE LOGIC)
    // =========================
    function applyResult(localState, opt) {

        if (!localState || !opt) return;

        // score base
        if (opt.correct) {
            localState.score += 30;

            if (localState.stats) {
                localState.stats.respect++;
                localState.stats.happy++;
            }

        } else {
            localState.score -= 20;

            if (localState.stats) {
                localState.stats.safety--;
            }
        }
    }

    // =========================
    // 🛡 SAFE WRAPPER (OPTIONAL)
    // =========================
    function safeApply(localState, opt) {
        try {
            applyResult(localState, opt);
        } catch (e) {
            console.warn("applyResult error:", e);
        }
    }

    // =========================
    // 🌐 PUBLIC API
    // =========================
    return {
        state,
        toggleLang,
        getLang,
        speak,
        fetchMission,
        applyResult: safeApply
    };

})();

// =========================
// 🌐 GLOBAL EXPORT
// =========================
window.KamizenEngine = KamizenEngine;
