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
    const Lock = {
        on() { state.locked = true; document.body.style.pointerEvents = "none"; },
        off() { state.locked = false; document.body.style.pointerEvents = "auto"; },
        is() { return state.locked; }
    };
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
                this.bg.playbackRate = 1.1;
                this.bg.volume = 0.3;
                this.bg.play().catch(() => {});
            }
        },
        playEffect(type) {
            if (type === 'win' && this.ok) this.ok.play();
            if (type === 'bad' && this.bad) this.bad.play();
        }
    };
    // ✅ VOZ SIN CORTES (cola)
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
    // ✅ PALABRAS CON PSICOLOGÍA
    const FloatingWords = {
        psychology: {
            POWER: "Choosing power reinforces self-control circuits.",
            FOCUS: "Focus strengthens prefrontal cortex decision making.",
            TRUTH: "Truth builds cognitive clarity and reduces stress.",
            RESPECT: "Respect reinforces social intelligence pathways.",
            LIE: "Lies increase cognitive load and stress hormones.",
            FEAR: "Fear activates survival mode, reducing reasoning.",
            LAZY: "Laziness weakens motivation circuits over time.",
            ANGER: "Anger hijacks the amygdala, blocking logic."
        },
        start() {
            setInterval(() => {
                if (state.silenceActive || Lock.is()) return;
                this.spawn();
            }, 2000);
        },
        spawn() {
            const types = [
                { class: 'word-good', val: 10, words: ["POWER", "FOCUS", "TRUTH", "RESPECT"] },
                { class: 'word-bad', val: -10, words: ["LIE", "FEAR", "LAZY", "ANGER"] },
                { class: 'word-neutral', val: 0, words: ["STREET", "RUN", "CITY", "WALK"] }
            ];
            const config = types[Math.floor(Math.random() * types.length)];
            const word = config.words[Math.floor(Math.random() * config.words.length)];
            const el = document.createElement("div");
            el.className = `floating ${config.class}`;
            el.innerText = word;
            el.style.left = Math.random() * 90 + "vw";
            el.onmousedown = () => {
                el.classList.add("blast");
                state.score += config.val;
                AudioSystem.playEffect(config.val >= 0 ? 'win' : 'bad');
                UI.updateScore();
                // 🔥 explicación psicológica
                const explain = this.psychology[word] || "";
                if (explain) Speech.say(explain);
                setTimeout(() => el.remove(), 300);
            };
            document.body.appendChild(el);
            setTimeout(() => { if (el) el.remove(); }, 5000);
        }
    };
    const Decision = {
        async handle(option) {
            Lock.on();
            const box = document.getElementById("explanation-box");
            box.style.display = "block";
            const explanation = option.explanation[state.lang];
            box.innerText = explanation;
            const good = ["Excellent!", "Wise choice!", "Powerful!", "High level!"];
            const bad = ["Careful!", "Wrong move!", "Think again!", "Adjust!"];
            if (option.correct) {
                document.body.style.backgroundColor = "#004400";
                AudioSystem.playEffect("win");
                Speech.say(good[Math.floor(Math.random() * good.length)]);
                Speech.say(explanation);
            } else {
                document.body.style.backgroundColor = "#440000";
                AudioSystem.playEffect("bad");
                Speech.say(bad[Math.floor(Math.random() * bad.length)]);
                Speech.say(explanation);
            }
            setTimeout(async () => {
                document.body.style.backgroundColor = "";
                box.style.display = "none";
                await SilenceReto.start();
            }, 6000);
        }
    };
    // ✅ SILENCIO REAL + RESPIRACIÓN + CIENCIA
    const SilenceReto = {
        getTimeByMission() {
            if (state.missionId <= 7) return 20;
            return Math.min(20 + (state.missionId * 10), 1200);
        },
        async start() {
            state.silenceActive = true;
            UI.clearOptions();
            const breath = document.getElementById("breath");
            const story = document.getElementById("story");
            const analysis = document.getElementById("analysis");
            breath.style.display = "block";
            analysis.innerText = "";
            const time = this.getTimeByMission();
            state.silenceTime = time;
            story.innerText = `SILENCE: ${time}s`;
            // 🧠 explicación científica
            Speech.say("Now focus on your breathing.");
            Speech.say("Slow breathing activates the parasympathetic nervous system.");
            Speech.say("This reduces cortisol and improves decision making.");
            Speech.say("Inhale slowly...");
            this.breathGuide();
            let t = time;
            const timer = setInterval(() => {
                t--;
                if (t <= 0) {
                    clearInterval(timer);
                    this.complete();
                }
            }, 1000);
        },
        breathGuide() {
            const b = document.getElementById("breath");
            let grow = true;
            const interval = setInterval(() => {
                if (!state.silenceActive) {
                    clearInterval(interval);
                    return;
                }
                b.style.transform = grow ? "scale(2.5)" : "scale(1)";
                Speech.say(grow ? "Inhale..." : "Exhale...");
                grow = !grow;
            }, 4000);
        },
        complete() {
            state.silenceActive = false;
            document.getElementById("breath").style.display = "none";
            Speech.say("Challenge completed. Brain optimized.");
            state.missionId++;
            Mission.loadNext();
        }
    };
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
    return {
        init() {
            AudioSystem.init();
            FloatingWords.start();
            Mission.loadNext();
            console.log("ENGINE READY");
        },
        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
            UI.updateScore();
            if (state.mission) Mission.render(state.mission);
        }
    };
})();
window.onload = () => KamizenEngine.init();
