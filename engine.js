/**
 * 🧠 AURA ENGINE CORE - VINCULADO A MAIN.PY
 * Sin cortes. Inglés por defecto.
 */

const AuraEngine = (() => {
    const state = {
        score: 0,
        lang: "en", 
        missionId: 0,
        mission: null,
        locked: false,
        paused: false,
        silenceActive: false
    };

    const AudioSys = {
        play(id) {
            const el = document.getElementById(id);
            if (el) { el.currentTime = 0; el.play().catch(() => {}); }
        },
        startAmbient() {
            const bg = document.getElementById("bg");
            if (bg) { bg.volume = 0.3; bg.play().catch(() => {}); }
        }
    };

    const Speech = {
        say(text) {
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = state.lang === "en" ? "en-US" : "es-ES";
            msg.rate = 0.9;
            window.speechSynthesis.speak(msg);
        }
    };

    const MissionSystem = {
        async loadNext() {
            if (state.locked) return;
            state.locked = true;

            try {
                // Endpoint exacto de tu Main.py
                const response = await fetch("/api/mission/next");
                const data = await response.json();

                if (data.error) {
                    UI.setText("story-box", "End of Journey.");
                    return;
                }

                state.mission = data;
                state.missionId = data.id;
                this.render(data);
            } catch (e) {
                UI.setText("story-box", "Connection Error. Check Main.py");
            } finally {
                state.locked = false;
            }
        },

        render(m) {
            UI.clear();
            const story = m.blocks.find(b => b.type === "story").text[state.lang];
            const analysis = m.blocks.find(b => b.type === "analysis").text[state.lang];
            const decision = m.blocks.find(b => b.type === "decision");

            UI.setText("story-box", story);
            Speech.say(story);

            setTimeout(() => {
                UI.setText("analysis-box", analysis);
                Speech.say(analysis);
            }, 4000);

            setTimeout(() => {
                UI.renderOptions(decision.options);
            }, 8000);
        }
    };

    const UI = {
        setText(id, txt) { document.getElementById(id).innerText = txt; },
        clear() {
            this.setText("analysis-box", "");
            document.getElementById("options-grid").innerHTML = "";
            document.getElementById("explanation-box").style.display = "none";
            document.getElementById("breathing-system").style.display = "none";
        },
        updateScore() {
            const label = state.lang === "en" ? "SCORE: " : "PUNTOS: ";
            document.getElementById("points-display").innerText = label + state.score;
        },
        renderOptions(opts) {
            const grid = document.getElementById("options-grid");
            grid.innerHTML = "";
            opts.forEach(o => {
                const btn = document.createElement("button");
                btn.innerText = o.text[state.lang];
                btn.onclick = () => Decision.handle(o);
                grid.appendChild(btn);
            });
        },
        showExplanation(txt) {
            const box = document.getElementById("explanation-box");
            box.innerText = txt;
            box.style.display = "block";
        }
    };

    const Decision = {
        async handle(opt) {
            if (state.locked) return;
            state.locked = true;

            const signal = document.getElementById("feedback-signal");
            const isCorrect = opt.correct;
            const explanation = opt.explanation[state.lang];

            UI.showExplanation(explanation);
            Speech.say(explanation);

            if (isCorrect) {
                state.score += 100;
                signal.className = "semaphore-green";
                AudioSys.play("ok");
            } else {
                state.score -= 50;
                signal.className = "semaphore-red";
                AudioSys.play("bad");
            }
            UI.updateScore();

            setTimeout(async () => {
                signal.className = "";
                // Vincula con lógica de silencio de Main.py (ejemplo nivel cada 3 misiones)
                if (state.missionId % 3 === 0) {
                    await SilenceReto.init();
                } else {
                    state.locked = false;
                    MissionSystem.loadNext();
                }
            }, 7000);
        }
    };

    const SilenceReto = {
        async init() {
            UI.clear();
            // Llama a Main.py para obtener el tiempo de silencio basado en el ID de misión
            const res = await fetch(`/api/silence/${state.missionId}`);
            const data = await res.json();
            const time = data.silence_time;

            state.silenceActive = true;
            document.getElementById("breathing-system").style.display = "flex";
            document.getElementById("timer-container").style.display = "block";
            UI.setText("story-box", `NEURO-SILENCE: ${time/60} MIN`);

            let remaining = time;
            const clock = setInterval(() => {
                if (state.paused) return;
                remaining--;
                
                // Actualizar timer circular
                const min = Math.floor(remaining / 60);
                const sec = remaining % 60;
                document.getElementById("timer-text").innerText = `${min}:${sec < 10 ? '0'+sec : sec}`;

                // Animación respiración (ciclos de 8s)
                const circle = document.getElementById("breathing-circle");
                const bText = document.getElementById("breath-text");
                if (remaining % 8 > 4) {
                    circle.style.transform = "scale(1.3)";
                    bText.innerText = state.lang === "en" ? "INHALE" : "INHALE";
                } else {
                    circle.style.transform = "scale(0.8)";
                    bText.innerText = state.lang === "en" ? "EXHALE" : "EXHALE";
                }

                if (remaining <= 0) {
                    clearInterval(clock);
                    state.silenceActive = false;
                    document.getElementById("timer-container").style.display = "none";
                    state.locked = false;
                    MissionSystem.loadNext();
                }
            }, 1000);
        }
    };

    const DistractionSys = {
        spawn() {
            if (state.paused || state.locked) return;
            const layer = document.getElementById("floating-words-layer");
            const isGood = Math.random() > 0.5;
            const words = isGood ? ["FOCUS", "POWER", "TRUTH"] : ["LIE", "FEAR", "LAZY"];
            
            const el = document.createElement("div");
            el.className = `floating ${isGood ? 'word-good' : 'word-bad'}`;
            el.innerText = words[Math.floor(Math.random()*words.length)];
            el.style.left = Math.random() * 80 + "vw";

            el.onclick = () => {
                el.classList.add("blast");
                state.score += isGood ? 10 : -20;
                UI.updateScore();
                AudioSys.play(isGood ? "ok" : "bad");
                setTimeout(() => el.remove(), 400);
            };
            layer.appendChild(el);
            setTimeout(() => { if(el) el.remove(); }, 6000);
        }
    };

    return {
        init() {
            const userName = prompt("Name:") || "User";
            const heroName = prompt("Hero Name:") || "Aura Warrior";
            UI.setText("hero-name", heroName);
            
            AudioSys.startAmbient();
            setInterval(() => DistractionSys.spawn(), 3000);
            MissionSystem.loadNext();
        },
        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
            UI.updateScore();
            if (state.mission) MissionSystem.render(state.mission);
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

window.onload = () => AuraEngine.init();
