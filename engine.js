/**
 * 🧠 KAMIZEN ENGINE CORE — AL CIELO EDITION
 * Director de Orquesta: Música, Disparos, TVID y Neuro-Silence
 */

const KamizenEngine = (() => {

    // ==========================================
    // 📊 ESTADO GLOBAL (Single Source of Truth)
    // ==========================================
    const state = {
        score: 0,
        energy: 100,
        lang: "en",
        missionId: 1,
        mission: null,
        locked: false,
        silenceActive: false,
        silenceTime: 180,
        floatingWords: []
    };

    // ==========================================
    // 🔒 LOCK
    // ==========================================
    const Lock = {
        on() { state.locked = true; document.body.style.pointerEvents = "none"; },
        off() { state.locked = false; document.body.style.pointerEvents = "auto"; },
        is() { return state.locked; }
    };

    // ==========================================
    // 🔊 AUDIO SYSTEM (MEJORADO)
    // ==========================================
    const AudioSystem = {
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

    // ==========================================
    // 🗣️ SPEECH
    // ==========================================
    const Speech = {
        say(text) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.9;
            window.speechSynthesis.speak(u);
        }
    };

    // ==========================================
    // 🎯 FLOATING WORDS + ADVANCE PSYCHOLOGY 
    // ==========================================
    const FloatingWords = {
       psychology: {
            CRITERION: "Decision power: You become a leader, not a follower.",
            ESTRATEGY: "Social strategy: You attract strong allies.",
            WISDOM: "Financial wisdom creates freedom.",
            COURAGE: "Courage builds respect.",
            LOYALTY: "Loyalty gives you real support.",
            CALM: "Calm breathing controls situations.",

            APPROVAL: "Seeking approval destroys identity.",
            IMPULSE: "Impulse weakens your mind.",
            VICTIM: "Blaming removes your power.",
            SPEND: "Impulse spending creates dependency.",
            DESENFOQUE: "Distraction kills purpose.",
            EGO: "Fear of opinion destroys dreams.",

            OPORTUNITY: "Opportunities move fast.",
            TIMPE: "Time is your most valuable asset.",
            PHONE: "The phone can control you.",
            SCREEN: "Screens can trap your mind.",
            DISTRACTION: "Noise pulls you away from your path."
        },

        start() {
            setInterval(() => {
                if (!state.silenceActive && !Lock.is()) {
                    this.spawn();
                }
            }, 2000);
        },

        spawn() {
            const r = Math.random();
            let config;

            if (r > 0.9) {
                config = {
                    class: 'word-good',
                    val: -20,
                    words: ["PHONE", "SCREEN", "DISTRACTION"],
                    speed: "2s",
                    isTrap: true
                };
            } else if (r > 0.6) {
                config = {
                    class: 'word-good',
                    val: 20,
                    words: [“CRITERION”, “STRATEGY”, “OPPORTUNITY”, “TIME”],
                    speed: "2.5s"
                };
            } else {
                config = {
                    class: 'word-bad',
                    val: -10,
                    words: [“IMPULSE”, “EGO”, “VICTIM”, “DISTRACTION”],
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
                    Speech.say("¡Bien! " + (this.psychology[word] || ""));
                } else {
                    AudioSystem.playEffect('bad');
                    const trap = config.isTrap ? "¡Trampa! " : "";
                    Speech.say(trap + (this.psychology[word] || ""));
                }

                UI.updateScore();
                setTimeout(() => el.remove(), 300);
            };

            document.body.appendChild(el);
            setTimeout(() => el.remove(), parseFloat(config.speed) * 1000);
        }
    };

    // ==========================================
    // 🎮 DECISION ENGINE
    // ==========================================
    const Decision = {
        async handle(option) {
            Lock.on();

            const box = document.getElementById("explanation-box");
            box.style.display = "block";

            const explanation = option.explanation[state.lang];
            box.innerText = explanation;

            if (option.correct) {
                document.body.style.backgroundColor = "#004400";
                AudioSystem.playEffect("win");
                Speech.say("¡Correcto! " + explanation);
            } else {
                document.body.style.backgroundColor = "#440000";
                AudioSystem.playEffect("bad");
                Speech.say("Atención. " + explanation);
            }

            setTimeout(async () => {
                document.body.style.backgroundColor = "";
                box.style.display = "none";
                await SilenceReto.start();
            }, 6000);
        }
    };

    // ==========================================
    // 🧘 SILENCIO
    // ==========================================
    const SilenceReto = {
        async start() {
            state.silenceActive = true;
            UI.clearOptions();
            Speech.say("Iniciando silencio.");

            UI.showBreath(true);

            let timeLeft = state.silenceTime;

            const timer = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0 || !state.silenceActive) {
                    clearInterval(timer);
                    this.complete();
                }
            }, 1000);
        },

        complete() {
            state.silenceActive = false;
            UI.showBreath(false);
            Speech.say("Silencio completado.");
            Mission.loadNext();
        }
    };

    // ==========================================
    // 📂 MISSIONS
    // ==========================================
    const Mission = {
        async loadNext() {
            Lock.on();
            const res = await fetch("/api/mission/next");
            const data = await res.json();
            state.mission = data;
            this.render(data);
            Lock.off();
        },

        render(m) {
            const story = m.blocks.find(b => b.type === "story").text[state.lang];
            UI.setText("story", story);
            Speech.say(story);

            setTimeout(() => {
                UI.renderOptions(m.blocks.find(b => b.type === "decision").options);
            }, 5000);
        }
    };

    // ==========================================
    // 🖥️ UI
    // ==========================================
    const UI = {
        setText(id, val) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        },
        updateScore() {
            this.setText("score-display", `PUNTOS: ${state.score}`);
        },
        clearOptions() {
            document.getElementById("options").innerHTML = "";
        },
        showBreath(show) {
            document.getElementById("breath").style.display = show ? "block" : "none";
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

    // ==========================================
    // INIT
    // ==========================================
    return {
        init() {
            AudioSystem.init();
            FloatingWords.start();
            Mission.loadNext();
        }
    };

})();

window.onload = () => KamizenEngine.init();
