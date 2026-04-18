/**
 * 🧠 KAMIZEN ENGINE CORE — AL CIELO EDITION (STABLE SINGLE ENGINE)
 * Session SOLO renderiza. Engine controla TODO comportamiento.
 */

const KamizenEngine = (() => {

    // =====================================================
    // 📊 STATE (SINGLE SOURCE OF TRUTH)
    // =====================================================
    const state = {
        score: 0,
        energy: 100,
        lang: "en",
        missionId: 1,
        mission: null,

        locked: false,
        silenceActive: false,
        silenceTime: 180,

        attention: 100,
        streak: 0,
        mistakes: 0,

        lastAction: Date.now(),

        intervals: [] // 🧠 CONTROL CENTRAL DE TIMERS
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
        },

        play(type) {
            const a = type === "win" ? this.ok : this.bad;
            if (!a) return;

            try {
                a.currentTime = 0;
                a.play();
            } catch {}
        }
    };

    // =====================================================
    // 🗣️ SPEECH QUEUE (SAFE)
    // =====================================================
    const Speech = {
        queue: [],
        speaking: false,

        say(text) {
            if (!text) return;
            this.queue.push(text);
            this.next();
        },

        next() {
            if (this.speaking || this.queue.length === 0) return;

            this.speaking = true;
            const text = this.queue.shift();

            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.92;

            u.onend = () => {
                this.speaking = false;
                this.next();
            };

            window.speechSynthesis.speak(u);
        }
    };

    // =====================================================
    // 🧠 PSYCHOLOGY MAP
    // =====================================================
    const Psychology = {
        CRITERIO: "You decide your actions.",
        ESTRATEGIA: "You move intelligently.",
        SABIDURIA: "Money is a tool.",
        VALENTIA: "You act despite fear.",
        CALMA: "Control breath = control life.",

        APROBACION: "You lose identity seeking validation.",
        IMPULSO: "You act without thinking.",
        VICTIMA: "You give away your power.",
        GASTO: "You lose financial control.",
        EGO: "Fear blocks growth.",

        TELEFONO: "Attention is being stolen.",
        PANTALLA: "Digital overload risk.",
        DISTRACCION: "Focus breakdown detected."
    };

    // =====================================================
    // 🌌 FLOATING SYSTEM (CONTROLLED LOOP)
    // =====================================================
    const FloatingWords = {

        start() {
            const id = setInterval(() => {
                if (!state.silenceActive && !Lock.is()) {
                    this.spawn();
                }
            }, 1700);

            state.intervals.push(id);
        },

        spawn() {

            const r = Math.random();

            let config;

            if (r > 0.85) {
                config = { class: "word-bad", words: ["TELEFONO","PANTALLA","DISTRACCION"], val: -25 };
            } else if (r > 0.4) {
                config = { class: "word-good", words: ["CRITERIO","ESTRATEGIA","SABIDURIA","VALENTIA","CALMA"], val: 20 };
            } else {
                config = { class: "word-neutral", words: ["APROBACION","IMPULSO","EGO","VICTIMA"], val: -10 };
            }

            const word = config.words[Math.floor(Math.random() * config.words.length)];

            const el = document.createElement("div");
            el.className = `floating ${config.class}`;
            el.innerText = word;
            el.style.left = Math.random() * 90 + "vw";

            el.onclick = () => {

                state.score += config.val;
                state.lastAction = Date.now();

                if (config.val > 0) {
                    state.streak++;
                    state.attention = Math.min(100, state.attention + 2);
                    AudioSystem.play("win");
                } else {
                    state.mistakes++;
                    state.streak = 0;
                    state.attention -= 5;
                    AudioSystem.play("bad");
                }

                UI.update();

                el.style.transform = "scale(3)";
                el.style.opacity = "0";

                setTimeout(() => el.remove(), 300);
            };

            document.body.appendChild(el);

            setTimeout(() => el.remove(), 5000);
        }
    };

    // =====================================================
    // 🎮 DECISION SYSTEM
    // =====================================================
    const Decision = {

        handle(option) {

            Lock.on();

            const box = document.getElementById("explanation-box");
            box.style.display = "block";

            const text = option.explanation?.[state.lang] || "";

            box.innerText = text;

            if (option.correct) {
                state.score += 20;
                state.streak++;
                AudioSystem.play("win");
                Speech.say("Good choice. " + text);
            } else {
                state.mistakes++;
                state.streak = 0;
                AudioSystem.play("bad");
                Speech.say("Wrong path. " + text);
            }

            UI.update();

            setTimeout(() => {
                box.style.display = "none";
                Lock.off();
                Silence.start();
            }, 4000);
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

                if (state.locked) return;

                t--;
                state.attention += 0.05;

                if (t <= 0 || state.attention <= 0) {
                    clearInterval(id);
                    this.finish();
                }

            }, 1000);

            state.intervals.push(id);

            Speech.say("Silence mode activated.");
        },

        finish() {
            state.silenceActive = false;
            state.score += 30 + state.streak * 2;
            Speech.say("Silence completed.");
            Mission.load();
        }
    };

    // =====================================================
    // 📂 MISSION SYSTEM (SINGLE FETCH OWNER)
    // =====================================================
    const Mission = {

        async load() {

            Lock.on();

            try {
                const res = await fetch("/api/mission/next");
                const data = await res.json();

                state.mission = data;

                this.render(data);

            } catch {
                Speech.say("Mission error. Retrying...");
            }

            Lock.off();
        },

        render(m) {

            const story = m.blocks.find(b => b.type === "story")?.text[state.lang];
            const analysis = m.blocks.find(b => b.type === "analysis")?.text[state.lang];
            const decision = m.blocks.find(b => b.type === "decision");

            UI.set("story", story);
            UI.set("analysis", "");

            Speech.say(story);

            setTimeout(() => {
                UI.set("analysis", analysis);
                Speech.say(analysis);
            }, 2500);

            setTimeout(() => {
                UI.render(decision.options);
            }, 6000);
        }
    };

    // =====================================================
    // 🖥️ UI (MINIMAL SAFE LAYER)
    // =====================================================
    const UI = {

        set(id, val) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        },

        update() {
            this.set("score-display", "POINTS: " + state.score);
        },

        clear() {
            const o = document.getElementById("options");
            if (o) o.innerHTML = "";
        },

        render(options) {

            const c = document.getElementById("options");
            c.innerHTML = "";

            options.forEach(opt => {

                const b = document.createElement("button");
                b.className = "opt-btn";
                b.innerText = opt.text[state.lang];

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
            console.log("KAMIZEN ENGINE STABLE ACTIVE");
        },

        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
        }
    };

})();

window.onload = () => KamizenEngine.init();
