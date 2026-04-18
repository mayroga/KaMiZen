/**
 * 🧠 KAMIZEN ENGINE CORE — ORCHESTRATOR FINAL v4
 * FULL CONTROL STATE SYSTEM + FLOATING + SILENCE + RELAX CYCLE
 */
const KamizenEngine = (() => {
    // =========================
    // 🧠 GLOBAL STATE (ORCHESTRATOR)
    // =========================
    const state = {
        score: 0,
        energy: 100,
        lang: "en",
        missionId: 1,
        mission: null,
        player: { name: "", hero: "" },
        // MODE CONTROL (KEY SYSTEM)
        mode: "idle", // idle | mission | decision | silence | breathing | relax
        silenceActive: false,
        silenceTime: 20,
        relaxUntil: 0,
        floatingBlockedUntil: 0,
        speaking: false
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
                this.bg.playbackRate = 1.05;
                this.bg.play().catch(()=>{});
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
                document.body.classList.add("flash-red");
                setTimeout(()=>document.body.classList.remove("flash-red"),300);
            }
        }
    };
    // =========================
    // 🧠 SPEECH SYSTEM
    // =========================
    const Speech = {
        queue: [],
        say(text) {
            this.queue.push(text);
            this.run();
        },
        run() {
            if (state.speaking || this.queue.length === 0) return;
            state.speaking = true;
            const u = new SpeechSynthesisUtterance(this.queue.shift());
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.9;
            u.onend = () => {
                state.speaking = false;
                this.run();
            };
            speechSynthesis.speak(u);
        }
    };
    // =========================
    // 🌌 FLOATING WORDS SYSTEM (FULL ORCHESTRATED)
    // =========================
    const FloatingWords = {
        psychology: {
            CRITERIO: "Decision power builds leadership.",
            ESTRATEGIA: "Strategy creates allies.",
            SABIDURIA: "Wisdom builds freedom.",
            VALENTIA: "Courage creates respect.",
            CALMA: "Calm controls the mind.",
            IMPULSO: "Impulse reduces control.",
            EGO: "Ego blinds decisions.",
            DISTRACCION: "Distraction destroys focus.",
            TIEMPO: "Time is your real asset.",
            OPORTUNIDAD: "Opportunity must be taken."
        },
        wordPool: {
            good: ["WISDOM", "STRATEGY", "COURAGE", "FOCUS", "CALM", "TIME"],
            bad: ["IMPULSE", "EGO", "DISTRACTION", "FEAR", "VICTIM"],
            neutral: ["CITY", "STREET", "CLOCK", "WAIT", "NOISE"]
        },
        start() {
            setInterval(() => {
                if (!this.canSpawn()) return;
                this.spawn();
            }, 2000);
        },
        canSpawn() {
            const now = Date.now();
            if (state.mode === "mission") return false;
            if (state.mode === "decision") return false;
            if (state.mode === "breathing") return false;
            if (now < state.relaxUntil) return false;
            if (now < state.floatingBlockedUntil) return false;
            return true;
        },
        spawn() {
            const r = Math.random();
            let config;
            // 🧨 TRAP
            if (r > 0.9) {
                config = {
                    val: -20,
                    words: ["IMPULSE","EGO","DISTRACTION"],
                    speed: "2s",
                    trap: true
                };
            }
            // 🟢 CONTROL WORDS
            else if (r > 0.6) {
                config = {
                    val: 20,
                    words: ["CRITERIO","ESTRATEGIA","TIEMPO","OPORTUNIDAD"],
                    speed: "2.5s"
                };
            }
            // 🌫 MIXED
            else {
                config = {
                    val: Math.random() > 0.5 ? 20 : -10,
                    words: [
                        ...this.wordPool.good,
                        ...this.wordPool.bad,
                        ...this.wordPool.neutral
                    ],
                    speed: "5s"
                };
            }
            const word = config.words[Math.floor(Math.random()*config.words.length)];
            const el = document.createElement("div");
            el.className = `floating ${Math.random() > 0.5 ? "word-good" : "word-bad"}`;
            el.innerText = word;
            el.style.left = Math.random()*90 + "vw";
            el.style.animationDuration = config.speed;
            el.onmousedown = () => {
                el.classList.add("blast");
                state.score += config.val;
               if (config.val > 0) {
                    AudioSystem.play("win");
                    Speech.say(this.psychology[word] || "Good focus.");
                } else {
                    AudioSystem.play("bad");
                    Speech.say(this.psychology[word] || "Wrong choice.");
                }
                UI.updateScore();
                setTimeout(()=>el.remove(),300);
            };
            document.body.appendChild(el);
            setTimeout(()=>el.remove(), parseFloat(config.speed)*1000);
        }
    };
    // =========================
    // 🎯 DECISION SYSTEM
    // =========================
    const Decision = {
        async handle(option) {
            state.mode = "decision";
            const box = document.getElementById("explanation-box");
            if (box) {
                box.style.display = "block";
                box.innerText = option.explanation[state.lang];
            }
            if (option.correct) {
                state.score += 20;
                AudioSystem.play("win");
                Speech.say("Correct decision.");
            } else {
                state.score -= 10;
                AudioSystem.play("bad");
                Speech.say("Wrong decision.");
            }
            UI.updateScore();
            setTimeout(() => {
                if (box) box.style.display = "none";
                SilenceReto.start();
            }, 4000);
        }
    };
    // =========================
    // 🤫 SILENCE SYSTEM (WITH FLOATING SOFT MODE)
    // =========================
    const SilenceReto = {
        getTime() {
            return Math.min(30 + state.missionId * 5, 60);
        },
        async start() {
            state.mode = "silence";
            const breath = document.getElementById("breath");
            const story = document.getElementById("story");
            const analysis = document.getElementById("analysis");
            if (breath) breath.style.display = "block";
            let time = this.getTime();
            story.innerText = `BREATH + SILENCE (${time}s)`;
            analysis.innerText = "Slow breathing control.";
            Speech.say("Start breathing.");
            this.breathGuide(time);
            const timer = setInterval(() => {
                time--;
                story.innerText = `SILENCE: ${time}s`;
                if (time <= 0) {
                    clearInterval(timer);
                    this.complete();
                }
            }, 1000);
        },
        breathGuide(totalTime) {
            const b = document.getElementById("breath");
            let grow = true;
            let cycles = Math.floor(totalTime / 4);
            const interval = setInterval(() => {
                if (state.mode !== "silence" || cycles <= 0) {
                    clearInterval(interval);
                    return;
                }
                if (grow) {
                    if (b) b.style.transform = "scale(2.5)";
                    Speech.say("Inhale");
                } else {
                    if (b) b.style.transform = "scale(1)";
                    Speech.say("Exhale");
                    cycles--;
                }
                grow = !grow;
            }, 2000);
        },
        complete() {
            state.mode = "idle";
            const breath = document.getElementById("breath");
            if (breath) breath.style.display = "none";
            Speech.say("Silence complete.");
            setTimeout(() => Wellness.risotherapy(), 1000);
        }
    };
    // =========================
    // 🌿 WELLNESS SYSTEM
    // =========================
    const Wellness = {
        risotherapy() {
            let t = 10;
            const story = document.getElementById("story");
            const analysis = document.getElementById("analysis");
            story.innerText = "LAUGHTER THERAPY";
            analysis.innerText = "Smile and release tension.";
            const timer = setInterval(() => {
                t--;
                story.innerText = `LAUGHTER: ${t}s`;
                if (t <= 0) {
                    clearInterval(timer);
                    this.pause();
                }
            }, 1000);
        },
        pause() {
            state.mode = "relax";
            state.relaxUntil = Date.now() + 10 * 60 * 1000;
            let t = 15;
            const story = document.getElementById("story");
            story.innerText = "NEURAL RESET";
            const timer = setInterval(() => {
                t--;
                story.innerText = `RESET: ${t}s`;
                if (t <= 0) {
                    clearInterval(timer);
                    state.missionId++;
                    Mission.loadNext();
                }
            }, 1000);
        }
    };
    // =========================
    // 🎮 MISSION SYSTEM
    // =========================
    const Mission = {
        async loadNext() {
            state.mode = "mission";
            try {
                const res = await fetch(`/api/mission/${state.missionId}`);
                const data = await res.json();
                state.mission = data;
                this.render(data);
            } catch {
                console.error("Mission error");
            }
        },
        render(m) {
            const story = m.blocks.find(b=>b.type==="story").text[state.lang];
            const analysis = m.blocks.find(b=>b.type==="analysis").text[state.lang];
            const decision = m.blocks.find(b=>b.type==="decision");
            UI.set("story", story);
            UI.set("analysis", "");
            Speech.say(story);
            setTimeout(() => {
                UI.set("analysis", analysis);
                Speech.say(analysis);
            }, 4000);
            setTimeout(() => {
                UI.render(decision.options);
            }, 8000);
        }
    };
    // =========================
    // UI SYSTEM
    // =========================
    const UI = {
        set(id,val){
            const el=document.getElementById(id);
            if(el) el.innerText=val;
        },
        updateScore(){
            this.set("score-display",`POINTS: ${state.score}`);
        },
        render(options){
            const c=document.getElementById("options");
            if(!c) return;
            c.innerHTML="";
            options.forEach(opt=>{
                const b=document.createElement("button");
                b.innerText = opt.text[state.lang];
                b.onclick = () => Decision.handle(opt);
                c.appendChild(b);
            });
        }
    };
    // =========================
    // ⌨️ KEY CONTROL (SKIP SYSTEM)
    // =========================
    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            state.mode = "mission";
            document.querySelectorAll(".floating").forEach(el => el.remove());

            Mission.loadNext();
        }
    });
    // =========================
    // INIT
    // =========================
    return {
        init() {
            state.player.name = prompt("Your name:") || "Player";
            state.player.hero = prompt("Hero:") || "Kamizen";
            const hero = document.getElementById("hero-name");
            if (hero) hero.innerText = state.player.hero;
            AudioSystem.init();
            FloatingWords.start();
            Mission.loadNext();
            console.log("KAMIZEN ENGINE ORCHESTRATOR READY");
        }
    };
})();
window.onload = () => KamizenEngine.init();
