/**
 * 🧠 KAMIZEN ENGINE CORE — SURVIVAL EDUCATION SYSTEM
 * FULL MERGE VERSION (NO FEATURES REMOVED)
 */

const KamizenEngine = (() => {

    // =====================================================
    // 📊 STATE (UNCHANGED CORE + EXTENSION)
    // =====================================================
    const state = {
        score: 0,
        lang: "en", // DEFAULT ENGLISH ONLY
        mission: null,
        locked: false,

        silenceActive: false,
        silenceTime: 20, // base minimum

        missionId: 1,

        attention: 100,
        streak: 0,
        mistakes: 0,

        mode: "mission"
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
    // 🔊 AUDIO SYSTEM (ENGLISH DEFAULT ONLY)
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
        },

        play(type) {
            const a = type === "win" ? this.ok : this.bad;
            if (!a) return;
            a.currentTime = 0;
            a.play().catch(() => {});
        }
    };

    // =====================================================
    // 🗣️ VOICE SYSTEM (FORCED ENGLISH)
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
            if (this.running || this.queue.length === 0) return;

            this.running = true;
            const text = this.queue.shift();

            const u = new SpeechSynthesisUtterance(text);

            // 🔥 FORCE ENGLISH UNLESS MANUAL OVERRIDE
            u.lang = state.lang === "es" ? "es-ES" : "en-US";
            u.rate = 0.88;
            u.pitch = 0.9;

            u.onend = () => {
                this.running = false;
                this.next();
            };

            speechSynthesis.speak(u);
        }
    };

    // =====================================================
    // 🧠 SURVIVAL WORD SYSTEM (CORE + FIXED COLOR LOGIC)
    // =====================================================
    const WORDS = [

        { w: "SURVIVAL", v: 15, impact: "positive" },
        { w: "INSTINCT", v: 12, impact: "positive" },
        { w: "ESCAPE", v: 15, impact: "positive" },
        { w: "AWARENESS", v: 12, impact: "positive" },
        { w: "ALERT", v: 10, impact: "positive" },
        { w: "REACTION", v: 10, impact: "positive" },
        { w: "SHIELD", v: 10, impact: "positive" },

        { w: "THREAT", v: -15, impact: "negative" },
        { w: "FREEZE", v: -12, impact: "negative" },
        { w: "VICTIM", v: -20, impact: "negative" },
        { w: "PANIC", v: -15, impact: "negative" },
        { w: "DANGER", v: -10, impact: "negative" },
        { w: "FEAR", v: -12, impact: "negative" }
    ];

    // =====================================================
    // 🎨 COLOR RULE (IMPORTANT FIX)
    // =====================================================
    function getColor(word) {
        // ⚠️ COLOR IS ONLY WARNING SIGNAL, NOT MEANING
        if (word.v < 0) return "red";        // caution
        if (word.v > 10) return "green";     // safe action
        return "yellow";                     // neutral alert
    }

    // =====================================================
    // 🌌 FLOATING WORDS (FIXED LOGIC)
    // =====================================================
    const Floating = {

        spawn() {

            if (Lock.is()) return;

            const item = WORDS[Math.floor(Math.random() * WORDS.length)];

            const el = document.createElement("div");
            el.className = "floating-word";
            el.innerText = item.w;

            // 🔥 COLOR = DISTRACTION LAYER (NOT MEANING)
            const color = getColor(item);

            el.style.border = `2px solid ${color}`;
            el.style.color = color;
            el.style.left = Math.random() * 90 + "vw";

            el.onclick = () => {

                state.score += item.v;

                // 🧠 REAL MEANING IS WORD, NOT COLOR
                let msg = "";

                if (item.impact === "positive") {
                    msg = `${item.w} strengthens decision-making and survival awareness.`;
                } else {
                    msg = `${item.w} represents a risk pattern. Analyze before reacting.`;
                }

                DOM.set("analysis", msg);
                Speech.say(msg);

                DOM.set("score-display", "POINTS: " + state.score);

                el.remove();
            };

            document.body.appendChild(el);
            setTimeout(() => el.remove(), 5000);
        },

        start() {
            setInterval(() => this.spawn(), 1200);
        }
    };

    // =====================================================
    // 🧘 SILENCE SYSTEM (PROGRESSIVE 20–60s BY ID)
    // =====================================================
    const Silence = {

        start() {

            state.mode = "silence";

            // 🔥 PROGRESSIVE TIME SYSTEM (ID 1–35)
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
            Router.next();
        }
    };

    // =====================================================
    // 🎮 DECISION SYSTEM (NO PROGRESSION IF WRONG)
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
    // 📂 MISSION SYSTEM (RESTORED FULL BACKEND)
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
    // 🧭 ROUTER (RESTORED + FIXED)
    // =====================================================
    const Router = {

        next() {

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
