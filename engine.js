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
        on() { state.locked = true; document.body.style.pointerEvents = "none"; },
        off() { state.locked = false; document.body.style.pointerEvents = "auto"; },
        is() { return state.locked; }
    };
    // =========================
    // 🔊 AUDIO SYSTEM
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
    // 🌌 FLOATING WORDS
    // =========================
    const FloatingWords = {
        psychology: {
            CRITERIO: "Decision power: You become a leader, not a follower.",
            ESTRATEGIA: "Social strategy: You attract strong allies.",
            SABIDURIA: "Financial wisdom creates freedom.",
            VALENTIA: "Courage builds respect.",
            LEALTAD: "Loyalty gives you real support.",
            CALMA: "Calm breathing controls situations.",
            APROBACION: "Seeking approval destroys identity.",
            IMPULSO: "Impulse weakens your mind.",
            VICTIMA: "Blaming removes your power.",
            GASTO: "Impulse spending creates dependency.",
            DESENFOQUE: "Distraction kills purpose.",
            EGO: "Fear of opinion destroys dreams.",
            OPORTUNIDAD: "Opportunities move fast.",
            TIEMPO: "Time is your most valuable asset.",
            TELEFONO: "The phone can control you.",
            PANTALLA: "Screens can trap your mind.",
            DISTRACCION: "Noise pulls you away from your path."
        },
        start() {
            setInterval(() => {
                if (state.silenceActive || Lock.is()) return;
                this.spawn();
            }, 2000);
        },
        spawn() {
            const r = Math.random();
            let config;
            if (r > 0.9) {
                config = {
                    class: 'word-good',
                    val: -20,
                    words: ["TELEFONO", "PANTALLA", "DISTRACCION"],
                    speed: "2s",
                    isTrap: true
                };
            } else if (r > 0.6) {
                config = {
                    class: 'word-good',
                    val: 20,
                    words: ["CRITERIO", "ESTRATEGIA", "TIEMPO", "OPORTUNIDAD"],
                    speed: "2.5s"
                };
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
        }
    };
    // =========================
    // 🎯 DECISION SYSTEM (ORIGINAL)
    // =========================
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
                Speech.say("Excellent choice.");
                Speech.say(explanation);
            } else {
                document.body.style.backgroundColor = "#440000";
                AudioSystem.playEffect("bad");
                Speech.say("Wrong decision.");
                Speech.say(explanation);
            }
            setTimeout(async () => {
                document.body.style.backgroundColor = "";
                box.style.display = "none";
                await SilenceReto.start();
            }, 6000);
        }
    };
    // =========================
    // 🤫 SILENCE SYSTEM (ORIGINAL)
    // =========================
    const SilenceReto = {
        async start() {
            state.silenceActive = true;
            const breath = document.getElementById("breath");
            const story = document.getElementById("story");
            breath.style.display = "block";
            story.innerText = `SILENCE: ${state.silenceTime}s`;

            let t = state.silenceTime;

            const timer = setInterval(() => {
                t--;
                if (t <= 0) {
                    clearInterval(timer);
                    this.complete();
                }
            }, 1000);
        },
        complete() {
            state.silenceActive = false;
            document.getElementById("breath").style.display = "none";
            state.missionId++;
            Mission.loadNext();
        }
    };
    // =========================
    // 🎮 MISSION SYSTEM (ORIGINAL)
    // =========================
    const Mission = {
        async loadNext() {
            Lock.on();
            try {
                const res = await fetch("/api/mission/next");
                const data = await res.json();
                state.mission = data;
                this.render(data);
            } catch (e) {
                console.error("Mission load error");
            }
            Lock.off();
        },
        render(m) {
            const story = m.blocks.find(b => b.type === "story").text[state.lang];
            const analysis = m.blocks.find(b => b.type === "analysis").text[state.lang];
            const decision = m.blocks.find(b => b.type === "decision");
            UI.setText("story", story);
            UI.setText("analysis", "");
            Speech.say(story);
            setTimeout(() => {
                UI.setText("analysis", analysis);
                Speech.say(analysis);
            }, 4000);
            setTimeout(() => {
                UI.renderOptions(decision.options);
            }, 8000);
        }
    };
    // =========================
    // UI
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
    return {
        init() {
            AudioSystem.init();
            FloatingWords.start();
            Mission.loadNext();
            console.log("ENGINE READY");
        }
    };
})();
window.onload = () => KamizenEngine.init();
