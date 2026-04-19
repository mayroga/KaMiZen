/**
 * 🧠 KAMIZEN ENGINE CORE — MODULAR SYSTEM (MULTI-MODE)
 * Juego + Coach + TVID + Respiración + Silencio + Estrategia Social
 */

const KamizenEngine = (() => {

    // =====================================================
    // 📊 STATE GLOBAL
    // =====================================================
    const state = {
        score: 0,
        lang: "en",
        mode: "mission", // mission | breathing | silence | tvid | free
        locked: false,

        mission: null,

        silenceTime: 120,
        attention: 100,
        streak: 0
    };

    // =====================================================
    // 🧱 DOM
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
    // 🔊 AUDIO + VOICE (MASCULINA)
    // =====================================================
    const Voice = {
        speak(text) {
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = "en-US";
            u.rate = 0.9;
            u.pitch = 0.8; // más grave (más “masculina”)
            speechSynthesis.speak(u);
        }
    };

    // =====================================================
    // 🎮 FLOATING WORDS GAME (DISPARO)
    // =====================================================
    const FloatingGame = {

        interval: null,

        spawn() {

            if (state.mode !== "mission") return;

            const pool = [
                { w: "FOCUS", v: 10, good: true },
                { w: "TRUTH", v: 10, good: true },
                { w: "IMPULSE", v: -10, good: false },
                { w: "FEAR", v: -10, good: false }
            ];

            const item = pool[Math.floor(Math.random() * pool.length)];

            const el = DOM.create("div", "floating-word", item.w);

            // 🎯 colores engañosos
            const color = Math.random() > 0.5
                ? (item.good ? "red" : "green")
                : (item.good ? "green" : "red");

            el.style.border = `3px solid ${color}`;
            el.style.color = color;
            el.style.left = Math.random() * 90 + "vw";

            el.onclick = () => {

                state.score += item.v;

                Voice.speak(item.good ? "Good choice" : "Bad choice");

                // 🧠 explicación tipo coach
                DOM.set("analysis",
                    item.good
                        ? "You reinforced discipline and clarity."
                        : "You followed impulse. Control it next time."
                );

                DOM.set("score-display", "POINTS: " + state.score);

                el.style.transform = "scale(3)";
                el.style.opacity = "0";
                setTimeout(() => el.remove(), 300);
            };

            document.body.appendChild(el);
            setTimeout(() => el.remove(), 5000);
        },

        start() {
            if (this.interval) return;
            this.interval = setInterval(() => this.spawn(), 1500);
        },

        stop() {
            clearInterval(this.interval);
            this.interval = null;
        }
    };

    // =====================================================
    // 📂 MISSION MODE (HISTORIA + DECISIÓN)
    // =====================================================
    const MissionMode = {

        async start() {
            state.mode = "mission";

            const res = await fetch("/api/mission/next");
            const data = await res.json();
            state.mission = data;

            this.render(data);
        },

        render(m) {

            const story = m.blocks.find(b => b.type === "story")?.text.en;
            const analysis = m.blocks.find(b => b.type === "analysis")?.text.en;
            const decision = m.blocks.find(b => b.type === "decision");

            DOM.set("story", story);
            DOM.set("analysis", "");

            Voice.speak(story);

            setTimeout(() => {
                DOM.set("analysis", analysis);
                Voice.speak(analysis);
            }, 2500);

            setTimeout(() => {
                UI.options(decision.options);
            }, 5000);
        }
    };

    // =====================================================
    // 🧘 BREATHING MODE (CÍRCULO AZUL)
    // =====================================================
    const BreathingMode = {

        start() {
            state.mode = "breathing";

            const el = document.getElementById("breath");
            el.style.display = "block";

            Voice.speak("Breathe in. Breathe out. Control your energy.");

            let grow = true;

            this.interval = setInterval(() => {
                el.style.transform = grow ? "scale(2.5)" : "scale(1)";
                grow = !grow;
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
    // 🤫 SILENCE MODE
    // =====================================================
    const SilenceMode = {

        start() {
            state.mode = "silence";

            let t = state.silenceTime;

            Voice.speak("Silence challenge started. Do nothing.");

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
            Voice.speak("Silence completed. Strong mind.");
            Router.next();
        }
    };

    // =====================================================
    // 📺 TVID MODE (MICRO LEARNING)
    // =====================================================
    const TVIDMode = {

        start() {
            state.mode = "tvid";

            const messages = [
                "Your attention is your power.",
                "Control emotion before it controls you.",
                "Discipline beats talent."
            ];

            const msg = messages[Math.floor(Math.random() * messages.length)];

            DOM.set("story", msg);
            Voice.speak(msg);

            setTimeout(() => Router.next(), 6000);
        }
    };

    // =====================================================
    // 🧭 ROUTER (CAMBIO DE MODOS)
    // =====================================================
    const Router = {

        next() {

            const modes = ["mission", "breathing", "silence", "tvid"];
            const next = modes[Math.floor(Math.random() * modes.length)];

            if (next === "mission") MissionMode.start();
            if (next === "breathing") BreathingMode.start();
            if (next === "silence") SilenceMode.start();
            if (next === "tvid") TVIDMode.start();
        }
    };

    // =====================================================
    // 🖥️ UI
    // =====================================================
    const UI = {

        options(opts) {

            const c = document.getElementById("options");
            c.innerHTML = "";

            opts.forEach(o => {
                const b = DOM.create("button", "opt-btn", o.text.en);

                b.onclick = () => {
                    state.score += o.correct ? 20 : -10;

                    Voice.speak(o.correct ? "Correct decision" : "Wrong decision");

                    DOM.set("score-display", "POINTS: " + state.score);

                    setTimeout(() => Router.next(), 2000);
                };

                c.appendChild(b);
            });
        }
    };

    // =====================================================
    // 🚀 INIT
    // =====================================================
    return {

        init({ onReady, onCrash } = {}) {
            try {

                console.log("🧠 KAMIZEN ENGINE MULTI-MODE START");

                FloatingGame.start();
                Router.next();

                onReady && onReady();

            } catch (e) {
                console.error(e);
                onCrash && onCrash();
            }
        }

    };

})();
