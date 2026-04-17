// ==============================
// KAMIZEN ENGINE CORE V1
// SINGLE SOURCE OF TRUTH GAME ENGINE
// ==============================

const KamizenEngine = (() => {

    // =========================
    // STATE (CENTRAL BRAIN)
    // =========================
    let state = {
        missionId: 1,
        locked: false,
        lang: "en",
        score: 0,
        hero: "",
        realName: "",
        currentMission: null,
        floatingWords: [],
        silenceActive: false,
        audioEnabled: true,
        tvidActive: false
    };

    // =========================
    // AUDIO MANAGER
    // =========================
    const AudioManager = {
        bg: null,
        ok: null,
        bad: null,

        init() {
            this.bg = document.getElementById("bg");
            this.ok = document.getElementById("ok");
            this.bad = document.getElementById("bad");

            if (this.bg) {
                this.bg.loop = true;
                this.bg.volume = 0.3;
                this.bg.play().catch(() => {});
            }
        },

        play(type) {
            if (!state.audioEnabled) return;

            if (type === "ok" && this.ok) this.ok.play();
            if (type === "bad" && this.bad) this.bad.play();
        },

        stopAll() {
            if (this.bg) this.bg.pause();
        }
    };

    // =========================
    // UI LOCK SYSTEM (CRITICAL)
    // =========================
    const LockSystem = {
        lock() {
            state.locked = true;
            document.body.style.pointerEvents = "none";
        },

        unlock() {
            state.locked = false;
            document.body.style.pointerEvents = "auto";
        },

        isLocked() {
            return state.locked;
        }
    };

    // =========================
    // STATE CONTROL
    // =========================
    const setState = (newState) => {
        state = { ...state, ...newState };
    };

    const getState = () => state;

    // =========================
    // MISSION SYSTEM
    // =========================
    const MissionSystem = {

        async loadMission(id) {
            try {
                LockSystem.lock();

                const res = await fetch(`/api/mission/${id}`);
                const data = await res.json();

                state.currentMission = data;
                state.missionId = id;

                if (data.ui?.floating_words) {
                    state.floatingWords = data.ui.floating_words;
                }

                return data;

            } catch (e) {
                console.error("Mission load error:", e);
                return null;
            } finally {
                LockSystem.unlock();
            }
        },

        next() {
            state.missionId = state.missionId + 1;
            if (state.missionId > 35) state.missionId = 1;
            return state.missionId;
        }
    };

    // =========================
    // TVID ENGINE (INTELLIGENT ROUTER)
    // =========================
    const TVidEngine = {

        async run(mission, correct) {
            if (!mission) return;

            state.tvidActive = true;
            LockSystem.lock();

            let theme = (mission.theme || "").toUpperCase();

            let type = "DEFAULT";

            if (theme.includes("ANGER")) type = "ANGER";
            if (theme.includes("FEAR") || theme.includes("COURAGE")) type = "FEAR";
            if (theme.includes("DIGITAL")) type = "DIGITAL";
            if (theme.includes("TRUTH")) type = "TRUTH";
            if (theme.includes("PRESSURE")) type = "PRESSURE";

            UI.showOverlay("TVID ACTIVE", "Processing behavioral response...");

            switch (type) {

                case "ANGER":
                    await BreathingSystem.run(3, "Control anger through breath");
                    Speech.speak("Control your reaction. Return to calm.");
                    break;

                case "FEAR":
                    await BreathingSystem.run(3, "Fear is a signal");
                    Speech.speak("Fear is not danger. It is information.");
                    break;

                case "DIGITAL":
                    await BreathingSystem.run(2, "Recover attention");
                    Speech.speak("Take back your attention.");
                    break;

                case "TRUTH":
                    await BreathingSystem.run(2, "Truth alignment");
                    Speech.speak("Truth builds identity.");
                    break;

                case "PRESSURE":
                    await BreathingSystem.run(4, "Decision clarity");
                    Speech.speak("Pause creates intelligence.");
                    break;

                default:
                    await BreathingSystem.run(2, "Reset awareness");
                    Speech.speak("Return to awareness.");
            }

            UI.hideOverlay();

            state.tvidActive = false;
            LockSystem.unlock();
        }
    };

    // =========================
    // BREATHING SYSTEM (SYNCED)
    // =========================
    const BreathingSystem = {

        async run(cycles, reason) {
            console.log("Breathing:", reason);

            for (let i = 0; i < cycles; i++) {
                Speech.speak("Inhale");
                UI.setBreath("in");

                await Utils.wait(3000);

                Speech.speak("Exhale");
                UI.setBreath("out");

                await Utils.wait(3000);
            }
        }
    };

    // =========================
    // SILENCE SYSTEM
    // =========================
    const SilenceSystem = {

        async start(durationSeconds) {
            state.silenceActive = true;
            LockSystem.lock();

            UI.showOverlay("SILENCE MODE", `Stay silent for ${durationSeconds} seconds`);

            let t = durationSeconds;

            while (t > 0) {
                UI.updateSilence(t);
                await Utils.wait(1000);
                t--;
            }

            state.silenceActive = false;
            LockSystem.unlock();

            UI.hideOverlay();
            Speech.speak("Silence complete");
        }
    };

    // =========================
    // FLOATING WORDS
    // =========================
    const FloatingSystem = {

        start() {
            setInterval(() => {
                if (!state.floatingWords.length) return;
                if (state.locked) return;

                const w = document.createElement("div");
                w.className = "floating";
                w.innerText = state.floatingWords[
                    Math.floor(Math.random() * state.floatingWords.length)
                ];

                w.style.left = Math.random() * 100 + "vw";

                document.body.appendChild(w);

                setTimeout(() => w.remove(), 4000);

            }, 1200);
        }
    };

    // =========================
    // UI SYSTEM
    // =========================
    const UI = {

        showOverlay(title, text) {
            const o = document.getElementById("overlay");
            document.getElementById("overlayTitle").innerText = title;
            document.getElementById("overlayText").innerText = text;
            o.style.display = "flex";
        },

        hideOverlay() {
            document.getElementById("overlay").style.display = "none";
        },

        setBreath(state) {
            const b = document.getElementById("breath");

            if (!b) return;

            if (state === "in") {
                b.style.transform = "scale(1.5)";
                b.style.background = "#00f2ff";
            }

            if (state === "out") {
                b.style.transform = "scale(1)";
                b.style.background = "#0044ff";
            }
        },

        updateSilence(t) {
            const el = document.getElementById("story");
            if (el) el.innerText = `Silence: ${t}s remaining`;
        }
    };

    // =========================
    // SPEECH ENGINE
    // =========================
    const Speech = {
        speak(text) {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.85;
            speechSynthesis.speak(u);
        }
    };

    // =========================
    // UTILITIES
    // =========================
    const Utils = {
        wait(ms) {
            return new Promise(r => setTimeout(r, ms));
        }
    };

    // =========================
    // PUBLIC API
    // =========================
    return {
        state,
        setState,
        getState,
        AudioManager,
        MissionSystem,
        TVidEngine,
        BreathingSystem,
        SilenceSystem,
        FloatingSystem,
        UI,
        Speech,
        LockSystem
    };

})();
