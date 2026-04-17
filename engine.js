/**
 * 🧠 KAMIZEN ENGINE AAA — FINAL STABLE (NO FREEZE / ENGLISH ONLY)
 * Single Source of Truth — Production Ready
 */

const KamizenEngine = (() => {

    // ==========================================
    // 📊 GLOBAL STATE
    // ==========================================
    const state = {
        score: 0,
        energy: 100,
        focus: 100,
        lang: "en",
        mission: null,
        locked: false,
        silenceActive: false,
        silenceTime: 180,
        attentionLoss: 0,
        breathingInterval: 4000,
        initialized: false
    };

    const player = {
        name: "",
        hero: ""
    };

    // ==========================================
    // 🌍 TEXT SYSTEM (ENGLISH ONLY DEFAULT)
    // ==========================================
    const TEXT = {
        en: {
            silence: "SILENCE",
            dontTouch: "Do not touch anything. Breathe.",
            inhale: "Inhale",
            exhale: "Exhale",
            completed: "Challenge completed",
            lostFocus: "Attention lost. Restarting.",
            points: "POINTS",
            focus: "FOCUS",
            energy: "ENERGY"
        },
        es: {
            silence: "SILENCIO",
            dontTouch: "No toques nada. Respira.",
            inhale: "Inhala",
            exhale: "Exhala",
            completed: "Reto completado",
            lostFocus: "Perdiste atención. Reiniciando.",
            points: "PUNTOS",
            focus: "FOCUS",
            energy: "ENERGY"
        }
    };

    // ==========================================
    // 🔒 LOCK SYSTEM
    // ==========================================
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

    // ==========================================
    // 🔊 AUDIO SYSTEM
    // ==========================================
    const AudioSystem = {
        bg: null,
        ok: null,
        bad: null,

        init() {
            this.bg = document.getElementById("bg");
            this.ok = document.getElementById("ok");
            this.bad = document.getElementById("bad");

            if (this.bg) {
                this.bg.volume = 0.4;
                this.bg.playbackRate = 1.05;
                this.bg.play().catch(() => {});
            }
        },

        play(type) {
            if (type === "win" && this.ok) this.ok.play();
            if (type === "bad" && this.bad) this.bad.play();
        }
    };

    // ==========================================
    // 🗣️ SPEECH SYSTEM (ANTI-SPAM)
    // ==========================================
    const Speech = {
        speaking: false,

        say(text) {
            if (!text) return;
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = state.lang === "en" ? "en-US" : "es-ES";
            msg.rate = 0.9;
            window.speechSynthesis.speak(msg);
        }
    };

    // ==========================================
    // 🖥️ UI SYSTEM
    // ==========================================
    const UI = {
        set(id, val) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        },

        updateAll() {
            this.set("score-display", `${TEXT[state.lang].points}: ${state.score}`);
            this.set("focus-display", `${TEXT[state.lang].focus}: ${state.focus}%`);
            this.set("energy-display", `${TEXT[state.lang].energy}: ${this.energyIcons()}`);
        },

        energyIcons() {
            if (state.energy > 70) return "⚡⚡⚡";
            if (state.energy > 40) return "⚡⚡";
            if (state.energy > 10) return "⚡";
            return "—";
        },

        clearOptions() {
            const el = document.getElementById("options");
            if (el) el.innerHTML = "";
        },

        showBreath(show) {
            const el = document.getElementById("breath");
            if (el) el.style.display = show ? "block" : "none";
        },

        renderOptions(options) {
            const container = document.getElementById("options");
            container.innerHTML = "";

            options.forEach(opt => {
                const btn = document.createElement("button");
                btn.className = "opt-btn";
                btn.innerText = opt.text[state.lang];
                btn.onclick = () => Decision.handle(opt);
                container.appendChild(btn);
            });
        }
    };

    // ==========================================
    // 🎯 FLOATING SYSTEM
    // ==========================================
    const Floating = {
        interval: null,

        start() {
            if (this.interval) clearInterval(this.interval);

            this.interval = setInterval(() => {
                if (state.silenceActive || Lock.is()) return;
                this.spawn();
            }, 2200);
        },

        spawn() {
            const types = [
                { cls: "word-good", val: 5, words: ["FOCUS","POWER","TRUTH","CALM"] },
                { cls: "word-bad", val: -10, words: ["FEAR","LIE","LAZY","ANGER"] },
                { cls: "word-neutral", val: 0, words: ["CITY","WAIT","WALK","LOOK"] }
            ];

            const t = types[Math.floor(Math.random()*types.length)];

            const el = document.createElement("div");
            el.className = `floating ${t.cls}`;
            el.innerText = t.words[Math.floor(Math.random()*t.words.length)];
            el.style.left = Math.random() * 90 + "vw";

            el.onmousedown = () => {
                el.classList.add("blast");
                state.score += t.val;
                UI.updateAll();
                AudioSystem.play(t.val >= 0 ? "win" : "bad");
                setTimeout(() => el.remove(), 300);
            };

            document.body.appendChild(el);
            setTimeout(() => el.remove(), 5000);
        }
    };

    // ==========================================
    // 🎮 DECISION SYSTEM
    // ==========================================
    const Decision = {
        async handle(option) {

            if (state.locked) return;

            Lock.on();

            const box = document.getElementById("explanation-box");
            box.style.display = "block";

            const text = option.explanation[state.lang];
            box.innerText = text;

            if (option.correct === true) {
                state.score += 20;
                state.energy = Math.min(100, state.energy + 5);
                AudioSystem.play("win");
            }
            else if (option.correct === "partial") {
                state.score += 5;
                AudioSystem.play("win");
            }
            else {
                state.score -= 10;
                state.energy = Math.max(0, state.energy - 10);
                AudioSystem.play("bad");
            }

            UI.updateAll();
            Speech.say(text);

            await sleep(5000);

            box.style.display = "none";
            document.body.style.backgroundColor = "";

            await Silence.start();
        }
    };

    // ==========================================
    // 🧘 SILENCE SYSTEM (STABLE)
    // ==========================================
    const Silence = {

        async start() {

            state.silenceActive = true;
            state.attentionLoss = 0;

            UI.clearOptions();
            UI.showBreath(true);

            try {
                const res = await fetch(`/api/silence/${state.mission.level}`);
                const data = await res.json();
                state.silenceTime = data.silence_time;
            } catch {
                state.silenceTime = 180;
            }

            UI.set("story", `${TEXT[state.lang].silence}: ${Math.floor(state.silenceTime/60)} MIN`);
            UI.set("analysis", TEXT[state.lang].dontTouch);

            Speech.say(TEXT[state.lang].dontTouch);

            this.breathingLoop();

            let time = state.silenceTime;

            const timer = setInterval(() => {

                if (!state.silenceActive) {
                    clearInterval(timer);
                    return;
                }

                time--;

                if (time <= 0) {
                    clearInterval(timer);
                    this.complete();
                }

            }, 1000);
        },

        async breathingLoop() {
            const breath = document.getElementById("breath");

            while (state.silenceActive) {

                breath.style.transform = "scale(2.5)";
                Speech.say(TEXT[state.lang].inhale);
                await sleep(state.breathingInterval);

                breath.style.transform = "scale(1)";
                Speech.say(TEXT[state.lang].exhale);
                await sleep(state.breathingInterval);
            }
        },

        complete() {
            state.silenceActive = false;
            UI.showBreath(false);

            Speech.say(TEXT[state.lang].completed);

            Mission.next();
        }
    };

    // ==========================================
    // 👁️ ATTENTION CONTROL
    // ==========================================
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && state.silenceActive) {
            state.attentionLoss++;
            state.focus = Math.max(0, state.focus - 10);
            UI.updateAll();

            if (state.attentionLoss >= 2) {
                Speech.say(TEXT[state.lang].lostFocus);
                Silence.start();
            }
        }
    });

    document.addEventListener("click", (e) => {
        if (state.silenceActive) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);

    // ==========================================
    // 📂 MISSION SYSTEM
    // ==========================================
    const Mission = {

        async next() {

            Lock.on();

            try {
                const res = await fetch("/api/mission/next");
                const data = await res.json();

                state.mission = data;

                this.render(data);

            } catch (e) {
                console.error("Mission error");
            }

            Lock.off();
        },

        render(m) {

            const story = m.blocks.find(b => b.type === "story").text[state.lang];
            const analysis = m.blocks.find(b => b.type === "analysis").text[state.lang];
            const decision = m.blocks.find(b => b.type === "decision");

            UI.set("story", story);
            UI.set("analysis", "");
            UI.clearOptions();

            Speech.say(story);

            setTimeout(() => {
                UI.set("analysis", analysis);
                Speech.say(analysis);
            }, 4000);

            setTimeout(() => {
                UI.renderOptions(decision.options);
            }, 8000);
        }
    };

    // ==========================================
    // 🚀 INIT (SAFE)
    // ==========================================
    async function init() {

        if (state.initialized) return;
        state.initialized = true;

        player.name = prompt("Your real name:") || "Player";
        player.hero = prompt("Your hero name:") || "Kamizen";

        UI.set("hero-name", player.hero);

        AudioSystem.init();
        UI.updateAll();
        Floating.start();

        Mission.next();

        console.log("🧠 ENGINE READY — NO FREEZE");
    }

    function sleep(ms){
        return new Promise(r => setTimeout(r, ms));
    }

    // ==========================================
    // 🌐 PUBLIC API
    // ==========================================
    return {
        init,
        toggleLang(){
            state.lang = state.lang === "en" ? "es" : "en";
            if (state.mission) Mission.render(state.mission);
            UI.updateAll();
        }
    };

})();
