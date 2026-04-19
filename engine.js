/**
 * 🧠 KAMIZEN ENGINE CORE — SURVIVAL EDUCATION SYSTEM
 * FULL MERGE VERSION (EXPANDED SYSTEM - NO FEATURES REMOVED)
 */

const KamizenEngine = (() => {

    // =====================================================
    // 📊 STATE (UNCHANGED CORE + EXTENSION)
    // =====================================================
    const state = {
        score: 0,
        lang: "en",
        mission: null,
        locked: false,

        silenceActive: false,
        silenceTime: 20,

        missionId: 1,

        attention: 100,
        streak: 0,
        mistakes: 0,

        mode: "mission",

        // 🧠 NEW: SYSTEM MEMORY FOR WORD ANALYSIS
        lastWordAnalysis: null,
        speechLocked: false,
        silenceQueue: false,

        // 🌊 BREATH CONTROL HOOK (future engine expansion)
        breathMode: false,

        // 🎬 TVID MODE (placeholder expansion system)
        tvidMode: false
    };

    // =====================================================
    // 🧱 DOM AUTHORITY (UNCHANGED)
    // =====================================================
    const DOM = {
        set(id, val) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        },
        html(id, val) {
            const el = document.getElementById(id);
            if (el) el.innerHTML = val;
        },
        clear(id) {
            const el = document.getElementById(id);
            if (el) el.innerHTML = "";
        },
        create(tag, cls, text) {
            const el = document.createElement(tag);
            if (cls) el.className = cls;
            if (text) el.innerText = text;
            return el;
        }
    };

    // =====================================================
    // 🔒 LOCK SYSTEM
    // =====================================================
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

    // =====================================================
    // 🔊 AUDIO SYSTEM
    // =====================================================
    const AudioSystem = {
        bg: null,
        ok: null,
        bad: null,

        init() {
            this.bg = document.getElementById("bg");
            this.ok = document.getElementById("ok");
            this.bad = document.getElementById("bad");

            if (this.bg) {
                this.bg.volume = 0.25;
                this.bg.loop = true;
                this.bg.play().catch(() => {});
            }
        }
    };

    // =====================================================
    // 🗣️ SPEECH SYSTEM (IMPROVED SEQUENTIAL READ LOCK)
    // =====================================================
    const Speech = {
        queue: [],
        running: false,

        say(text) {
            if (!text) return;

            this.queue.push(text);
            this.next();
        },

        next() {
            if (this.running || state.speechLocked || this.queue.length === 0) return;

            this.running = true;

            const text = this.queue.shift();
            const u = new SpeechSynthesisUtterance(text);

            u.lang = state.lang === "es" ? "es-ES" : "en-US";
            u.rate = 0.88;
            u.pitch = 0.9;

            u.onend = () => {
                this.running = false;
                this.next();
            };

            speechSynthesis.speak(u);
        },

        lockReading() {
            state.speechLocked = true;
        },

        unlockReading() {
            state.speechLocked = false;
            this.next();
        }
    };

    // =====================================================
    // 🧠 EXPANDED WORD SYSTEM (SURVIVAL + SOCIAL + MIND)
    // =====================================================
    const WORDS = [

        // 🧠 SURVIVAL CORE
        { w: "SURVIVAL", v: 15, impact: "positive" },
        { w: "INSTINCT", v: 12, impact: "positive" },
        { w: "ESCAPE", v: 15, impact: "positive" },
        { w: "AWARENESS", v: 12, impact: "positive" },
        { w: "ALERT", v: 10, impact: "positive" },
        { w: "REACTION", v: 10, impact: "positive" },
        { w: "SHIELD", v: 10, impact: "positive" },

        // 🧭 SURVIVAL EXPANSION
        { w: "PERCEPTION", v: 14, impact: "positive" },
        { w: "SCAN", v: 10, impact: "positive" },
        { w: "VIGILANCE", v: 13, impact: "positive" },
        { w: "NO-FREEZE", v: 15, impact: "positive" },
        { w: "SHELTER", v: 11, impact: "positive" },

        // 🧠 SOCIAL STRATEGY
        { w: "LEADERSHIP", v: 14, impact: "positive" },
        { w: "NEGOTIATION", v: 12, impact: "positive" },
        { w: "BOUNDARY", v: 12, impact: "positive" },
        { w: "INFLUENCE", v: 13, impact: "positive" },
        { w: "RESILIENCE", v: 15, impact: "positive" },
        { w: "NON-CONFORMITY", v: 16, impact: "positive" },

        // 🧠 INNER ENGINE
        { w: "SELF-MASTERY", v: 15, impact: "positive" },
        { w: "WILLPOWER", v: 13, impact: "positive" },
        { w: "STAMINA", v: 11, impact: "positive" },
        { w: "FOCUS-FIRE", v: 14, impact: "positive" },
        { w: "CHESS-MIND", v: 16, impact: "positive" },

        // ⚠️ NEGATIVE SYSTEM
        { w: "THREAT", v: -15, impact: "negative" },
        { w: "FREEZE", v: -12, impact: "negative" },
        { w: "VICTIM", v: -20, impact: "negative" },
        { w: "PANIC", v: -15, impact: "negative" },
        { w: "DANGER", v: -10, impact: "negative" },
        { w: "FEAR", v: -12, impact: "negative" }
    ];

    // =====================================================
    // 🎨 COLOR SYSTEM (VISUAL ONLY - MEANING IGNORED)
    // =====================================================
    function getColor(word) {
        if (word.v < 0) return "red";
        if (word.v > 12) return "green";
        return "yellow";
    }

    // =====================================================
    // 🌌 FLOATING WORD SYSTEM (MORE FREQUENT + MEMORY ANALYSIS)
    // =====================================================
    const Floating = {

        spawn() {

            if (Lock.is()) return;

            const item = WORDS[Math.floor(Math.random() * WORDS.length)];

            const el = document.createElement("div");
            el.className = "floating-word";
            el.innerText = item.w;

            const color = getColor(item);

            el.style.border = `2px solid ${color}`;
            el.style.color = color;
            el.style.left = Math.random() * 90 + "vw";

            el.onclick = () => {

                state.score += item.v;

                // 🧠 STORE ANALYSIS EVEN AFTER EXPLOSION
                state.lastWordAnalysis = {
                    word: item.w,
                    meaning:
                        item.impact === "positive"
                            ? `${item.w} improves survival intelligence and decision speed.`
                            : `${item.w} is a risk pattern. Awareness required in real life.`,
                    impact: item.impact
                };

                DOM.set("analysis", state.lastWordAnalysis.meaning);
                Speech.say(state.lastWordAnalysis.meaning);

                DOM.set("score-display", "POINTS: " + state.score);

                el.remove();
            };

            document.body.appendChild(el);

            // ⚡ faster spawn cycle (more training density)
            setTimeout(() => el.remove(), 4500);
        },

        start() {
            setInterval(() => this.spawn(), 900); // 🔥 increased frequency
        }
    };

    // =====================================================
    // 🧘 SILENCE SYSTEM (QUEUE SAFE - NO INTERRUPTION)
    // =====================================================
    const Silence = {

        start() {

            state.mode = "silence";
            state.silenceQueue = true;

            let t = Math.min(20 + state.missionId, 60);
            state.silenceTime = t;

            Speech.say("Silence training initiated.");

            const id = setInterval(() => {

                t--;

                if (t <= 0) {
                    clearInterval(id);
                    this.finish();
                }

            }, 1000);
        },

        finish() {

            state.score += 30;

            Speech.say("Silence completed. Cognitive control improved.");

            state.silenceQueue = false;

            Router.next();
        }
    };

    // =====================================================
    // 🎮 DECISION SYSTEM
    // =====================================================
    const Decision = {

        handle(opt) {

            Lock.on();

            const box = document.getElementById("explanation-box");

            let text = opt.correct
                ? "Correct decision improves survival response."
                : "Incorrect decision detected. Retry required.";

            if (!opt.correct) state.mistakes++;

            box.innerText = text;
            box.style.display = "block";

            Speech.say(text);

            if (!opt.correct) return;

            setTimeout(() => {
                box.style.display = "none";
                Lock.off();
                Router.next();
            }, 3000);
        }
    };

    // =====================================================
    // 📂 MISSION SYSTEM (UNCHANGED CORE)
    // =====================================================
    const Mission = {

        async load() {

            try {

                const res = await fetch("/api/mission/next");
                const data = await res.json();

                state.mission = data;
                this.render(data);

            } catch (e) {
                Speech.say("Mission loading error");
            }
        },

        render(m) {

            const story = m.blocks.find(b => b.type === "story")?.text.en;
            const analysis = m.blocks.find(b => b.type === "analysis")?.text.en;
            const decision = m.blocks.find(b => b.type === "decision");

            DOM.set("story", story);
            DOM.set("analysis", "");

            Speech.say(story);

            setTimeout(() => {
                DOM.set("analysis", analysis);
                Speech.say(analysis);
            }, 2500);

            setTimeout(() => {
                UI.render(decision.options);
            }, 5000);
        }
    };

    // =====================================================
    // 🖥️ UI
    // =====================================================
    const UI = {
        render(options) {

            const c = document.getElementById("options");
            c.innerHTML = "";

            options.forEach(opt => {
                const b = DOM.create("button", "opt-btn", opt.text.en);
                b.onclick = () => Decision.handle(opt);
                c.appendChild(b);
            });
        }
    };

    // =====================================================
    // 🧭 ROUTER
    // =====================================================
    const Router = {

        next() {

            if (state.silenceQueue) return; // 🧠 safety queue

            state.missionId++;

            const modes = ["mission", "silence"];

            const m = modes[Math.floor(Math.random() * modes.length)];

            if (m === "mission") Mission.load();
            if (m === "silence") Silence.start();
        }
    };

    // =====================================================
    // 🚀 INIT
    // =====================================================
    return {

        init() {
            AudioSystem.init();
            Floating.start();
            Router.next();
        },

        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
        }
    };

})();

window.onload = () => KamizenEngine.init();
