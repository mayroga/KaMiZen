/**
 * 🧠 AURA ENGINE CORE — AL CIELO EDITION
 * Director de Orquesta: Música, Disparos, TVID y Neuro-Silence Progresivo
 * AURA BY MAY ROGA LLC
 */

const AuraEngine = (() => {

    // ==========================================
    // 📊 ESTADO GLOBAL
    // ==========================================
    const state = {
        score: 0,
        level: 1,
        lang: "en", // Default Inglés
        mission: null,
        locked: false,
        silenceActive: false,
        paused: false,
        playerName: "",
        heroName: "",
        silenceTime: 180, 
        sounds: {
            win: document.getElementById("ok"),
            fail: document.getElementById("bad"),
            ambient: document.getElementById("bg")
        }
    };

    const Lock = {
        on() { state.locked = true; },
        off() { state.locked = false; },
        is() { return state.locked; }
    };

    // ==========================================
    // 🗣️ MOTOR DE VOZ
    // ==========================================
    const Speech = {
        say(text) {
            if (!text) return;
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.9;
            window.speechSynthesis.speak(u);
        }
    };

    // ==========================================
    // 📂 MOTOR DE MISIONES
    // ==========================================
    const Mission = {
        async loadNext() {
            try {
                // Ajustado para llamar a tu API actual de misiones
                const res = await fetch(`/api/mission/${state.level}`);
                if (!res.ok) {
                    state.level = 1;
                    this.loadNext();
                    return;
                }
                const data = await res.json();
                state.mission = data;
                this.render(data);
            } catch (e) {
                console.error("Error cargando misión. Usando respaldo...");
                UI.setText("story-box", "Error connecting to Mission Control.");
            }
        },
        render(m) {
            const story = m.blocks.find(b => b.type === "story").text[state.lang];
            const analysis = m.blocks.find(b => b.type === "analysis") ? m.blocks.find(b => b.type === "analysis").text[state.lang] : "";
            const decision = m.blocks.find(b => b.type === "decision");

            UI.setText("story-box", story);
            UI.setText("mission-theme", `${state.heroName} | Level ${state.level}`);
            UI.clearOptions();
            Speech.say(story);

            // Mostrar análisis después de 3 segundos
            setTimeout(() => {
                if (analysis) {
                    UI.setText("story-box", analysis);
                    Speech.say(analysis);
                }
            }, 4000);

            // Mostrar botones después de 7 segundos
            setTimeout(() => {
                UI.renderOptions(decision.options);
                Lock.off();
            }, 7500);
        }
    };

    // ==========================================
    // 🎮 DECISIONES Y FEEDBACK
    // ==========================================
    const Decision = {
        handle(option) {
            if (Lock.is()) return;
            Lock.on();

            const isCorrect = option.correct;
            const explanation = option.explanation ? option.explanation[state.lang] : "";
            const signal = document.getElementById('feedback-signal');

            if (isCorrect) {
                state.sounds.win.play();
                signal.className = "semaphore-green";
                state.score += 100;
            } else {
                state.sounds.fail.play();
                signal.className = "semaphore-red";
                state.score -= 50;
            }

            UI.updateScore();
            UI.showExplanation(explanation || (isCorrect ? "Correct!" : "Try again"));
            Speech.say(explanation);

            setTimeout(() => {
                signal.className = "semaphore-off";
                UI.hideExplanation();
                state.level++;
                
                // Reto de silencio cada 2 niveles o según lógica
                if (state.level % 2 === 0) {
                    SilenceReto.start();
                } else {
                    Mission.loadNext();
                }
            }, 6000);
        }
    };

    // ==========================================
    // 🧘 RETO DE SILENCIO
    // ==========================================
    const SilenceReto = {
        start() {
            state.silenceActive = true;
            UI.toggleBreathing(true);
            UI.clearOptions();

            let timeLeft = 20 + (state.level * 5); // Tiempo progresivo
            UI.updateTimer(timeLeft);

            Speech.say(state.lang === "en" ? "Silence Challenge. Focus on your breath." : "Reto de silencio. Enfócate en tu respiración.");

            const timer = setInterval(() => {
                if (state.paused) return;
                timeLeft--;
                UI.updateTimer(timeLeft);
                UI.animateBreathing(timeLeft);

                if (timeLeft <= 0 || !state.silenceActive) {
                    clearInterval(timer);
                    this.complete();
                }
            }, 1000);
        },
        complete() {
            state.silenceActive = false;
            UI.toggleBreathing(false);
            Speech.say(state.lang === "en" ? "Excellent focus." : "Excelente enfoque.");
            Mission.loadNext();
        }
    };

    // ==========================================
    // 🎯 DISPAROS A PALABRAS
    // ==========================================
    const FloatingWords = {
        start() {
            setInterval(() => {
                if (state.silenceActive || state.paused) return;
                this.spawn();
            }, 3000);
        },
        spawn() {
            const pool = {
                good: ["FOCUS", "POWER", "TRUTH", "CALM"],
                bad: ["FEAR", "LIE", "ANGER", "LAZY"]
            };
            const isGood = Math.random() > 0.4;
            const word = isGood ? pool.good[Math.floor(Math.random()*pool.good.length)] : pool.bad[Math.floor(Math.random()*pool.bad.length)];
            
            const el = document.createElement("div");
            el.className = `floating ${isGood ? 'word-good' : 'word-bad'}`;
            el.innerText = word;
            el.style.left = Math.random() * 80 + "vw";
            
            el.onmousedown = () => {
                el.classList.add("blast");
                state.score += isGood ? 10 : -20;
                if(isGood) state.sounds.win.play(); else state.sounds.fail.play();
                UI.updateScore();
                setTimeout(() => el.remove(), 300);
            };

            document.getElementById("floating-words-layer").appendChild(el);
            setTimeout(() => { if(el) el.remove(); }, 5000);
        }
    };

    // ==========================================
    // 🖥️ INTERFAZ DE USUARIO
    // ==========================================
    const UI = {
        setText(id, val) { const e = document.getElementById(id); if(e) e.innerText = val; },
        updateScore() { 
            this.setText("points-display", `SCORE: ${state.score.toString().padStart(4, '0')}`); 
        },
        updateTimer(s) {
            const m = Math.floor(s / 60);
            const sec = s % 60;
            this.setText("timer-text", `${m}:${sec.toString().padStart(2, '0')}`);
        },
        renderOptions(options) {
            const grid = document.getElementById("options-grid");
            grid.innerHTML = "";
            options.forEach(opt => {
                const b = document.createElement("button");
                b.innerText = opt.text[state.lang];
                b.onclick = () => Decision.handle(opt);
                grid.appendChild(b);
            });
        },
        toggleBreathing(show) {
            document.getElementById("breathing-system").style.display = show ? "block" : "none";
            document.getElementById("options-grid").style.display = show ? "none" : "grid";
            document.getElementById("timer-container").style.display = show ? "block" : "none";
        },
        animateBreathing(s) {
            const circle = document.getElementById("breathing-circle");
            const txt = document.getElementById("breath-text");
            if (s % 8 > 4) {
                txt.innerText = state.lang === "en" ? "EXHALE" : "EXHALA";
                circle.style.transform = "scale(0.8)";
            } else {
                txt.innerText = state.lang === "en" ? "INHALE" : "INHALA";
                circle.style.transform = "scale(1.3)";
            }
        },
        showExplanation(txt) {
            const b = document.getElementById("explanation-box");
            b.innerText = txt;
            b.style.display = "block";
        },
        hideExplanation() { document.getElementById("explanation-box").style.display = "none"; },
        clearOptions() { document.getElementById("options-grid").innerHTML = ""; }
    };

    return {
        async init() {
            // Solicitar datos iniciales
            state.playerName = prompt("Your Name / Tu Nombre:") || "Player";
            state.heroName = prompt("Hero Name / Nombre de Héroe:") || "Warrior";
            
            UI.setText("mission-theme", `${state.heroName} | Ready`);
            
            // Audio Inicial
            state.sounds.ambient.volume = 0.3;
            state.sounds.ambient.play().catch(() => console.log("Audio needs interaction"));

            FloatingWords.start();
            Mission.loadNext();
        },
        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
            document.getElementById("lang-toggle").innerText = state.lang === "en" ? "ESPAÑOL" : "ENGLISH";
            if (state.mission) Mission.render(state.mission);
        },
        gamePause() {
            state.paused = true;
            Lock.on();
            document.getElementById("btn-pause").style.display = "none";
            document.getElementById("btn-resume").style.display = "inline-block";
        },
        gameResume() {
            state.paused = false;
            Lock.off();
            document.getElementById("btn-pause").style.display = "inline-block";
            document.getElementById("btn-resume").style.display = "none";
        }
    };
})();

window.onload = () => AuraEngine.init();
