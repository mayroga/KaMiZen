/**
 * 🧠 AURA ENGINE CORE — VINCULADO A MAIN.PY
 */

const AuraEngine = (() => {
    const state = {
        score: 0,
        lang: "en", // Inicia en Inglés como pediste
        level: 1,
        paused: false,
        missionActive: false,
        silenceActive: false
    };

    const AudioSystem = {
        play(id) {
            const el = document.getElementById(id);
            if (el) { el.currentTime = 0; el.play().catch(() => {}); }
        },
        startBG() {
            const bg = document.getElementById("bg");
            if (bg) { bg.volume = 0.3; bg.play().catch(() => {}); }
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

    const UI = {
        updateScore() {
            document.getElementById("score-display").innerText = `SCORE: ${state.score.toString().padStart(4, '0')}`;
        },
        showSignal(type) {
            const s = document.getElementById("feedback-signal");
            s.className = type === "green" ? "sig-green" : "sig-red";
            setTimeout(() => s.className = "", 3000);
        }
    };

    // --- LÓGICA DE MISIONES (CONECTA CON MAIN.PY) ---
    const MissionSystem = {
        async loadNext() {
            try {
                // Llamada a tu main.py: @app.route("/api/mission/next")
                const res = await fetch("/api/mission/next");
                const data = await res.json();
                if (data.error) throw data.error;

                this.render(data);
            } catch (e) {
                console.error("Error cargando misión:", e);
                document.getElementById("story").innerText = "Fin de las misiones o error de conexión.";
            }
        },

        render(m) {
            const storyText = m.blocks.find(b => b.type === "story").text[state.lang];
            const analysisText = m.blocks.find(b => b.type === "analysis").text[state.lang];
            const decision = m.blocks.find(b => b.type === "decision");

            document.getElementById("story").innerText = storyText;
            document.getElementById("analysis").innerText = "";
            document.getElementById("options").innerHTML = "";
            document.getElementById("explanation-box").style.display = "none";

            Speech.say(storyText);

            setTimeout(() => {
                document.getElementById("analysis").innerText = analysisText;
                Speech.say(analysisText);
            }, 4000);

            setTimeout(() => {
                this.showOptions(decision.options);
            }, 8000);
        },

        showOptions(opts) {
            const container = document.getElementById("options");
            opts.forEach(o => {
                const b = document.createElement("button");
                b.innerText = o.text[state.lang];
                b.onclick = () => this.handleChoice(o);
                container.appendChild(b);
            });
        },

        async handleChoice(opt) {
            document.getElementById("options").innerHTML = "";
            const box = document.getElementById("explanation-box");
            box.innerText = opt.explanation[state.lang];
            box.style.display = "block";

            if (opt.correct) {
                state.score += 100;
                UI.showSignal("green");
                AudioSystem.play("ok");
            } else {
                state.score -= 50;
                UI.showSignal("red");
                AudioSystem.play("bad");
            }
            UI.updateScore();
            Speech.say(box.innerText);

            setTimeout(() => {
                box.style.display = "none";
                this.checkSilence();
            }, 7000);
        },

        async checkSilence() {
            // Lógica de silencio conectada a tu API de Main.py
            // @app.route("/api/silence/<int:level>")
            const res = await fetch(`/api/silence/${state.level}`);
            const data = await res.json();
            
            this.startSilence(data.silence_time);
        },

        startSilence(seconds) {
            state.silenceActive = true;
            const b = document.getElementById("breath");
            const s = document.getElementById("story");
            b.style.display = "flex";
            s.innerText = `RETO DE SILENCIO: ${seconds / 60} MIN`;

            let timeLeft = seconds;
            let inhale = true;

            const timer = setInterval(() => {
                if (state.paused) return;
                timeLeft--;
                
                // Animación de respiración
                if (timeLeft % 5 === 0) {
                    inhale = !inhale;
                    b.innerText = inhale ? (state.lang === "en" ? "INHALE" : "INHALE") : (state.lang === "en" ? "EXHALE" : "EXHALE");
                    b.style.transform = inhale ? "scale(1.2)" : "scale(1)";
                }

                if (timeLeft <= 0) {
                    clearInterval(timer);
                    this.completeSilence();
                }
            }, 1000);
        },

        completeSilence() {
            state.silenceActive = false;
            document.getElementById("breath").style.display = "none";
            state.level++;
            this.loadNext();
        }
    };

    // --- SISTEMA DE PALABRAS FLOTANTES ---
    const FloatingSystem = {
        start() {
            setInterval(() => {
                if (state.paused || state.silenceActive) return;
                this.spawn();
            }, 3000);
        },
        spawn() {
            const isGood = Math.random() > 0.5;
            const word = document.createElement("div");
            word.className = `floating ${isGood ? "word-good" : "word-bad"}`;
            word.innerText = isGood ? "FOCUS" : "FEAR";
            word.style.left = Math.random() * 80 + "vw";
            
            word.onclick = () => {
                state.score += isGood ? 10 : -20;
                UI.updateScore();
                AudioSystem.play(isGood ? "ok" : "bad");
                word.remove();
            };
            document.getElementById("floating-layer").appendChild(word);
            setTimeout(() => word.remove(), 5000);
        }
    };

    return {
        init() {
            document.getElementById("start-overlay").style.display = "none";
            AudioSystem.startBG();
            FloatingSystem.start();
            MissionSystem.loadNext();
        },
        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
            // Recargar misión actual con nuevo idioma si es necesario
        },
        gamePause() {
            state.paused = true;
            document.getElementById("btn-pause").style.display = "none";
            document.getElementById("btn-resume").style.display = "inline-block";
        },
        gameResume() {
            state.paused = false;
            document.getElementById("btn-pause").style.display = "inline-block";
            document.getElementById("btn-resume").style.display = "none";
        }
    };
})();
