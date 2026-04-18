/**
 * 🧠 KAMIZEN ENGINE CORE — AL CIELO EDITION
 */
const KamizenEngine = (() => {
    const state = {
        score: 0,
        energy: 100,
        lang: "en",
        missionId: 1,
        mission: null,
        locked: false,
        silenceActive: false,
        silenceTime: 20,
        floatingWords: ["POWER", "FOCUS", "STREET", "TRUTH"]
    };
    // =========================
    // 🔒 LOCK SYSTEM
    // =========================
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
    // =========================
    // 🔊 AUDIO SYSTEM (IMPROVED)
    // =========================
    const AudioSystem = {
        bg: null,
        ok: null,
        bad: null,

        init() {
            this.bg = document.getElementById("bg");
            this.ok = document.getElementById("ok");
            this.bad = document.getElementById("bad");
            this.playDopamine();
        },
        playDopamine() {
            if (this.bg) {
                this.bg.playbackRate = 1.1;
                this.bg.volume = 0.3;
                this.bg.play().catch(() => {});
            }
        },
        playEffect(type) {
            if (type === 'win' && this.ok) {
                this.ok.currentTime = 0;
                this.ok.playbackRate = 1.2;
                this.ok.play();
            }
            if (type === 'bad' && this.bad) {
                this.bad.currentTime = 0;
                this.bad.play();
                document.body.classList.add("flash-red");
                setTimeout(() => document.body.classList.remove("flash-red"), 300);
            }
        }
    };
    // =========================
    // 🧠 SPEECH SYSTEM
    // =========================
    const Speech = {
        queue: [],
        speaking: false,
        say(text) {
            this.queue.push(text);
            this.run();
        },
        run() {
            if (this.speaking || this.queue.length === 0) return;
            this.speaking = true;
            const text = this.queue.shift();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.9;
            u.onend = () => {
                this.speaking = false;
                this.run();
            };
            window.speechSynthesis.speak(u);
        }
    };
    // =========================
    // 🌌 FLOATING WORDS (FULL FUSION SYSTEM)
    // =========================
    const FloatingWords = {
        psychology: {
            // 🧠 POWER / IDENTITY
            CRITERIO: "Decision Power: You become a leader, not a follower. No one can manipulate you.",
            ESTRATEGIA: "Social Strategy: You attract powerful allies and avoid unnecessary conflict.",
            SABIDURIA: "Financial Wisdom: Money becomes your tool for freedom, not your master.",
            VALENTIA: "Smart Courage: You overcome obstacles others avoid. You earn respect.",
            LEALTAD: "Family Loyalty: Your core team is your family. You are never alone.",
            CALMA: "Strategic Calm: Whoever controls breathing, controls the situation.",
            // ☠️ DISTORTIONS
            APROBACION: "Approval Smoke: You lose identity trying to please everyone.",
            IMPULSO: "Instant Gratification: Weak mind against difficulty.",
            VICTIMA: "Victim Mode: You lose power when blaming others.",
            GASTO: "Impulse Spending: Material slavery.",
            DESENFOQUE: "Distraction Fog: It removes you from your purpose.",
            EGO: "The 'What Will They Say' kills dreams.",
            // ⏳ MODERN CONTROL
            OPORTUNIDAD: "Opportunities move fast. You must be ready.",
            TIEMPO: "Time is your most valuable resource.",
            TELEFONO: "The phone can become your cage.",
            PANTALLA: "Screens are either tools or mental prisons.",
            DISTRACCION: "Noise pulls you away from your mission."
        },
        spawn() {
            if (state.silenceActive || Lock.is()) return;
            const r = Math.random();
            let config;
            // 🧨 HIDDEN TRAPS (LOOKS GOOD BUT NEGATIVE)
            if (r > 0.9) {
                config = {
                    class: 'word-good',
                    val: -20,
                    words: ["TELEFONO", "PANTALLA", "DISTRACCION"],
                    speed: "2s",
                    isTrap: true
                };
            // 🟢 HIGH VALUE WORDS
            } else if (r > 0.6) {
                config = {
                    class: 'word-good',
                    val: 20,
                    words: ["CRITERIO", "ESTRATEGIA", "TIEMPO", "OPORTUNIDAD"],
                    speed: "2.5s"
                };
            // 🔴 NEGATIVE DISTRACTIONS
            } else {
                config = {
                    class: 'word-bad',
                    val: -10,
                    words: ["IMPULSO", "VICTIMA", "EGO", "APROBACION"],
                    speed: "6s"
                };
            }
            const word = config.words[Math.floor(Math.random() * config.words.length)];
            const el = document.createElement("div");
            el.className = `floating ${config.class}`;
            el.innerText = word;
            el.style.left = Math.random() * 90 + "vw";
            el.style.animationDuration = config.speed;
            el.onmousedown = () => {
                el.classList.add("blast");
                state.score += config.val;
                if (config.val > 0) {
                    AudioSystem.playEffect('win');
                    Speech.say(this.psychology[word] || "Good choice.");
                } else {
                    AudioSystem.playEffect('bad');
                    const warn = config.isTrap ? "Trap detected! " : "";
                    Speech.say(warn + (this.psychology[word] || "Incorrect choice."));
                }

                UI.updateScore();
                setTimeout(() => el.remove(), 300);
            };
            document.body.appendChild(el);
            setTimeout(() => {
                if (el) el.remove();
            }, parseFloat(config.speed) * 1000);
        },
        start() {
            setInterval(() => this.spawn(), 2000);
        }
    };
    // =========================
    // UI SYSTEM
    // =========================
    const UI = {
        setText(id, val) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        },
        updateScore() {
            this.setText("score-display", `POINTS: ${state.score}`);
        },
        clearOptions() {
            document.getElementById("options").innerHTML = "";
        },
        renderOptions(options) {
            const container = document.getElementById("options");
            container.innerHTML = "";
            options.forEach(opt => {
                const b = document.createElement("button");
                b.className = "opt-btn";
                b.innerText = opt.text[state.lang];
                b.onclick = () => Decision.handle(opt);
                container.appendChild(b);
            });
        }
    };
    // =========================
    // PLACEHOLDERS (UNCHANGED CORE SYSTEMS)
    // =========================
    const Decision = { handle(option) {} };
    const SilenceReto = {};
    const Mission = {};
    // =========================
    // ENGINE INIT
    // =========================
    return {
        init() {
            AudioSystem.init();
            FloatingWords.start();
            Mission.loadNext?.();
            console.log("ENGINE READY");
        }
    };
})();
window.onload = () => KamizenEngine.init();
