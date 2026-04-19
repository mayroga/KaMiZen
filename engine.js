const KamizenEngine = (() => {

    // =====================================================
    // 📊 STATE CORE
    // =====================================================
    const state = {
        score: 0,
        lang: "en",
        mission: null,
        locked: false,

        mode: "mission",
        missionId: 1,

        silenceActive: false,
        silenceTime: 20, // base 20s

        level: 1
    };

    // =====================================================
    // 🧱 DOM CORE
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
    // 🔊 AUDIO SYSTEM (ENGLISH ONLY DEFAULT)
    // =====================================================
    const Voice = {
        say(text) {
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = "en-US";
            u.rate = 0.88;
            u.pitch = 0.9;
            speechSynthesis.speak(u);
        }
    };

    // =====================================================
    // 🌈 SURVIVAL WORD SYSTEM (FOCUS = WORD, NOT COLOR)
    // =====================================================
    const WORDS = [
        { w: "SURVIVAL", v: 15, impact: "positive", meaning: "Life priority awareness" },
        { w: "INSTINCT", v: 12, impact: "positive", meaning: "Fast neural reaction system" },
        { w: "ESCAPE", v: 15, impact: "positive", meaning: "Exit danger zone immediately" },
        { w: "AWARENESS", v: 12, impact: "positive", meaning: "360 degree perception" },
        { w: "ALERT", v: 10, impact: "positive", meaning: "Constant scanning state" },
        { w: "REACTION", v: 10, impact: "positive", meaning: "Instant decision response" },
        { w: "SHIELD", v: 10, impact: "positive", meaning: "Defense against manipulation" },

        { w: "THREAT", v: -15, impact: "negative", meaning: "Danger detection required" },
        { w: "FREEZE", v: -12, impact: "negative", meaning: "Paralysis under stress" },
        { w: "VICTIM", v: -20, impact: "negative", meaning: "Loss of control mindset" },
        { w: "PANIC", v: -15, impact: "negative", meaning: "Emotional collapse risk" },
        { w: "DANGER", v: -10, impact: "negative", meaning: "Risk zone detected" },
        { w: "FEAR", v: -12, impact: "negative", meaning: "Energy misdirection" },
        { w: "TRAP", v: -15, impact: "negative", meaning: "Manipulation structure" }
    ];

    // =====================================================
    // 📚 LIFE RESPONSE MAP (COGNITIVE IMPACT)
    // =====================================================
    const LIFE = {
        THREAT: "Do not freeze. Fear is energy to analyze.",
        AWARENESS: "Scan environment. Eyes, hands, exits.",
        SHIELD: "If urgency or free reward appears, verify intent.",
        SURVIVAL: "Prioritize exit, safety, and distance."
    };

    // =====================================================
    // 🌈 FLOATING WORD SYSTEM (COLOR = DISTRACTION ONLY)
    // =====================================================
    const Floating = {

        start() {
            setInterval(() => this.spawn(), 1100);
        },

        spawn() {

            if (Lock.is() || state.mode !== "mission") return;

            const item = WORDS[Math.floor(Math.random() * WORDS.length)];

            const el = document.createElement("div");
            el.className = "floating-word";
            el.innerText = item.w;

            // 🎨 ONLY 3 COLORS (DISTRACTION SYSTEM)
            const colors = ["red", "yellow", "green"];
            const color = colors[Math.floor(Math.random() * colors.length)];

            el.style.border = `2px solid ${color}`;
            el.style.color = color;
            el.style.left = Math.random() * 90 + "vw";

            el.onclick = () => {

                state.score += item.v;

                // ❗ WORD IS THE REAL INPUT
                const meaning = item.meaning;
                const lifeImpact = LIFE[item.w] || "Analyze behavior and context.";

                const msg = `${item.w}. Meaning: ${meaning}. Impact: ${lifeImpact}`;

                DOM.set("analysis", msg);
                Voice.say(msg);

                DOM.set("score-display", "POINTS: " + state.score);

                el.remove();
            };

            document.body.appendChild(el);
            setTimeout(() => el.remove(), 5000);
        }
    };

    // =====================================================
    // 🎮 DECISION SYSTEM (NO SKIP UNTIL CORRECT)
    // =====================================================
    const Decision = {

        handle(opt) {

            Lock.on();

            const box = document.getElementById("explanation-box");

            let text = opt.correct
                ? "Correct decision. Cognitive reinforcement applied."
                : "Incorrect decision. Retry required.";

            state.score += opt.correct ? 20 : -10;

            box.innerText = text;
            box.style.display = "block";

            Voice.say(text);

            DOM.set("score-display", "POINTS: " + state.score);

            // ❗ MUST REPEAT UNTIL CORRECT
            if (!opt.correct) return;

            setTimeout(() => {
                box.style.display = "none";
                Lock.off();
                Router.next();
            }, 3000);
        }
    };

    // =====================================================
    // 🧘 SILENCE MODE (20–60s PROGRESSIVE 1–35 ID)
    // =====================================================
    const Silence = {

        start() {

            state.mode = "silence";

            const time = Math.min(20 + state.missionId, 60); // PROGRESSIVE
            let t = time;

            Voice.say("Silence mode activated. Focus on internal control.");

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
            Voice.say("Silence completed successfully.");
            Router.next();
        }
    };

    // =====================================================
    // 📺 TVID MODE (EDUCATIONAL MICRO LOOP)
    // =====================================================
    const TVID = {

        start() {

            state.mode = "tvid";

            const msgs = [
                "Attention defines survival performance.",
                "Control reaction before emotion.",
                "Perception is your real weapon."
            ];

            const msg = msgs[Math.floor(Math.random() * msgs.length)];

            DOM.set("story", msg);
            Voice.say(msg);

            setTimeout(() => Router.next(), 6000);
        }
    };

    // =====================================================
    // 🧭 ROUTER (FULL MODE SYSTEM RESTORED)
    // =====================================================
    const Router = {

        next() {

            const modes = ["mission", "silence", "tvid"];

            const m = modes[Math.floor(Math.random() * modes.length)];

            if (m === "mission") Mission.load();
            if (m === "silence") Silence.start();
            if (m === "tvid") TVID.start();
        }
    };

    // =====================================================
    // 📂 MISSION SYSTEM (BACKEND RESTORED)
    // =====================================================
    const Mission = {

        async load() {

            try {

                state.mode = "mission";

                const res = await fetch(`/api/mission/${state.missionId}`);
                const data = await res.json();

                state.mission = data;

                this.render(data);

            } catch (e) {
                Voice.say("Mission loading error");
            }
        },

        render(m) {

            const story = m.blocks.find(b => b.type === "story")?.text.en;
            const analysis = m.blocks.find(b => b.type === "analysis")?.text.en;
            const decision = m.blocks.find(b => b.type === "decision");

            DOM.set("story", story);
            DOM.set("analysis", "");

            Voice.say(story);

            setTimeout(() => {
                DOM.set("analysis", analysis);
                Voice.say(analysis);
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
            Floating.start();
            Router.next();
        }
    };

})();

window.onload = () => KamizenEngine.init();
