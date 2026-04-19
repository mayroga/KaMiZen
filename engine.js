/**
 * 🧠 KAMIZEN ENGINE CORE — LIFE SCHOOL SYSTEM (JSON DRIVEN 1–35)
 * FULL INTEGRATION: MISSIONS + DUALITY + EXPLANATIONS + LANGUAGE + CONTROL PENALTY
 */

const KamizenEngine = (() => {

    // =====================================================
    // 📊 GLOBAL STATE
    // =====================================================
    const state = {
        score: 0,
        lang: "en",

        missionIndex: 0,
        missions: [],
        current: null,

        locked: false,
        mode: "mission",

        level: 1,
        streak: 0,

        autoMode: true,
        lastInteraction: Date.now()
    };

    // =====================================================
    // 🧱 DOM
    // =====================================================
    const DOM = {
        set(id, val) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
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
    // 🔒 LOCK
    // =====================================================
    const Lock = {
        on() {
            state.locked = true;
        },
        off() {
            state.locked = false;
        }
    };

    // =====================================================
    // 🔊 AUDIO
    // =====================================================
    const AudioSystem = {
        ok: null,
        bad: null,

        init() {
            this.ok = document.getElementById("ok");
            this.bad = document.getElementById("bad");
        },

        play(type) {
            const a = type === "win" ? this.ok : this.bad;
            if (!a) return;
            a.currentTime = 0;
            a.play().catch(() => {});
        }
    };

    // =====================================================
    // 🗣️ SPEECH (BILINGUAL REAL)
    // =====================================================
    const Speech = {
        say(text) {
            if (!text) return;
            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "es" ? "es-ES" : "en-US";
            u.rate = 0.9;
            speechSynthesis.speak(u);
        }
    };

    // =====================================================
    // 📂 JSON LOADER (MULTI FILE 1–35)
    // =====================================================
    const Loader = {

        async loadAll() {

            const files = [
                "/static/missions_01_07.json",
                "/static/missions_08_14.json",
                "/static/missions_15_21.json",
                "/static/missions_22_28.json",
                "/static/missions_29_35.json"
            ];

            for (let f of files) {
                try {
                    const res = await fetch(f);
                    const data = await res.json();

                    state.missions.push(...data.missions);

                    // usar palabras flotantes dinámicas
                    Floating.setWords(data.ui?.floating_words || []);

                    // guardar reglas
                    state.rules = data.matrix_rules;

                } catch (e) {
                    console.warn("Missing file:", f);
                }
            }
        }
    };

    // =====================================================
    // 🌌 FLOATING WORDS (CON EXPLICACIÓN DE VIDA)
    // =====================================================
    const Floating = {

        words: [],
        interval: null,

        setWords(arr) {
            this.words = arr;
        },

        spawn() {

            if (state.mode !== "mission") return;

            const word = this.words[Math.floor(Math.random() * this.words.length)];

            const el = document.createElement("div");
            el.className = "floating";
            el.innerText = word;
            el.style.left = Math.random() * 90 + "vw";

            el.onclick = () => {

                state.score += 5;

                const msg = state.lang === "es"
                    ? `Palabra: ${word}. En la vida, lo que repites se vuelve hábito.`
                    : `Word: ${word}. In life, what you repeat becomes your habit.`;

                DOM.set("analysis", msg);
                Speech.say(msg);

                DOM.set("points-display", "POINTS: " + state.score);

                el.style.transform = "scale(5)";
                el.style.opacity = "0";

                setTimeout(() => el.remove(), 300);
            };

            document.body.appendChild(el);
            setTimeout(() => el.remove(), 5000);
        },

        start() {
            if (this.interval) return;
            this.interval = setInterval(() => this.spawn(), 1500);
        }
    };

    // =====================================================
    // 🧠 DECISION SYSTEM (CON EXPLICACIÓN TOTAL + DUALIDAD)
    // =====================================================
    const Decision = {

        handle(opt) {

            Lock.on();

            const box = document.getElementById("explanation-box");

            let resultText = "";
            let explain = opt.explanation[state.lang];

            if (opt.correct === true) {
                state.score += 20;
                AudioSystem.play("win");

                resultText = state.lang === "es"
                    ? "Decisión correcta.\n" + explain
                    : "Correct decision.\n" + explain;

            } else if (opt.correct === "partial") {
                state.score += 5;

                resultText = state.lang === "es"
                    ? "Decisión parcial.\n" + explain
                    : "Partial decision.\n" + explain;

            } else {
                state.score -= 10;
                AudioSystem.play("bad");

                // 🔥 DUALIDAD (ERROR → APRENDIZAJE)
                resultText = state.lang === "es"
                    ? "Error detectado. Aprende:\n" + explain
                    : "Error detected. Learn:\n" + explain;
            }

            box.innerText = resultText;
            box.style.display = "block";

            DOM.set("points-display", "POINTS: " + state.score);

            Speech.say(resultText);

            setTimeout(() => {
                box.style.display = "none";
                Lock.off();
                Mission.next();
            }, 4000);
        }
    };

    // =====================================================
    // 🧘 BREATHING (CIENTÍFICO REAL SIMPLE)
    // =====================================================
    const Breathing = {

        start() {

            state.mode = "breathing";

            const el = document.getElementById("breath");
            el.style.display = "block";

            const msg = state.lang === "es"
                ? "Respira. Inhalar activa energía. Exhalar calma tu sistema nervioso."
                : "Breathe. Inhale activates energy. Exhale calms your nervous system.";

            Speech.say(msg);

            let phase = true;

            this.interval = setInterval(() => {
                el.innerText = phase ? "INHALE" : "EXHALE";
                el.style.transform = phase ? "scale(2.5)" : "scale(1)";
                phase = !phase;
            }, 3000);

            setTimeout(() => this.stop(), 15000);
        },

        stop() {
            clearInterval(this.interval);
            document.getElementById("breath").style.display = "none";
            state.mode = "mission";
        }
    };

    // =====================================================
    // 🤫 SILENCE
    // =====================================================
    const Silence = {

        start() {

            state.mode = "silence";

            let t = 20;

            const msg = state.lang === "es"
                ? "Silencio. Observa sin reaccionar."
                : "Silence. Observe without reacting.";

            Speech.say(msg);

            const id = setInterval(() => {
                t--;
                if (t <= 0) {
                    clearInterval(id);
                    state.score += 15;
                    state.mode = "mission";
                }
            }, 1000);
        }
    };

    // =====================================================
    // 📂 MISSION SYSTEM (JSON SECUENCIAL REAL)
    // =====================================================
    const Mission = {

        next() {
            state.missionIndex++;

            if (state.missionIndex >= state.missions.length) {
                state.missionIndex = 0;
            }

            this.load();
        },

        load() {

            state.mode = "mission";

            const m = state.missions[state.missionIndex];
            state.current = m;

            const story = m.blocks.find(b => b.type === "story").text[state.lang];
            const analysis = m.blocks.find(b => b.type === "analysis").text[state.lang];
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
                const b = DOM.create("button", "opt-btn", opt.text[state.lang]);
                b.onclick = () => Decision.handle(opt);
                c.appendChild(b);
            });
        }
    };

    // =====================================================
    // ⚠️ CONTROL PENALTY (BOTONES MANUALES)
    // =====================================================
    const Control = {

        punish(action) {

            state.score -= 15;

            const msg = state.lang === "es"
                ? `Interrupción detectada (${action}). En la vida, romper el proceso reduce resultados.`
                : `Interruption detected (${action}). In life, breaking process reduces results.`;

            DOM.set("analysis", msg);
            Speech.say(msg);

            DOM.set("points-display", "POINTS: " + state.score);
        }
    };

    // =====================================================
    // 🚀 INIT
    // =====================================================
    return {

        async init() {
            AudioSystem.init();
            await Loader.loadAll();
            Floating.start();
            Mission.load();
        },

        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
            Mission.load();
        },

        continue() {
            Control.punish("continue");
            Mission.next();
        },

        back() {
            Control.punish("back");
            state.missionIndex = Math.max(0, state.missionIndex - 1);
            Mission.load();
        }
    };

})();
