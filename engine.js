/**
 * 🧠 AURA ENGINE CORE — AL CIELO EDITION
 * Director de Orquesta: Música, Disparos, TVID y Neuro-Silence Progresivo
 * AURA BY MAY ROGA LLC
 */

const AuraEngine = (() => {

    // ==========================================
    // 📊 ESTADO GLOBAL (Single Source of Truth)
    // ==========================================
    const state = {
        score: 0,
        level: 1,
        energy: 100,
        lang: "en", // Default: English
        mission: null,
        locked: false,
        silenceActive: false,
        paused: false,
        // Configuración de tiempos según nivel
        silenceDuration: 20, 
        sounds: {
            win: new Audio('/assets/sounds/lottery_win.mp3'),
            fail: new Audio('/assets/sounds/glass_break.mp3'),
            ambient: new Audio('/assets/sounds/matrix_ambient.mp3')
        }
    };

    // ==========================================
    // 🔒 SISTEMA DE CONTROL DE FLUJO (LOCK)
    // ==========================================
    const Lock = {
        on() { state.locked = true; document.body.style.pointerEvents = "none"; },
        off() { state.locked = false; document.body.style.pointerEvents = "auto"; },
        is() { return state.locked; }
    };

    // ==========================================
    // 🔊 AUDIO & DOPAMINA (AURA EDITION)
    // ==========================================
    const AudioSystem = {
        init() {
            state.sounds.ambient.loop = true;
            state.sounds.ambient.volume = 0.3;
            this.playAmbient();
        },
        playAmbient() {
            state.sounds.ambient.play().catch(() => {
                console.log("Interacción requerida para audio.");
            });
        },
        playEffect(type) {
            if (type === 'win') {
                state.sounds.win.currentTime = 0;
                state.sounds.win.play();
            } else if (type === 'fail') {
                state.sounds.fail.currentTime = 0;
                state.sounds.fail.play();
            }
        }
    };

    // ==========================================
    // 🗣️ MOTOR DE VOZ (BILINGÜE OBLIGATORIO)
    // ==========================================
    const Speech = {
        say(text) {
            window.speechSynthesis.cancel(); // Detener previa
            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.9; // Ritmo profesional
            window.speechSynthesis.speak(u);
        }
    };

    // ==========================================
    // 🧘 NEURO-SILENCE PROGRESIVO & RESPIRACIÓN
    // ==========================================
    const SilenceReto = {
        getDuration(level) {
            // Regla: 1-6 bloques (20s a 60s), 7+ bloques (3min a 20min)
            if (level <= 6) return 20 + (level - 1) * 8; 
            return Math.min(180 + (level - 7) * 60, 1200); 
        },

        async start() {
            if (Lock.is() || state.silenceActive) return;
            
            state.silenceActive = true;
            UI.toggleBreathing(true);
            UI.clearOptions();

            const duration = this.getDuration(state.level);
            let timeLeft = duration;

            const protocols = {
                'CALM': { 
                    en: "Focus: Lowering Cortisol. Benefit: Emotional Control.",
                    es: "Objetivo: Bajar Cortisol. Beneficio: Control Emocional."
                }
            };

            Speech.say(state.lang === "en" ? "Silence Challenge Initiated." : "Reto de Silencio Iniciado.");
            Speech.say(protocols['CALM'][state.lang]);

            const timer = setInterval(() => {
                if (state.paused) return;

                timeLeft--;
                UI.updateTimer(timeLeft);
                UI.animateBreathing(timeLeft);

                // Distracciones aleatorias (The Warrior Distraction System)
                if (Math.random() > 0.95) triggerDistraction();

                if (timeLeft <= 0 || !state.silenceActive) {
                    clearInterval(timer);
                    this.complete();
                }
            }, 1000);
        },

        complete() {
            state.silenceActive = false;
            UI.toggleBreathing(false);
            state.level++;
            
            const msg = state.lang === "en" ? 
                "Challenge completed. Your mind is strengthening." : 
                "Reto completado. Tu mente se está fortaleciendo.";
            
            Speech.say(msg);
            Mission.loadNext();
        }
    };

    // ==========================================
    // 🎮 MOTOR DE DECISIONES (FEEDBACK & SEMÁFORO)
    // ==========================================
    const Decision = {
        handle(option) {
            if (Lock.is()) return;
            Lock.on();

            const isCorrect = option.correct;
            const explanation = option.explanation[state.lang];
            const signal = document.getElementById('feedback-signal');

            if (isCorrect) {
                AudioSystem.playEffect('win');
                signal.className = "semaphore-green";
                state.score += 100;
            } else {
                AudioSystem.playEffect('fail');
                signal.className = "semaphore-red";
                state.score -= 50;
            }

            UI.updateScore();
            UI.showExplanation(explanation);
            Speech.say(explanation);

            // Esperar a que la voz termine antes de mover el flujo
            setTimeout(() => {
                signal.className = "semaphore-off";
                UI.hideExplanation();
                // El reto de silencio aparece estratégicamente, no al minuto 1
                if (state.level % 2 === 0) {
                    SilenceReto.start();
                } else {
                    Mission.loadNext();
                }
            }, 7000);
        }
    };

    // ==========================================
    // 🎯 SISTEMA DE DISPARO A PALABRAS (DOPAMINA)
    // ==========================================
    const FloatingWords = {
        start() {
            setInterval(() => {
                if (state.silenceActive || state.paused || Lock.is()) return;
                this.spawn();
            }, 2500);
        },
        spawn() {
            const pool = {
                good: ["POWER", "FOCUS", "TRUTH", "WINNER"],
                bad: ["FEAR", "LAZY", "LIE", "QUIT"]
            };
            const isGood = Math.random() > 0.4;
            const word = isGood ? pool.good[Math.floor(Math.random()*pool.good.length)] : pool.bad[Math.floor(Math.random()*pool.bad.length)];
            
            const el = document.createElement("div");
            el.className = `floating ${isGood ? 'word-good' : 'word-bad'}`;
            el.innerText = word;
            el.style.left = Math.random() * 85 + "vw";
            
            el.onmousedown = () => {
                el.classList.add("blast");
                state.score += isGood ? 10 : -20;
                AudioSystem.playEffect(isGood ? 'win' : 'fail');
                UI.updateScore();
                setTimeout(() => el.remove(), 300);
            };

            document.getElementById("floating-words-layer").appendChild(el);
            setTimeout(() => { if(el) el.remove(); }, 6000);
        }
    };

    // ==========================================
    // 📂 CARGADOR DE MISIONES
    // ==========================================
    const Mission = {
        async loadNext() {
            Lock.on();
            try {
                const res = await fetch(`/api/mission/next?level=${state.level}`);
                const data = await res.json();
                state.mission = data;
                this.render(data);
            } catch (e) {
                console.error("Error cargando misión.");
            }
            Lock.off();
        },
        render(m) {
            const story = m.blocks.find(b => b.type === "story").text[state.lang];
            const decision = m.blocks.find(b => b.type === "decision");

            UI.setText("story-box", story);
            UI.renderOptions(decision.options);
            Speech.say(story);
        }
    };

    // ==========================================
    // 🖥️ INTERFAZ DE USUARIO (UI)
    // ==========================================
    const UI = {
        setText(id, val) { document.getElementById(id).innerText = val; },
        updateScore() { 
            const prefix = state.lang === "en" ? "SCORE: " : "PUNTOS: ";
            document.getElementById("points-display").innerText = prefix + state.score.toString().padStart(4, '0');
        },
        updateTimer(seconds) {
            const t = document.getElementById("timer-text");
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            t.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        },
        toggleBreathing(show) {
            document.getElementById("breathing-system").style.display = show ? "flex" : "none";
            document.getElementById("options-grid").style.display = show ? "none" : "grid";
        },
        animateBreathing(timeLeft) {
            const circle = document.getElementById("breathing-circle");
            const txt = document.getElementById("breath-text");
            const cycle = timeLeft % 8; // Ciclo de 8 seg

            if (cycle > 4) {
                txt.innerText = state.lang === "en" ? "EXHALE" : "EXHALA";
                circle.style.transform = "scale(0.8)";
            } else {
                txt.innerText = state.lang === "en" ? "INHALE" : "INHALA";
                circle.style.transform = "scale(1.2)";
            }
        },
        renderOptions(options) {
            const container = document.getElementById("options-grid");
            container.innerHTML = "";
            options.forEach(opt => {
                const b = document.createElement("button");
                b.innerText = opt.text[state.lang];
                b.onclick = () => Decision.handle(opt);
                container.appendChild(b);
            });
        },
        showExplanation(text) {
            const box = document.getElementById("explanation-box");
            box.innerText = text;
            box.style.display = "block";
        },
        hideExplanation() { document.getElementById("explanation-box").style.display = "none"; },
        clearOptions() { document.getElementById("options-grid").innerHTML = ""; }
    };

    function triggerDistraction() {
        // Sonidos de distracción para entrenar el enfoque
        const ping = new Audio('/assets/sounds/distraction_ping.mp3');
        ping.volume = 0.2;
        ping.play();
    }

    // ==========================================
    // 🚀 INICIALIZACIÓN & CONTROLES PÚBLICOS
    // ==========================================
    return {
        init() {
            AudioSystem.init();
            FloatingWords.start();
            Mission.loadNext();
            console.log("🚀 AURA ENGINE READY.");
        },
        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
            document.getElementById("lang-toggle").innerText = state.lang === "en" ? "ESPAÑOL" : "ENGLISH";
            UI.updateScore();
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

// Arranque oficial
window.onload = () => AuraEngine.init();
