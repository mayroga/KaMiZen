/**
 * 🧠 KAMIZEN ENGINE CORE — CLEAN STABLE VERSION (ROBUST FIXED)
 * JSON-driven system (NO AI explanations)
 * Sync with Flask backend + session.html
 */

const KamizenEngine = (() => {

    // =========================
    // 📊 GLOBAL STATE
    // =========================
    const state = {
        score: 0,
        mastery: 1,
        combo: 0,
        lang: "en",

        stats: {
            respect: 50,
            peace: 50,
            lead: 50,
            money: 100,
            happy: 50,
            safety: 100
        }
    };

    let gameMode = "idle";
    let isRunningMission = false;

    // =========================
    // 🔊 VOICE SYSTEM
    // =========================
    function speak(text) {
        if (!text) return;

        try {
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = state.lang === "es" ? "es-ES" : "en-US";
            msg.rate = 0.95;
            msg.pitch = 0.9;

            const voices = speechSynthesis.getVoices();

            const preferredVoice = voices.find(v =>
                v.lang === msg.lang &&
                v.name.toLowerCase().includes("female")
            );

            if (preferredVoice) msg.voice = preferredVoice;

            speechSynthesis.cancel();
            speechSynthesis.speak(msg);

        } catch (e) {
            console.error("VOICE ERROR:", e);
        }
    }

    // =========================
    // 🌐 API SAFE
    // =========================
    async function fetchNextMission() {
        try {
            const res = await fetch(`/api/mission/next?lang=${state.lang}`);

            if (!res.ok) {
                console.error("MISSION HTTP ERROR:", res.status);
                return null;
            }

            return await res.json();

        } catch (e) {
            console.error("Mission fetch error:", e);
            return null;
        }
    }

    async function fetchConfig() {
        try {
            const res = await fetch(`/api/config`);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error("Config fetch error:", e);
            return null;
        }
    }

    // =========================
    // 🎯 APPLY RESULT (SAFE)
    // =========================
    function applyMissionResult(option) {
        if (!option) return;

        state.score += option.score || 0;

        if (option.correct) {
            state.combo++;
            if (state.combo % 5 === 0) state.mastery++;
        } else {
            state.combo = 0;
            state.mastery = Math.max(1, state.mastery - 1);
        }

        updateHUD();
    }

    // =========================
    // 📊 HUD SAFE
    // =========================
    function updateHUD() {
        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        };

        set("score-box", state.score);
        set("mastery-lvl", `MASTERY x${state.mastery}`);

        const s = state.stats;

        set("v-respect", s.respect);
        set("v-peace", s.peace);
        set("v-lead", s.lead);
        set("v-money", s.money);
        set("v-safety", s.safety);
        set("v-happy", s.happy);

        const bar = document.getElementById("security-alert");
        if (bar) {
            if (s.safety < 40) {
                bar.style.background = "var(--neon-red)";
            } else if (s.safety < 75) {
                bar.style.background = "var(--neon-yellow)";
            } else {
                bar.style.background = "var(--neon-green)";
            }
        }
    }

    // =========================
    // 🧠 EXPLANATION SAFE
    // =========================
    function resolveExplanation(opt) {
        if (!opt) return "No explanation";

        const l = state.lang;

        const exp =
            (typeof opt.explanation === "object"
                ? opt.explanation?.[l]
                : opt.explanation) ||
            opt.explanation?.en ||
            "No explanation available";

        return exp;
    }

    // =========================
    // 🎮 MISSION FLOW (ROBUST FIX)
    // =========================
    async function runMissionUI() {

        if (isRunningMission) return;
        isRunningMission = true;

        try {
            gameMode = "question";

            const data = await fetchNextMission();

            if (!data || !data.options) {
                speak("Mission error");
                isRunningMission = false;
                return;
            }

            const overlay = document.getElementById("overlay");
            const grid = document.getElementById("decision-grid");
            const desc = document.getElementById("phase-desc");
            const title = document.getElementById("phase-title");

            if (!overlay || !grid || !desc || !title) {
                console.error("UI missing elements");
                isRunningMission = false;
                return;
            }

            title.innerText = data.theme || "MISSION";
            desc.innerText = data.story || "";

            speak(data.story);

            grid.innerHTML = "";

            data.options.forEach(opt => {

                const btn = document.createElement("button");
                btn.className = "choice-btn";
                btn.innerText = opt.text || "Option";

                btn.onclick = () => {

                    try {
                        applyMissionResult(opt);

                        const exp = resolveExplanation(opt);

                        desc.innerText = exp;
                        speak(exp);

                        grid.innerHTML = "";

                        setTimeout(() => {
                            overlay.style.display = "none";
                            isRunningMission = false;

                            if (window.onQuestionAnswered) {
                                window.onQuestionAnswered();
                            }

                        }, 2500);

                    } catch (e) {
                        console.error("OPTION ERROR:", e);
                        isRunningMission = false;
                    }
                };

                grid.appendChild(btn);
            });

            overlay.style.display = "flex";

        } catch (e) {
            console.error("MISSION FLOW ERROR:", e);
            isRunningMission = false;
        }
    }

    // =========================
    // 🎮 MODE CONTROL
    // =========================
    function setMode(mode) {
        gameMode = mode;
    }

    function getMode() {
        return gameMode;
    }

    function canSpawnWords() {
        return gameMode === "words";
    }

    // =========================
    // 🚀 INIT SAFE
    // =========================
    async function init() {
        try {
            const cfg = await fetchConfig();

            if (cfg) {
                console.log("⚙️ Config loaded");
            }

            speak("Kamizen system initialized.");
            updateHUD();

        } catch (e) {
            console.error("INIT ERROR:", e);
        }
    }

    // =========================
    // 📦 PUBLIC API
    // =========================
    return {
        state,
        speak,
        init,

        fetchNextMission,
        runMissionUI,
        applyMissionResult,

        updateHUD,

        setMode,
        getMode,
        canSpawnWords
    };

})();

// =========================
// 🔥 AUTO INIT SAFE
// =========================
document.addEventListener("DOMContentLoaded", () => {
    try {
        KamizenEngine.init();
    } catch (e) {
        console.error("ENGINE INIT FAIL:", e);
    }
});
