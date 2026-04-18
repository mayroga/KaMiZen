/**
 * 🧠 KAMIZEN ENGINE CORE — AL CIELO EDITION (NO LOCK SYSTEM)
 */
const KamizenEngine = (() => {
    // =========================
    // 🧠 GLOBAL STATE
    // =========================
    const state = {
        score: 0,
        energy: 100,
        lang: "en",
        missionId: 1,
        mission: null,
        silenceActive: false,
        silenceTime: 20,
        player: { name: "", hero: "" }
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
            if (this.bg) {
                this.bg.volume = 0.3;
                this.bg.playbackRate = 1.1;
                this.bg.play().catch(() => {});
            }
        },
        play(type) {
            if (type === "win" && this.ok) {
                this.ok.currentTime = 0;
                this.ok.play();
            }
            if (type === "bad" && this.bad) {
                this.bad.currentTime = 0;
                this.bad.play();
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
            speechSynthesis.speak(u);
        }
    };
    // =========================
    // 🌌 FLOATING WORDS
    // =========================
    const FloatingWords = {
        psychology: {
            CRITERIO: "Decision power: You become a leader.",
            ESTRATEGIA: "Social strategy builds allies.",
            SABIDURIA: "Wisdom creates freedom.",
            VALENTIA: "Courage builds respect.",
            CALMA: "Breathing controls mind.",
            IMPULSO: "Impulse weakens control.",
            EGO: "Ego blinds decisions.",
            DISTRACCION: "Loses focus.",
            TIEMPO: "Time is your asset.",
            OPORTUNIDAD: "Opportunity must be taken."
        },
        interval: null,
        start() {
            this.interval = setInterval(() => {
                if (!state.silenceActive) {
                    this.spawn();
                }
            }, 2000);
        },
        spawn() {
            const r = Math.random();
            let config;
            if (r > 0.9) {
                config = {
                    val: -20,
                    words: ["IMPULSO", "EGO", "DISTRACCION"],
                    speed: "2s",
                    class: "word-bad"
                };
            } else if (r > 0.6) {
                config = {
                    val: 20,
                    words: ["CRITERIO", "ESTRATEGIA", "TIEMPO"],
                    speed: "2.5s",
                    class: "word-good"
                };
            } else {
                config = {
                    val: -10,
                    words: ["VICTIMA", "EGO", "APROBACION"],
                    speed: "6s",
                    class: "word-bad"
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
                    AudioSystem.play("win");
                    Speech.say(this.psychology[word] || "Good choice.");
                } else {
                    AudioSystem.play("bad");
                    Speech.say(this.psychology[word] || "Wrong choice.");
                }
                UI.updateScore();
                setTimeout(() => el.remove(), 300);
            };
            document.body.appendChild(el);
            setTimeout(() => el.remove(), parseFloat(config.speed) * 1000);
        }
    };
    // =========================
    // 🎯 DECISION SYSTEM
    // =========================
    const Decision = {
        handle(option) {
            const box = document.getElementById("explanation-box");
            box.style.display = "block";
            box.innerText = option.explanation[state.lang];
            if (option.correct) {
                state.score += 20;
                AudioSystem.play("win");
                Speech.say("Correct choice.");
            } else {
                state.score -= 10;
                AudioSystem.play("bad");
                Speech.say("Wrong choice.");
            }
            UI.updateScore();
            setTimeout(() => {
                box.style.display = "none";
                SilenceReto.start();
            }, 4000);
        }
    };
    // =========================
    // 🤫 SILENCE SYSTEM
    // =========================
    const SilenceReto = {
        start() {
            state.silenceActive = true;
            UI.clearOptions();
            const breath = document.getElementById("breath");
            const story = document.getElementById("story");
            const analysis = document.getElementById("analysis");
            breath.style.display = "block";
            let t = state.silenceTime;
            story.innerText = `SILENCE: ${t}s`;
            analysis.innerText = "Breathe slowly.";
            Speech.say("Start breathing");
            this.breathLoop();
            const timer = setInterval(() => {
                t--;
                story.innerText = `SILENCE: ${t}s`;
                if (t <= 0) {
                    clearInterval(timer);
                    this.complete();
                }
            }, 1000);
        },
        breathLoop() {
            const b = document.getElementById("breath");
            let grow = true;
            const interval = setInterval(() => {
                if (!state.silenceActive) {
                    clearInterval(interval);
                    return;
                }
                // FIX CRÍTICO
                b.style.transform = grow ? "scale(2.5)" : "scale(1)";
                grow = !grow;

            }, 2000);
        },
        complete() {
            state.silenceActive = false;
            document.getElementById("breath").style.display = "none";
            Speech.say("Silence complete");
            state.missionId++;
            Mission.loadNext();
        }
    };
    // =========================
    // 🎮 MISSION SYSTEM
    // =========================
    const Mission = {
        async loadNext() {
            try {
                const res = await fetch(`/api/mission/${state.missionId}`);
                const data = await res.json();
                state.mission = data;
                this.render(data);
            } catch (e) {
                console.error("Mission error", e);
            }
        },
        render(m) {
            const story = m.blocks.find(b => b.type === "story").text[state.lang];
            const analysis = m.blocks.find(b => b.type === "analysis").text[state.lang];
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
            }, 6000);
        }
    };
    // =========================
    // UI
    // =========================
    const UI = {
        set(id, val) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        },
        updateScore() {
            this.set("score-display", `POINTS: ${state.score}`);
        },
        clearOptions() {
            const el = document.getElementById("options");
            if (el) el.innerHTML = "";
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
    // =========================
    // INIT
    // =========================
    return {
        init() {
            state.player.name = prompt("Name:") || "Player";
            state.player.hero = prompt("Hero:") || "Kamizen";
            document.getElementById("hero-name").innerText = state.player.hero;
            AudioSystem.init();
            FloatingWords.start();
            Mission.loadNext();
            console.log("ENGINE READY");
        }
    };
})();
window.onload = () => KamizenEngine.init();
