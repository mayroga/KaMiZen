/**
 * 🧠 KAMIZEN ENGINE CORE — AL CIELO PRO
 * SISTEMA DE ASESORÍA DE VIDA: SUPERVIVENCIA, VALORES Y ESTRATEGIA SOCIAL
 * INTEGRACIÓN TOTAL: SONIDOS DOPAMINA + CRISTAL ROTO + EXPLICACIONES DE VIDA
 * + BACKUP SAFE SYSTEM (ANTI-CRASH) + VISUAL EXPLOSION BOOST
 */

const KamizenEngine = (() => {

    // =====================================================
    // 📊 ESTADO GLOBAL
    // =====================================================
    const state = {
        score: 0,
        lang: "en",
        missionIndex: 0,
        missions: [],
        current: null,
        locked: false,
        mode: "mission",

        // 🛡️ BACKUP MODE (si API falla)
        backupMode: false,

        // Palabras que moldean el ADN del niño
        words: {
            good: [
                { en: "FOCUS", es: "ENFOQUE", life: { en: "Focus is your shield against the world's noise.", es: "El enfoque es tu escudo contra el ruido del mundo." }},
                { en: "SACRIFICE", es: "SACRIFICIO", life: { en: "Behind every comfort, there is someone's hard work.", es: "Detrás de cada comodidad, hay el trabajo duro de alguien." }},
                { en: "ALERT", es: "ALERTA", life: { en: "A warrior sees the glitch before it becomes a problem.", es: "Un guerrero ve el fallo antes de que se convierta en problema." }},
                { en: "RESILIENCE", es: "RESILIENCIA", life: { en: "Falling is part of the path; getting up is the goal.", es: "Caer es parte del camino; levantarse es el objetivo." }},
                { en: "ACTION", es: "ACCIÓN", life: { en: "Doing nothing has consequences. Movement is life.", es: "No hacer nada tiene consecuencias. El movimiento es vida." }}
            ],
            bad: [
                { en: "FEAR", es: "MIEDO", life: { en: "Fear is a lie designed to freeze your potential.", es: "El miedo es una mentira diseñada para congelar tu potencial." }},
                { en: "DISTRACTION", es: "DISTRACCIÓN", life: { en: "In the street, a distracted mind is an open door.", es: "En la calle, una mente distraída es una puerta abierta." }},
                { en: "EGO", es: "EGO", life: { en: "Ego blinds you from seeing reality as it truly is.", es: "El ego te ciega y no te deja ver la realidad como es." }},
                { en: "IMPULSE", es: "IMPULSO", life: { en: "Reacting without thinking gives power to your enemy.", es: "Reaccionar sin pensar le da el poder a tu enemigo." }},
                { en: "VICTIM", es: "VÍCTIMA", life: { en: "Victims complain; warriors adapt and overcome.", es: "Las víctimas se quejan; los guerreros se adaptan y vencen." }}
            ]
        }
    };

    // =====================================================
    // 🔊 SISTEMA DE AUDIO
    // =====================================================
    const AudioSystem = {
        init() {
            const bg = document.getElementById("bg_music");
            if (bg) {
                bg.volume = 0.3;
                bg.play().catch(() => {});
            }
        },
        playSuccess() {
            const s = document.getElementById("ok_sound");
            if (s) {
                s.currentTime = 0;
                s.play().catch(() => {});
            }
        },
        playGlass() {
            const g = document.getElementById("bad_sound");
            if (g) {
                g.currentTime = 0;
                g.play().catch(() => {});
            }
        }
    };

    // =====================================================
    // 🗣️ VOZ
    // =====================================================
    const Speech = {
        say(text) {
            if (!text) return;
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "es" ? "es-ES" : "en-US";
            u.rate = 0.9;
            speechSynthesis.speak(u);
        }
    };

    // =====================================================
    // 🌌 PALABRAS FLOTANTES (MEJORADAS + EXPLOSIÓN)
    // =====================================================
    const Floating = {

        spawn() {
            if (state.mode !== "mission" || state.locked) return;

            const isGood = Math.random() > 0.4;
            const pool = isGood ? state.words.good : state.words.bad;
            const item = pool[Math.floor(Math.random() * pool.length)];

            const el = document.createElement("div");
            el.className = "floating";
            el.innerText = state.lang === "es" ? item.es : item.en;

            el.style.left = (Math.random() * 85 + 5) + "vw";
            el.style.color = isGood ? "#00f2ff" : "#ff4444";
            el.style.border = `2px solid ${isGood ? "#00f2ff" : "#ff4444"}`;

            el.onclick = () => {

                const lesson = item.life[state.lang];

                if (isGood) {
                    state.score += 10;
                    AudioSystem.playSuccess();
                } else {
                    state.score -= 20;
                    AudioSystem.playGlass();
                }

                document.getElementById("analysis").innerText = lesson;
                Speech.say(lesson);
                document.getElementById("points-display").innerText = "POINTS: " + state.score;

                // 💥 EXPLOSIÓN GRANDE (VISUAL)
                el.style.transform = "scale(6)";
                el.style.opacity = "0";
                el.style.transition = "0.25s ease";

                setTimeout(() => el.remove(), 300);
            };

            document.body.appendChild(el);

            setTimeout(() => {
                if (el.parentNode) el.remove();
            }, 5000);
        },

        start() {
            setInterval(() => this.spawn(), 1400);
        }
    };

    // =====================================================
    // 🧠 DECISION SYSTEM
    // =====================================================
    const Decision = {
        handle(opt) {

            state.locked = true;

            const box = document.getElementById("explanation-box");
            const explanation = opt.explanation[state.lang];

            let feedback = "";

            if (opt.correct) {
                state.score += 50;
                AudioSystem.playSuccess();

                feedback = (state.lang === "es"
                    ? "ESTRATEGIA CORRECTA:\n"
                    : "CORRECT STRATEGY:\n") + explanation;

            } else {
                state.score -= 40;
                AudioSystem.playGlass();

                feedback = (state.lang === "es"
                    ? "FALLO DE JUICIO:\n"
                    : "JUDGMENT FAILURE:\n") + explanation;
            }

            box.innerText = feedback;
            box.style.display = "block";

            document.getElementById("points-display").innerText = "POINTS: " + state.score;

            Speech.say(feedback);

            setTimeout(() => {
                box.style.display = "none";
                state.locked = false;
                Mission.next();
            }, 8000);
        }
    };

    // =====================================================
    // 📂 MISSION SYSTEM + BACKUP
    // =====================================================
    const Mission = {

        async load() {

            try {
                const res = await fetch(`/api/mission/${state.missionIndex + 1}`);

                if (!res.ok) throw new Error("API FAIL");

                const data = await res.json();
                state.backupMode = false;

                this.render(data);

            } catch (e) {

                console.warn("⚠️ BACKUP MODE ACTIVATED");

                state.backupMode = true;

                this.renderBackup();
            }
        },

        render(m) {

            const story = m.blocks.find(b => b.type === "story").text[state.lang];
            const analysis = m.blocks.find(b => b.type === "analysis").text[state.lang];
            const decision = m.blocks.find(b => b.type === "decision");

            document.getElementById("story").innerText = story;
            document.getElementById("analysis").innerText = "";

            Speech.say(story);

            setTimeout(() => {
                document.getElementById("analysis").innerText = analysis;
                Speech.say(analysis);
            }, 3500);

            setTimeout(() => {

                const c = document.getElementById("options");
                c.innerHTML = "";

                decision.options.forEach(opt => {
                    const b = document.createElement("button");
                    b.className = "opt-btn";
                    b.innerText = opt.text[state.lang];
                    b.onclick = () => Decision.handle(opt);
                    c.appendChild(b);
                });

            }, 7000);
        },

        // 🛡️ MODO RESPALDO (NO BLOQUEA APP)
        renderBackup() {

            const story = state.lang === "es"
                ? "Modo supervivencia activo. Observa y decide."
                : "Survival mode active. Observe and decide.";

            const analysis = state.lang === "es"
                ? "Incluso sin sistema, tu mente sigue funcionando."
                : "Even without system, your mind still works.";

            document.getElementById("story").innerText = story;
            document.getElementById("analysis").innerText = analysis;

            Speech.say(story);

            const c = document.getElementById("options");
            c.innerHTML = "";

            ["WAIT", "MOVE", "OBSERVE"].forEach(txt => {
                const b = document.createElement("button");
                b.className = "opt-btn";
                b.innerText = txt;
                b.onclick = () => {
                    state.score += 5;
                    document.getElementById("points-display").innerText = "POINTS: " + state.score;
                    this.next();
                };
                c.appendChild(b);
            });
        },

        next() {
            state.missionIndex++;
            this.load();
        }
    };

    // =====================================================
    // 🚀 INIT
    // =====================================================
    return {

        init() {
            AudioSystem.init();
            Floating.start();
            Mission.load();
        },

        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
            Mission.load();
        }
    };

})();

// AUTO START (SAFE)
window.onload = () => {
    if (typeof KamizenEngine !== "undefined") {
        KamizenEngine.init();
    }
};
