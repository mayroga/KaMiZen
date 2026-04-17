// =====================================
// 🧠 KAMIZEN ENGINE CORE — FINAL UNITY VERSION
// SINGLE BRAIN / NO CONFLICTS / NO DUPLICATION
// =====================================

const KamizenEngine = (() => {

    // =========================
    // GLOBAL STATE (SINGLE SOURCE OF TRUTH)
    // =========================
    const state = {
        missionId: 1,
        mission: null,
        lang: "en",
        locked: false,

        score: 0,

        floatingWords: [],

        silence: {
            active: false,
            level: 1,
            timeLeft: 0,
            violations: 0,
            lastInput: 0
        },

        power: {
            focus: 0,
            discipline: 0,
            wisdom: 0
        }
    };

    // =========================
    // LOCK SYSTEM (ABSOLUTE FLOW CONTROL)
    // =========================
    const Lock = {
        on() {
            state.locked = true;
            document.body.style.pointerEvents = "none";
        },
        off() {
            state.locked = false;
            document.body.style.pointerEvents = "auto";
        },
        is() {
            return state.locked;
        }
    };

    // =========================
    // SAFE INPUT LAYER (ONLY ONE LISTENER SYSTEM)
    // =========================
    const Input = {

        init() {

            // REMOVE ANY PREVIOUS CONFLICT LISTENERS
            window.onmousemove = null;
            window.onkeydown = null;
            window.onclick = null;
            window.ontouchstart = null;
            document.onvisibilitychange = null;

            const handle = (type) => {
                if (!state.silence.active) return;

                const now = Date.now();

                // debounce anti false-positive
                if (now - state.silence.lastInput < 1200) return;

                state.silence.lastInput = now;

                Silence.registerViolation(type);
            };

            window.addEventListener("mousemove", () => handle("mouse"));
            window.addEventListener("keydown", () => handle("keyboard"));
            window.addEventListener("click", () => handle("click"));
            window.addEventListener("touchstart", () => handle("touch"));

            document.addEventListener("visibilitychange", () => {
                if (document.hidden) handle("tab-switch");
            });
        }
    };

    // =========================
    // AUDIO SYSTEM (SIMPLE + STABLE)
    // =========================
    const Audio = {
        bg: null,
        ok: null,
        bad: null,

        init() {
            this.bg = document.getElementById("bg");
            this.ok = document.getElementById("ok");
            this.bad = document.getElementById("bad");

            if (this.bg) {
                this.bg.loop = true;
                this.bg.volume = 0.25;
                this.bg.play().catch(() => {});
            }
        },

        play(type) {
            if (type === "ok" && this.ok) this.ok.play();
            if (type === "bad" && this.bad) this.bad.play();
        }
    };

    // =========================
    // SPEECH ENGINE
    // =========================
    const Speech = {
        say(text) {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.85;
            speechSynthesis.speak(u);
        }
    };

    // =========================
    // FLOATING WORDS (NO CONFLICTS)
    // =========================
    const Floating = {

        start() {
            setInterval(() => {

                if (Lock.is()) return;
                if (!state.floatingWords.length) return;

                const el = document.createElement("div");
                el.className = "floating";

                el.innerText = state.floatingWords[
                    Math.floor(Math.random() * state.floatingWords.length)
                ];

                el.style.left = Math.random() * 100 + "vw";

                el.onclick = () => {
                    Speech.say(el.innerText);
                    state.score += 1;
                    el.remove();
                };

                document.body.appendChild(el);

                setTimeout(() => el.remove(), 4000);

            }, 1200);
        }
    };

    // =========================
    // SILENCE SYSTEM (AAA STABLE VERSION)
    // =========================
    const Silence = {

        start(level = 1) {

            state.silence.active = true;
            state.silence.level = level;
            state.silence.timeLeft = getDuration(level);
            state.silence.violations = 0;

            Lock.on();

            UI.overlay("NEURO SILENCE", "Control breath. Control mind.");

            Input.init();

            Breath.start(level);

            const timer = setInterval(() => {

                if (!state.silence.active) {
                    clearInterval(timer);
                    return;
                }

                state.silence.timeLeft--;

                UI.silence(state.silence.timeLeft);

                if (state.silence.timeLeft <= 0) {
                    Silence.complete();
                    clearInterval(timer);
                }

            }, 1000);
        },

        registerViolation(type) {

            state.silence.violations++;

            Speech.say("Distraction detected");

            UI.flashRed();

            state.silence.timeLeft = Math.max(10, state.silence.timeLeft - 10);

            if (state.silence.violations >= 3) {
                Silence.reset();
            }
        },

        reset() {
            Speech.say("Silence broken. Restarting.");
            state.silence.active = false;

            setTimeout(() => {
                Silence.start(state.silence.level);
            }, 2500);
        },

        complete() {
            state.silence.active = false;

            Lock.off();

            UI.flashGreen();

            Speech.say("Silence completed");

            state.power.discipline++;
            state.power.focus++;

            UI.hideOverlay();
        }
    };

    // =========================
    // BREATH SYSTEM (SYNCED)
    // =========================
    const Breath = {

        start(level) {

            const cycle = getBreathCycle(level);

            const loop = setInterval(() => {

                if (!state.silence.active) {
                    clearInterval(loop);
                    return;
                }

                UI.breath("in");
                Speech.say("Inhale");

                setTimeout(() => {
                    UI.breath("out");
                    Speech.say("Exhale");
                }, cycle / 2);

            }, cycle);
        }
    };

    // =========================
    // MISSION LOADER
    // =========================
    const Mission = {

        async load(id) {

            Lock.on();

            try {
                const res = await fetch(`/api/mission/${id}`);
                const data = await res.json();

                state.mission = data;
                state.missionId = id;

                if (data.ui?.floating_words) {
                    state.floatingWords = data.ui.floating_words;
                }

                Renderer.render(data);

            } catch (e) {
                console.error("Mission error:", e);
            }

            Lock.off();
        },

        next() {
            state.missionId++;
            if (state.missionId > 35) state.missionId = 1;
            this.load(state.missionId);
        }
    };

    // =========================
    // RENDER SYSTEM (NO LOGIC)
    // =========================
    const Renderer = {

        render(m) {

            const story = m.blocks.find(b => b.type === "story");
            const analysis = m.blocks.find(b => b.type === "analysis");
            const decision = m.blocks.find(b => b.type === "decision");

            UI.text("story", story.text[state.lang]);
            Speech.say(story.text[state.lang]);

            setTimeout(() => {
                UI.text("analysis", analysis.text[state.lang]);
                Speech.say(analysis.text[state.lang]);
            }, 2500);

            setTimeout(() => {
                Options.render(decision.options);
            }, 5000);
        }
    };

    // =========================
    // OPTIONS (4 RANDOM SAFE SHUFFLE)
    // =========================
    const Options = {

        render(options) {

            const container = document.getElementById("options");
            container.innerHTML = "";

            const shuffled = [...options].sort(() => Math.random() - 0.5);

            shuffled.forEach(opt => {

                const btn = document.createElement("button");
                btn.innerText = opt.text[state.lang];

                btn.onclick = () => Decision.select(opt);

                container.appendChild(btn);
            });
        }
    };

    // =========================
    // DECISION ENGINE
    // =========================
    const Decision = {

        async select(opt) {

            if (Lock.is()) return;

            Lock.on();
            Options.clear();

            if (opt.correct) {
                Audio.play("ok");
                Speech.say("Correct");
                state.score += 10;
                state.power.wisdom++;
            } else {
                Audio.play("bad");
                Speech.say("Wrong");
                state.score -= 5;
                state.power.focus--;
            }

            await TVID.run(state.mission);

            Mission.next();
        }
    };

    // =========================
    // TVID ENGINE
    // =========================
    const TVID = {

        async run(mission) {

            UI.overlay("TVID", "Processing response...");
            Lock.on();

            await Breath.start(2);

            Speech.say("Return to awareness");

            UI.hideOverlay();

            Lock.off();
        }
    };

    // =========================
    // UI SYSTEM (ONLY DOM)
    // =========================
    const UI = {

        text(id, value) {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        },

        overlay(title, text) {
            document.getElementById("overlayTitle").innerText = title;
            document.getElementById("overlayText").innerText = text;
            document.getElementById("overlay").style.display = "flex";
        },

        hideOverlay() {
            document.getElementById("overlay").style.display = "none";
        },

        breath(state) {
            const b = document.getElementById("breath");
            if (!b) return;

            b.style.transform = state === "in" ? "scale(1.5)" : "scale(1)";
        },

        silence(t) {
            const el = document.getElementById("silence");
            if (el) el.innerText = "Silence: " + t + "s";
        },

        flashRed() {
            document.body.style.background = "#330000";
            setTimeout(() => document.body.style.background = "#000", 600);
        },

        flashGreen() {
            document.body.style.background = "#003300";
            setTimeout(() => document.body.style.background = "#000", 800);
        }
    };

    // =========================
    // HELPERS
    // =========================
    function getDuration(level) {
        if (level <= 7) return 180;
        if (level <= 14) return 360;
        if (level <= 21) return 600;
        if (level <= 28) return 900;
        return 1200;
    }

    function getBreathCycle(level) {
        if (level <= 7) return 6000;
        if (level <= 14) return 5000;
        if (level <= 21) return 4000;
        return 3000;
    }

    // =========================
    // INIT
    // =========================
    function init() {

        Audio.init();
        Input.init();

        Mission.load(1);
        Floating.start();
    }

    return {
        init,
        Mission
    };

})();

// AUTO START
KamizenEngine.init();
