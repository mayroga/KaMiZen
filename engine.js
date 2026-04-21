
/**
 * 🧠 KAMIZEN ENGINE CORE — AL CIELO EDITION
 * Director de Orquesta: Música, Disparos, TVID y Neuro-Silence
 */

const KamizenEngine = (() => {

    // ==========================================
    // 📊 ESTADO GLOBAL (Single Source of Truth)
    // ==========================================
    const state = {
        score: 0,
        energy: 100,
        lang: "en",
        missionId: 1,
        mission: null,
        locked: false,
        silenceActive: false,
        silenceTime: 180, // Inicia en 3 min (180s)
        floatingWords: ["POWER", "FOCUS", "STREET", "TRUTH"]
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
    // 🔊 AUDIO & DOPAMINA (ESTILO SONIC)
    // ==========================================
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
                this.bg.playbackRate = 1.1; // Más rápido para energía
                this.bg.volume = 0.3;
                this.bg.play().catch(() => {});
            }
        },
        playEffect(type) {
            if (type === 'win' && this.ok) this.ok.play();
            if (type === 'bad' && this.bad) this.bad.play();
        }
    };

    // ==========================================
    // 🗣️ MOTOR DE VOZ (SPEECH)
    // ==========================================
    const Speech = {
        say(text) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.9;
            window.speechSynthesis.speak(u);
        }
    };

    // ==========================================
    // 🎯 SISTEMA DE DISPARO A PALABRAS
    // ==========================================
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
            setTimeout(() => { if(el) el.remove(); }, 5000);
        }
    };

    // ==========================================
    // 🎮 MOTOR DE DECISIONES (4 OPCIONES + TVID)
    // ==========================================
    const Decision = {
        async handle(option) {
            Lock.on();
            const box = document.getElementById("explanation-box");
            box.style.display = "block";
           
            const explanation = option.explanation[state.lang];
            box.innerText = explanation;
           
            const synonymsGood = ["¡Excelente!", "¡Sabio!", "¡Nivel Sonic!", "¡Poderoso!"];
            const synonymsBad = ["¡Cuidado!", "¡Atención!", "¡Error de cálculo!", "¡Piénsalo!"];

            if (option.correct) {
                document.body.style.backgroundColor = "#004400";
                AudioSystem.playEffect("win");
                Speech.say(synonymsGood[Math.floor(Math.random()*synonymsGood.length)] + " " + explanation);
            } else {
                document.body.style.backgroundColor = "#440000";
                AudioSystem.playEffect("bad");
                Speech.say(synonymsBad[Math.floor(Math.random()*synonymsBad.length)] + " " + explanation);
            }

            setTimeout(async () => {
                document.body.style.backgroundColor = "";
                box.style.display = "none";
                await SilenceReto.start();
            }, 6000);
        }
    };

    // ==========================================
    // 🧘 NEURO-SILENCE PROGRESIVO
    // ==========================================
    const SilenceReto = {
        explanations: [
            "El silencio es donde tu cerebro guarda lo aprendido, como cuando Sonic guarda sus anillos.",
            "Ahora vamos a calmar el corazón para que tu mente sea más rápida que cualquier enemigo.",
            "La respiración guiada no es aburrida, es el entrenamiento secreto de los líderes.",
            "Dominar tu silencio es dominar tu vida en la calle."
        ],
        async start() {
            state.silenceActive = true;
            UI.clearOptions();
           
            const msg = this.explanations[Math.floor(Math.random() * this.explanations.length)];
            Speech.say(msg + " Iniciando reto de silencio.");
           
            UI.showBreath(true);
            UI.setText("story", `SILENCIO PROGRESIVO: ${Math.floor(state.silenceTime / 60)} MIN`);
           
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
            state.silenceTime = Math.min(state.silenceTime + 60, 1200); // Sube 1 min hasta 20
            UI.showBreath(false);
            Speech.say("Reto completado. Subiendo de nivel.");
            Mission.loadNext();
        }
    };

    // ==========================================
    // 📂 CARGADOR DE MISIONES (PERSISTENTE)
    // ==========================================
    const Mission = {
        async loadNext() {
            Lock.on();
            try {
                const res = await fetch("/api/mission/next");
                const data = await res.json();
                state.mission = data;
                this.render(data);
            } catch (e) {
                console.error("Error cargando misión");
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

    // ==========================================
    // 🖥️ INTERFAZ DE USUARIO (UI)
    // ==========================================
    const UI = {
        setText(id, val) { const el = document.getElementById(id); if(el) el.innerText = val; },
        updateScore() { this.setText("score-display", `PUNTOS: ${state.score}`); },
        clearOptions() { document.getElementById("options").innerHTML = ""; },
        showBreath(show) { document.getElementById("breath").style.display = show ? "block" : "none"; },
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

    // ==========================================
    // 🚀 INICIALIZACIÓN
    // ==========================================
    return {
        init() {
            AudioSystem.init();
            FloatingWords.start();
            Mission.loadNext();
            console.log("🚀 Kamizen Engine Al Cielo Ready.");
        },
        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
            if(state.mission) Mission.render(state.mission);
        }
    };
})();

// Iniciar al cargar la ventana
window.onload = () => KamizenEngine.init();
