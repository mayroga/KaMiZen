/**
 * 🧠 KAMIZEN ENGINE CORE — AL CIELO EDITION (SINGLE ENGINE SYSTEM)
 * Todo el sistema del juego vive aquí.
 * No existe SESSION.HTML ENGINE paralelo.
 */

const KamizenEngine = (() => {

    // =====================================================
    // 📊 ESTADO GLOBAL (SOURCE OF TRUTH)
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

        attention: 100,        // 🧠 NUEVO: foco mental real
        streak: 0,             // 🔥 NUEVO: racha de decisiones correctas
        mistakes: 0,           // ⚠️ NUEVO: errores acumulados

        lastAction: Date.now()
    };

    // =====================================================
    // 🔒 LOCK SYSTEM (INTERACCIÓN CONTROLADA)
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
    // 🔊 AUDIO SYSTEM (ROBUSTO)
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
                this.bg.playbackRate = 1.05;
                this.bg.play().catch(() => {});
            }
        },

        play(type) {
            const a = type === "win" ? this.ok : this.bad;
            if (!a) return;

            try {
                a.currentTime = 0;
                a.play();
            } catch (e) {}
        }
    };

    // =====================================================
    // 🗣️ SPEECH SYSTEM (CON COLA REAL)
    // =====================================================
    const Speech = {
        queue: [],
        speaking: false,

        say(text) {
            this.queue.push(text);
            this.process();
        },

        process() {
            if (this.speaking || this.queue.length === 0) return;

            this.speaking = true;
            const text = this.queue.shift();

            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.92;

            u.onend = () => {
                this.speaking = false;
                this.process();
            };

            window.speechSynthesis.speak(u);
        }
    };

    // =====================================================
    // 🧠 PSYCHOLOGY CORE (SIGNIFICADO REAL)
    // =====================================================
    const Psychology = {

        CRITERIO: "You decide your actions. You are not controlled.",
        ESTRATEGIA: "You learn to observe and move smart.",
        SABIDURIA: "Money is a tool, not emotion.",
        VALENTIA: "You act even with fear.",
        CALMA: "Control breath = control life.",

        APROBACION: "You lose yourself trying to please others.",
        IMPULSO: "You act without thinking.",
        VICTIMA: "You give away your power.",
        GASTO: "You lose control over money.",
        EGO: "Fear of judgment blocks your growth.",

        TELEFONO: "Attention is being stolen.",
        PANTALLA: "Digital addiction risk.",
        DISTRACCION: "Focus is being destroyed."
    };

    // =====================================================
    // 🌌 FLOATING SYSTEM (INTELIGENTE + PROGRESIVO)
    // =====================================================
    const FloatingWords = {

        spawn() {

            if (state.silenceActive || Lock.is()) return;

            const r = Math.random();

            let config;

            // 🧨 TRAMPAS
            if (r > 0.85) {
                config = {
                    type: "trap",
                    class: "word-bad",
                    words: ["TELEFONO", "PANTALLA", "DISTRACCION"],
                    val: -25
                };

            // 🟢 PODER
            } else if (r > 0.4) {
                config = {
                    type: "power",
                    class: "word-good",
                    words: ["CRITERIO", "ESTRATEGIA", "SABIDURIA", "VALENTIA", "CALMA"],
                    val: 20
                };

            // 🔴 HUMO
            } else {
                config = {
                    type: "smoke",
                    class: "word-neutral",
                    words: ["APROBACION", "IMPULSO", "EGO", "VICTIMA", "GASTO"],
                    val: -10
                };
            }

            const word = config.words[Math.floor(Math.random() * config.words.length)];

            const el = document.createElement("div");
            el.className = `floating ${config.class}`;
            el.innerText = word;

            el.style.left = Math.random() * 90 + "vw";

            el.onclick = () => {

                el.style.transform = "scale(3)";
                el.style.opacity = "0";

                state.score += config.val;
                state.lastAction = Date.now();

                if (config.val > 0) {
                    state.streak++;
                    state.attention = Math.min(100, state.attention + 2);
                    AudioSystem.play("win");
                    Speech.say(Psychology[word] || "Good decision");
                } else {
                    state.mistakes++;
                    state.streak = 0;
                    state.attention -= 5;
                    AudioSystem.play("bad");
                    Speech.say("Warning: " + (Psychology[word] || "Bad choice"));
                }

                UI.update();

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
    // 🎮 DECISION ENGINE (NARRATIVA + REACCIÓN)
    // =====================================================
    const Decision = {

        handle(option) {

            Lock.on();

            const box = document.getElementById("explanation-box");
            box.style.display = "block";

            const text = option.explanation?.[state.lang] || "No explanation";
            box.innerText = text;

            const good = ["Smart choice", "Excellent", "Focused mind"];
            const bad = ["Think again", "Risk detected", "Wrong path"];

            if (option.correct) {
                document.body.style.background = "#003300";
                AudioSystem.play("win");
                Speech.say(good[Math.floor(Math.random() * good.length)] + ". " + text);
                state.streak++;
                state.attention += 3;
            } else {
                document.body.style.background = "#330000";
                AudioSystem.play("bad");
                Speech.say(bad[Math.floor(Math.random() * bad.length)] + ". " + text);
                state.mistakes++;
                state.streak = 0;
                state.attention -= 5;
            }

            UI.update();

            setTimeout(() => {
                document.body.style.background = "";
                box.style.display = "none";
                SilenceReto.start();
            }, 5000);
        }
    };

    // =====================================================
    // 🧘 SILENCE SYSTEM (MEJORADO REAL)
    // =====================================================
    const SilenceReto = {

        start() {

            state.silenceActive = true;
            UI.clear();

            Speech.say("Silence mode activated. Control yourself.");

            let t = state.silenceTime;

            const timer = setInterval(() => {

                t--;

                state.attention += 0.1; // micro mejora por calma

                if (t <= 0 || state.attention <= 0) {
                    clearInterval(timer);
                    this.finish();
                }

            }, 1000);
        },

        finish() {

            state.silenceActive = false;

            state.score += 30 + state.streak * 2;

            Speech.say("Silence completed. Mental upgrade achieved.");

            Mission.load();
        }
    };

    // =====================================================
    // 📂 MISSION SYSTEM
    // =====================================================
    const Mission = {

        async load() {

            Lock.on();

            try {

                const res = await fetch("/api/mission/next");
                const data = await res.json();

                state.mission = data;

                this.render(data);

            } catch (e) {

                console.error("Mission load failed");

                Speech.say("System error. Restarting mission.");

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
            }, 3000);

            setTimeout(() => {
                UI.render(decision.options);
            }, 7000);
        }
    };

    // =====================================================
    // 🖥️ UI SYSTEM
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
                b.innerText = opt.text[state.lang];
                b.className = "opt-btn";

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
            console.log("KAMIZEN ENGINE FULL ACTIVE");
        },

        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
        }
    };

})();

window.onload = () => KamizenEngine.init();
