/**
 * 🧠 KAMIZEN ENGINE CORE — DOM AUTHORITY SYSTEM
 * ENGINE ES EL ÚNICO CONTROLADOR DEL JUEGO
 */

const KamizenEngine = (() => {

    // =====================================================
    // 📊 STATE
    // =====================================================
    const state = {
        score: 0,
        lang: "en",
        mission: null,
        locked: false,

        silenceActive: false,
        silenceTime: 180,

        attention: 100,
        streak: 0,
        mistakes: 0
    };

    // =====================================================
    // 🧱 DOM AUTHORITY LAYER (CLAVE)
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

        create(tag, className, text) {
            const el = document.createElement(tag);
            if (className) el.className = className;
            if (text) el.innerText = text;
            return el;
        }
    };

    // =====================================================
    // 🔒 LOCK (ENGINE PRIORITY)
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
    // 🔊 AUDIO
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
    // 🗣️ SPEECH QUEUE
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
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.92;

            u.onend = () => {
                this.running = false;
                this.next();
            };

            speechSynthesis.speak(u);
        }
    };

    // =====================================================
    // 🌌 FLOATING SYSTEM (ENGINE OWNED ONLY)
    // =====================================================
    const FloatingWords = {

        spawn() {

            if (state.silenceActive || Lock.is()) return;

            const pool = [
                { w: "CRITERIO", v: 20, c: "good" },
                { w: "ESTRATEGIA", v: 20, c: "good" },
                { w: "APROBACION", v: -10, c: "bad" },
                { w: "IMPULSO", v: -10, c: "bad" }
            ];

            const item = pool[Math.floor(Math.random() * pool.length)];

            const el = DOM.create("div", `floating word-${item.c}`, item.w);

            el.style.left = Math.random() * 90 + "vw";

            el.onclick = () => {

                state.score += item.v;

                if (item.v > 0) {
                    state.streak++;
                    AudioSystem.play("win");
                } else {
                    state.streak = 0;
                    AudioSystem.play("bad");
                }

                DOM.set("score-display", "POINTS: " + state.score);

                el.style.transform = "scale(3)";
                el.style.opacity = "0";

                setTimeout(() => el.remove(), 300);
            };

            document.body.appendChild(el);

            setTimeout(() => el.remove(), 5000);
        },

        start() {
            setInterval(() => this.spawn(), 1600);
        }
    };

    // =====================================================
    // 🎮 DECISIONS
    // =====================================================
    const Decision = {

        handle(opt) {

            Lock.on();

            DOM.html("explanation-box", opt.explanation?.[state.lang] || "");
            const box = document.getElementById("explanation-box");
            box.style.display = "block";

            if (opt.correct) {
                state.score += 20;
                AudioSystem.play("win");
                Speech.say("Correct choice");
            } else {
                state.score -= 10;
                AudioSystem.play("bad");
                Speech.say("Wrong choice");
            }

            DOM.set("score-display", "POINTS: " + state.score);

            setTimeout(() => {
                box.style.display = "none";
                Lock.off();
                Silence.start();
            }, 3000);
        }
    };

    // =====================================================
    // 🧘 SILENCE SYSTEM
    // =====================================================
    const Silence = {

        start() {

            state.silenceActive = true;

            let t = state.silenceTime;

            const id = setInterval(() => {

                t--;

                if (t <= 0) {
                    clearInterval(id);
                    this.finish();
                }

            }, 1000);
        },

        finish() {
            state.silenceActive = false;
            state.score += 30;
            Speech.say("Silence completed");
            Mission.load();
        }
    };

    // =====================================================
    // 📂 MISSION SYSTEM (ENGINE OWNS OUTPUT)
    // =====================================================
    const Mission = {

        async load() {

            try {
                const res = await fetch("/api/mission/next");
                const data = await res.json();

                state.mission = data;

                this.render(data);

            } catch {
                Speech.say("Mission error");
            }
        },

        render(m) {

            const story = m.blocks.find(b => b.type === "story")?.text[state.lang];
            const analysis = m.blocks.find(b => b.type === "analysis")?.text[state.lang];
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
    // 🖥️ UI (ONLY ENGINE WRITES HERE)
    // =====================================================
    const UI = {

        render(options) {

            const c = document.getElementById("options");
            c.innerHTML = "";

            options.forEach(opt => {

                const b = DOM.create("button", "opt-btn", opt.text[state.lang]);

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
            FloatingWords.start();
            Mission.load();
        },

        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
        }
    };

})();

window.onload = () => KamizenEngine.init();
