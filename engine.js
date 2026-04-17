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
        silenceTime: 180,
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
    const Speech = {
        say(text) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.9;
            window.speechSynthesis.speak(u);
        }
    };
    const FloatingWords = {
        start() {
            setInterval(() => {
                if (state.silenceActive || Lock.is()) return;
                this.spawn();
            }, 2000);
        },
        spawn() {
            const types = [
                { class: 'word-good', val: 10, words: ["HONESTY", "POWER", "TRUTH", "RESPECT"] },
                { class: 'word-bad', val: -10, words: ["LIE", "FEAR", "LAZY", "ANGER"] },
                { class: 'word-neutral', val: 0, words: ["STREET", "RUN", "CITY", "WALK"] }
            ];
            const config = types[Math.floor(Math.random() * types.length)];
            const el = document.createElement("div");
            el.className = `floating ${config.class}`;
            el.innerText = config.words[Math.floor(Math.random() * config.words.length)];
            el.style.left = Math.random() * 90 + "vw";
            el.onmousedown = () => {
                el.classList.add("blast");
                state.score += config.val;
                AudioSystem.playEffect(config.val >= 0 ? 'win' : 'bad');
                UI.updateScore();
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
            const goodEN = ["Excellent!", "Wise choice!", "Sonic level!", "Powerful!"];
            const badEN = ["Careful!", "Pay attention!", "Wrong move!", "Think again!"];
            const goodES = ["¡Excelente!", "¡Sabio!", "¡Nivel Sonic!", "¡Poderoso!"];
            const badES = ["¡Cuidado!", "¡Atención!", "¡Error!", "¡Piénsalo!"];
            const good = state.lang === "en" ? goodEN : goodES;
            const bad = state.lang === "en" ? badEN : badES;
            if (option.correct) {
                document.body.style.backgroundColor = "#004400";
                AudioSystem.playEffect("win");
                Speech.say(good[Math.floor(Math.random() * good.length)] + " " + explanation);
            } else {
                document.body.style.backgroundColor = "#440000";
                AudioSystem.playEffect("bad");
                Speech.say(bad[Math.floor(Math.random() * bad.length)] + " " + explanation);
            }
            setTimeout(async () => {
                document.body.style.backgroundColor = "";
                box.style.display = "none";
                await SilenceReto.start();
            }, 6000);
        }
    };
    const SilenceReto = {
        explanationsEN: [
            "Silence is where your brain stores what you learn.",
            "Now we calm your heart so your mind gets faster.",
            "Breathing is the hidden training of leaders.",
            "Master your silence, master your life."
        ],
        explanationsES: [
            "El silencio es donde tu cerebro guarda lo aprendido.",
            "Ahora calmamos el corazón para acelerar tu mente.",
            "Respirar es el entrenamiento secreto de líderes.",
            "Domina tu silencio, domina tu vida."
        ],
        async start() {
            state.silenceActive = true;
            UI.clearOptions();
            const list = state.lang === "en" ? this.explanationsEN : this.explanationsES;
            const msg = list[Math.floor(Math.random() * list.length)];
            Speech.say(msg);
            UI.showBreath(true);
            UI.setText(
                "story",
                state.lang === "en"
                    ? `SILENCE MODE: ${Math.floor(state.silenceTime / 60)} MIN`
                    : `SILENCIO: ${Math.floor(state.silenceTime / 60)} MIN`
            );
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
            state.silenceTime = Math.min(state.silenceTime + 60, 1200);
            UI.showBreath(false);
            Speech.say(
                state.lang === "en"
                    ? "Challenge completed. Level up."
                    : "Reto completado. Subiendo nivel."
            );

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
            this.setText(
                "score-display",
                state.lang === "en"
                    ? `POINTS: ${state.score}`
                    : `PUNTOS: ${state.score}`
            );
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
