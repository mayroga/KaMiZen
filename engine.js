/**
 * 🧠 KAMIZEN ENGINE CORE — FULL SURVIVAL + EDUCATION + GAME SYSTEM
 * UNIFIED VERSION (NO FEATURES REMOVED)
 */

const KamizenEngine = (() => {

    // =====================================================
    // 📊 GLOBAL STATE (CORE ORIGINAL + EXTENDED)
    // =====================================================
    const state = {
        score: 0,
        lang: "en",
        mission: null,
        locked: false,

        mode: "mission", // mission | breathing | silence | tvid

        silenceActive: false,
        silenceTime: 30,

        level: 1,
        streak: 0
    };

    // =====================================================
    // 🧱 DOM AUTHORITY (UNCHANGED CORE)
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
    // 🔒 LOCK SYSTEM (CORE)
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
    // 🔊 AUDIO SYSTEM (CORE)
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
    // 🗣️ SPEECH SYSTEM (CORE + ENGLISH DEFAULT)
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
            u.lang = "en-US";
            u.rate = 0.88;
            u.pitch = 0.9;

            u.onend = () => {
                this.running = false;
                this.next();
            };

            speechSynthesis.speak(u);
        },

        stop() {
            speechSynthesis.cancel();
            this.queue = [];
            this.running = false;
        }
    };

    // =====================================================
    // 🧠 SURVIVAL WORD SYSTEM (EXPANDED CORE)
    // =====================================================
    const WORDS = [

        { w: "SURVIVAL", v: 15, impact: "positive", key: "SURVIVAL" },
        { w: "INSTINCT", v: 12, impact: "positive", key: "INSTINCT" },
        { w: "ESCAPE", v: 15, impact: "positive", key: "ESCAPE" },
        { w: "AWARENESS", v: 12, impact: "positive", key: "AWARENESS" },
        { w: "ALERT", v: 10, impact: "positive", key: "ALERT" },
        { w: "REACTION", v: 10, impact: "positive", key: "REACTION" },
        { w: "DOMINANCE", v: 12, impact: "positive", key: "DOMINANCE" },
        { w: "SHIELD", v: 10, impact: "positive", key: "SHIELD" },

        { w: "THREAT", v: -15, impact: "negative", key: "THREAT" },
        { w: "FREEZE", v: -12, impact: "negative", key: "FREEZE" },
        { w: "VICTIM", v: -20, impact: "negative", key: "VICTIM" },
        { w: "PANIC", v: -15, impact: "negative", key: "PANIC" },
        { w: "DANGER", v: -10, impact: "negative", key: "DANGER" },
        { w: "ABUSE", v: -20, impact: "negative", key: "ABUSE" },
        { w: "FEAR", v: -12, impact: "negative", key: "FEAR" },
        { w: "TRAP", v: -15, impact: "negative", key: "TRAP" }
    ];

    // =====================================================
    // 📚 LIFE STRATEGY MAP (EDUCATION LAYER)
    // =====================================================
    const LIFE_MAP = {

        THREAT: {
            situation: "Threat / Danger",
            strategy: "Do not freeze. Fear is energy.",
            power: "INSTINCT: 0.5 sec reaction"
        },

        AWARENESS: {
            situation: "Hostile Environment",
            strategy: "Scan hands, eyes, exits.",
            power: "AWARENESS: 360° vision"
        },

        SHIELD: {
            situation: "Manipulation",
            strategy: "Urgency or free offers = suspicion.",
            power: "SHIELD: deception block"
        },

        SURVIVAL: {
            situation: "Physical Risk",
            strategy: "Cover first. Escape second.",
            power: "SURVIVAL: life priority"
        }
    };

    // =====================================================
    // 🌌 FLOATING WORD SYSTEM (SURVIVAL GAME)
    // =====================================================
    const Floating = {

        interval: null,

        spawn() {

            if (Lock.is() || state.mode !== "mission") return;

            const item = WORDS[Math.floor(Math.random() * WORDS.length)];

            const el = document.createElement("div");
            el.className = "floating-word";
            el.innerText = item.w;

            const colors = ["red", "green", "yellow", "blue"];
            const color = colors[Math.floor(Math.random() * colors.length)];

            el.style.border = `2px solid ${color}`;
            el.style.color = color;
            el.style.left = Math.random() * 90 + "vw";

            el.onclick = () => {

                state.score += item.v;

                const info = LIFE_MAP[item.key];

                const msg = info
                    ? `${info.situation}. ${info.strategy}. ${info.power}.`
                    : "Survival decision processed.";

                DOM.set("analysis", msg);
                Speech.say(msg);

                DOM.set("score-display", "POINTS: " + state.score);

                el.remove();
            };

            document.body.appendChild(el);
            setTimeout(() => el.remove(), 5000);
        },

        start() {
            if (this.interval) return;
            this.interval = setInterval(() => this.spawn(), 1200);
        }
    };

    // =====================================================
    // 🎮 DECISION SYSTEM (NO PROGRESSION IF WRONG)
    // =====================================================
    const Decision = {

        handle(opt) {

            Lock.on();

            const box = document.getElementById("explanation-box");

            const info = LIFE_MAP[opt.key];

            let text = "";

            if (opt.correct) {
                state.score += 20;
                text = info
                    ? `${info.strategy} | ${info.power}`
                    : "Correct survival decision.";
                Speech.say("Correct");
            } else {
                state.score -= 10;
                text = info
                    ? `Incorrect. ${info.strategy}`
                    : "Incorrect survival reaction.";
                Speech.say("Incorrect");
            }

            box.innerText = text;
            box.style.display = "block";

            DOM.set("score-display", "POINTS: " + state.score);

            if (!opt.correct) return;

            setTimeout(() => {
                box.style.display = "none";
                Lock.off();
                Router.next();
            }, 3000);
        }
    };

    // =====================================================
    // 🧘 BREATHING MODE (SCIENTIFIC)
    // =====================================================
    const Breathing = {

        start() {

            state.mode = "breathing";

            const el = document.getElementById("breath");
            el.style.display = "block";

            Speech.say(
                "Breathing protocol activated. This improves oxygen flow and prefrontal control."
            );

            let phase = true;

            this.interval = setInterval(() => {
                el.innerText = phase ? "INHALE" : "EXHALE";
                el.style.transform = phase ? "scale(2.5)" : "scale(1)";
                phase = !phase;
            }, 4000);

            setTimeout(() => this.stop(), 20000);
        },

        stop() {
            clearInterval(this.interval);
            document.getElementById("breath").style.display = "none";
            Router.next();
        }
    };

    // =====================================================
    // 🤫 SILENCE MODE (30–60 SEC PROGRESSION)
    // =====================================================
    const Silence = {

        start() {

            state.mode = "silence";

            const time = Math.min(30 + state.level, 60);
            let t = time;

            Speech.say("Silence challenge started.");

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
            Speech.say("Silence completed.");
            Router.next();
        }
    };

    // =====================================================
    // 📺 TVID MODE (MICRO LEARNING)
    // =====================================================
    const TVID = {

        start() {

            state.mode = "tvid";

            const msgs = [
                "Attention is your strongest weapon.",
                "Control emotion before action.",
                "Survival starts with perception."
            ];

            const msg = msgs[Math.floor(Math.random() * msgs.length)];

            DOM.set("story", msg);
            Speech.say(msg);

            setTimeout(() => Router.next(), 6000);
        }
    };

    // =====================================================
    // 🧭 ROUTER (FULL ORIGINAL RESTORED)
    // =====================================================
    const Router = {

        next() {

            const modes = ["mission", "breathing", "silence", "tvid"];
            const m = modes[Math.floor(Math.random() * modes.length)];

            if (m === "mission") Mission.load();
            if (m === "breathing") Breathing.start();
            if (m === "silence") Silence.start();
            if (m === "tvid") TVID.start();
        }
    };

    // =====================================================
    // 📂 MISSION SYSTEM (RESTORED + BACKEND)
    // =====================================================
    const Mission = {

        async load() {

            try {
                state.mode = "mission";

                const res = await fetch("/api/mission/next");
                const data = await res.json();

                state.mission = data;
                this.render(data);

            } catch (e) {
                console.error(e);
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
    // 🖥️ UI SYSTEM
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
