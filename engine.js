/**
 * 🧠 KAMIZEN ENGINE CORE — STABLE SYNC VERSION
 * Conectado a session.html + Flask backend
 * Controla: estado, voz, API, efectos
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

    // =========================
    // 🔊 VOICE SYSTEM
    // =========================
    function speak(text) {
        if (!text) return;

        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = "en-US";
        msg.rate = 0.95;
        msg.pitch = 0.9;

        const voices = speechSynthesis.getVoices();
        const male = voices.find(v =>
            v.lang === "en-US" &&
            v.name.toLowerCase().includes("male")
        );

        if (male) msg.voice = male;

        speechSynthesis.cancel();
        speechSynthesis.speak(msg);
    }

    // =========================
    // 🌐 API
    // =========================
    async function fetchNextMission() {
        try {
            const res = await fetch(`/api/mission/next?lang=${state.lang}`);
            return await res.json();
        } catch (e) {
            console.error("Mission fetch error:", e);
            return null;
        }
    }

    async function fetchConfig() {
        try {
            const res = await fetch(`/api/config`);
            return await res.json();
        } catch (e) {
            console.error("Config fetch error:", e);
            return null;
        }
    }

    // =========================
    // 🎯 APPLY MISSION RESULT
    // =========================
    function applyMissionResult(option) {
        if (!option) return;

        state.score += option.score || 0;

        if (option.correct) {
            state.combo++;
            if (state.combo % 5 === 0) state.mastery++;
        } else {
            state.combo = 0;
            state.mastery = 1;
        }

        updateHUD();
    }

    // =========================
    // 📊 HUD UPDATE
    // =========================
    function updateHUD() {
        const scoreBox = document.getElementById("score-box");
        const masteryBox = document.getElementById("mastery-lvl");

        if (scoreBox) scoreBox.innerText = state.score;
        if (masteryBox) masteryBox.innerText = `MASTERY x${state.mastery}`;

        // stats
        const s = state.stats;
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        set("v-respect", s.respect);
        set("v-peace", s.peace);
        set("v-lead", s.lead);
        set("v-money", s.money);
        set("v-safety", s.safety);
        set("v-happy", s.happy);

        // barra seguridad
        const sBar = document.getElementById("security-alert");
        if (sBar) {
            if (s.safety < 40) {
                sBar.style.background = "var(--neon-red)";
            } else if (s.safety < 75) {
                sBar.style.background = "var(--neon-yellow)";
            } else {
                sBar.style.background = "var(--neon-green)";
            }
        }
    }

    // =========================
    // 🧠 QUESTION FLOW (BACKEND)
    // =========================
    async function runMissionUI() {

        gameMode = "question";

        const data = await fetchNextMission();
        if (!data) {
            speak("Error loading mission");
            return;
        }

        const overlay = document.getElementById("overlay");
        const grid = document.getElementById("decision-grid");
        const desc = document.getElementById("phase-desc");
        const title = document.getElementById("phase-title");

        title.innerText = data.theme || "MISSION";
        desc.innerText = data.story || "";

        speak(data.story);

        grid.innerHTML = "";

        data.options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "choice-btn";
            btn.innerText = opt.text;

            btn.onclick = () => {

                applyMissionResult(opt);

                desc.innerText = opt.explanation;
                speak(opt.explanation);

                setTimeout(() => {
                    overlay.style.display = "none";
                    if (window.onQuestionAnswered) {
                        window.onQuestionAnswered();
                    }
                }, 3500);
            };

            grid.appendChild(btn);
        });

        overlay.style.display = "flex";
    }

    // =========================
    // 🎮 WORD FILTER (SYNC)
    // =========================
    function canSpawnWords() {
        return gameMode === "words";
    }

    // =========================
    // 🎯 MODE CONTROL
    // =========================
    function setMode(mode) {
        gameMode = mode;
    }

    function getMode() {
        return gameMode;
    }

    // =========================
    // 🚀 INIT
    // =========================
    async function init() {
        const cfg = await fetchConfig();
        if (cfg) {
            console.log("⚙️ Config loaded:", cfg);
        }

        speak("Kamizen system initialized.");
        updateHUD();
    }

    // =========================
    // 📦 PUBLIC API
    // =========================
    return {
        state,
        speak,
        init,

        fetchNextMission,
        applyMissionResult,

        runMissionUI,

        updateHUD,

        setMode,
        getMode,
        canSpawnWords
    };

})();

// =========================
// 🔥 AUTO INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
    KamizenEngine.init();
});
