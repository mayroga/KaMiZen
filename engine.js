/**
 * 🧠 KAMIZEN ENGINE CORE — AL CIELO EDITION (FINAL INTEGRATED ULTRA STABLE)
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
        player: { name: "", hero: "" }
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
        bg: null, ok: null, bad: null,
        init() {
            this.bg = document.getElementById("bg");
            this.ok = document.getElementById("ok");
            this.bad = document.getElementById("bad");
            this.playDopamine();
        },
        playDopamine() {
            if (this.bg) {
                this.bg.volume = 0.3;
                this.bg.playbackRate = 1.05;
                this.bg.play().catch(()=>{});
            }
        },
        playEffect(type) {
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
        speaking: false,
        say(text) {
            this.queue.push(text);
            this.run();
        },
        run() {
            if (this.speaking || this.queue.length === 0) return;
            this.speaking = true;
            const u = new SpeechSynthesisUtterance(this.queue.shift());
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
    // 🌌 FLOATING WORDS SYSTEM (FULL FUSION FINAL)
    // =========================
    const FloatingWords = {
        // 🧠 PSYCHOLOGY CORE
        psychology: {
            CRITERIO: "Decision power: You become a leader.",
            ESTRATEGIA: "Social strategy builds allies.",
            SABIDURIA: "Financial wisdom creates freedom.",
            VALENTIA: "Courage builds respect.",
            LEALTAD: "Loyalty gives strength.",
            CALMA: "Breathing controls the mind.",
            APROBACION: "Approval destroys identity.",
            IMPULSO: "Impulse weakens control.",
            VICTIMA: "Blame removes power.",
            GASTO: "Impulse spending traps you.",
            DESENFOQUE: "Distraction kills purpose.",
            EGO: "Fear of opinion limits you.",
            OPORTUNIDAD: "Opportunities move fast.",
            TIEMPO: "Time is your greatest asset.",
            TELEFONO: "Phone can control you.",
            PANTALLA: "Screens can trap your mind.",
            DISTRACCION: "Noise removes focus."
        },
        // 🌍 GLOBAL WORD POOL (FUSION REAL)
        wordPool: {
            good: ["DISCERNMENT", "STRATEGY", "WISDOM", "COURAGE", "LOYALTY", "CALM", "LOVE"],
            bad: ["APPROVAL", "IMPULSE", "VICTIM", "SPENDING", "FEAR", "DISTRACTION", "EGO"],
            neutral: ["STREET", "CITY", "SCHOOL", "CLOCK", "WAIT", "NOISE"]
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
            // 🧨 TRAP LAYER
            if (r > 0.9) {
                config = {
                    class: 'word-good',
                    val: -20,
                    words: ["TELEFONO", "PANTALLA", "DISTRACCION"],
                    speed: "2s",
                    isTrap: true
                };
            }
            // 🟢 HIGH CONTROL LAYER
            else if (r > 0.6) {
                config = {
                    class: 'word-good',
                    val: 20,
                    words: ["CRITERIO", "ESTRATEGIA", "TIEMPO", "OPORTUNIDAD"],
                    speed: "2.5s"
                };
            }
            // 🔴 FULL MIX CONFUSION LAYER
            else {
                const mix = [
                    ...this.wordPool.good,
                    ...this.wordPool.bad,
                    ...this.wordPool.neutral,
                    "CRITERIO",
                    "ESTRATEGIA",
                    "IMPULSO",
                    "EGO"
                ];
                config = {
                    class: Math.random() > 0.5 ? 'word-good' : 'word-bad',
                    val: Math.random() > 0.5 ? 20 : -10,
                    words: mix,
                    speed: "5s"
                };
            }
            const word = config.words[Math.floor(Math.random() * config.words.length)];
            const el = document.createElement("div");
            // 🎭 CONFUSIÓN VISUAL TOTAL (NO RELACIÓN CON VALOR)
            const fakeColor = Math.random() > 0.5 ? "word-good" : "word-bad";
            el.className = `floating ${fakeColor}`;
            el.innerText = word;
            el.style.left = Math.random() * 90 + "vw";
            el.style.animationDuration = config.speed;
            el.onmousedown = () => {
                el.classList.add("blast");
                state.score += config.val;
                if (config.val > 0) {
                    AudioSystem.playEffect("win");
                    Speech.say(this.psychology[word] || "Good focus.");
                } else {
                    AudioSystem.playEffect("bad");
                    const warn = config.isTrap ? "Trap detected. " : "";
                    Speech.say(warn + (this.psychology[word] || "Wrong choice."));
                }
                UI.updateScore();
                setTimeout(()=>el.remove(),300);
            };
            document.body.appendChild(el);
            setTimeout(() => {
                if (el) el.remove();
            }, parseFloat(config.speed) * 1000);
        }
    };
    // =========================
    // 🎯 DECISION SYSTEM
    // =========================
    const Decision = {
        async handle(option) {
            Lock.on();
            const box = document.getElementById("explanation-box");
            if (box) box.style.display = "block";
            const explanation = option.explanation[state.lang];
            if (box) box.innerText = explanation;
            if (option.correct) {
                document.body.style.background = "#003300";
                state.score += 20;
                AudioSystem.playEffect("win");
                Speech.say("Correct decision.");
            } else {
                document.body.style.background = "#330000";
                state.score -= 10;
                AudioSystem.playEffect("bad");
                Speech.say("Wrong decision.");
            }
            UI.updateScore();
            setTimeout(async () => {
                document.body.style.background = "";
                if (box) box.style.display = "none";
                await SilenceReto.start();
            }, 5000);
        }
    };
    // =========================
    // 🤫 SILENCE SYSTEM
    // =========================
    const SilenceReto = {
        getTime() {
            return Math.min(30 + state.missionId * 5, 60);
        },
        async start() {
            state.silenceActive = true;
            UI.clearOptions();
            const breath = document.getElementById("breath");
            const story = document.getElementById("story");
            const analysis = document.getElementById("analysis");
            if (breath) breath.style.display = "block";
            let time = this.getTime();
            story.innerText = `TECHNIQUE: BREATH + SILENCE (${time}s)`;
            analysis.innerText = "Control breathing. Stay still.";
            Speech.say("Start breathing control.");
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
                if (!state.silenceActive || cycles <= 0) {
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
            state.silenceActive = false;
            const breath = document.getElementById("breath");
            if (breath) breath.style.display = "none";
            Speech.say("Silence complete.");
            setTimeout(() => {
                Wellness.risotherapy();
            }, 1000);
        }
    };
    // =========================
    // 🌿 WELLNESS SYSTEM
    // =========================
    const Wellness = {
        risotherapy() {
            const story = document.getElementById("story");
            const analysis = document.getElementById("analysis");
            let t = 10;
            story.innerText = "TECHNIQUE: LAUGHTER THERAPY (10s)";
            analysis.innerText = "Smile and laugh.";
            Speech.say("Smile and laugh.");
            const timer = setInterval(() => {
                t--;
                story.innerText = `LAUGHTER: ${t}s`;
                AudioSystem.ok?.play();
                if (t <= 0) {
                    clearInterval(timer);
                    this.pause();
                }
            }, 1000);
        },
        pause() {
            Lock.on();
            let t = 15;
            const story = document.getElementById("story");
            const analysis = document.getElementById("analysis");
            story.innerText = "TECHNIQUE: NEURAL RESET";
            analysis.innerText = "Do nothing. Reset brain.";
            Speech.say("Pause. Do nothing.");
            const timer = setInterval(() => {
                t--;
                story.innerText = `PAUSE: ${t}s`;
                if (t <= 0) {
                    clearInterval(timer);
                    Lock.off();
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
            Lock.on();
            try {
                const res = await fetch(`/api/mission/${state.missionId}`);
                const data = await res.json();
                state.mission = data;
                this.render(data);
            } catch {
                console.error("Mission error");
            }
            Lock.off();
        },
        render(m) {
            const story = m.blocks.find(b=>b.type==="story").text[state.lang];
            const analysis = m.blocks.find(b=>b.type==="analysis").text[state.lang];
            const decision = m.blocks.find(b=>b.type==="decision");
            UI.setText("story", story);
            UI.setText("analysis", "");
            UI.clearOptions();
            Speech.say(story);
            setTimeout(()=>{
                UI.setText("analysis", analysis);
                Speech.say(analysis);
            },4000);
            setTimeout(()=>{
                UI.renderOptions(decision.options);
            },8000);
        }
    };
    // =========================
    // UI
    // =========================
    const UI = {
        setText(id,val){
            const el=document.getElementById(id);
            if(el) el.innerText=val;
        },
        updateScore(){
            this.setText("score-display",`POINTS: ${state.score}`);
        },
        clearOptions(){
            const el=document.getElementById("options");
            if(el) el.innerHTML="";
        },
        renderOptions(options){
            const c=document.getElementById("options");
            if (!c) return;
            c.innerHTML="";
            options.forEach(opt=>{
                const b=document.createElement("button");
                b.className="opt-btn";
                b.innerText=opt.text[state.lang];
                b.onclick=()=>Decision.handle(opt);
                c.appendChild(b);
            });
        }
    };
    // =========================
    // INIT
    // =========================
    return {
        init() {
            state.player.name = prompt("Your name:") || "Player";
            state.player.hero = prompt("Hero name:") || "Kamizen";
            const hero = document.getElementById("hero-name");
            if (hero) hero.innerText = state.player.hero;
            AudioSystem.init();
            FloatingWords.start();
            Mission.loadNext();
            console.log("ENGINE READY");
        }
    };
})();
window.onload = () => KamizenEngine.init();
