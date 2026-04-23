/**
 * 🧠 AURA BY MAY ROGA LLC — KAMIZEN ENGINE 2026
 * Professional Advisory System for Matrix Training
 */

const KamizenEngine = (() => {

    const state = {
        score: 0,
        mastery: 1,
        lang: "es", // Default
        playing: true,
        timer: 300,
        stats: { respect: 50, peace: 50, lead: 50 },
        nextMissionEvent: 20, // Segundos para la primera misión
        currentMissionIndex: 0,
        missions: []
    };

    const words = {
        power: ["WILL", "FOCUS", "HONOR", "BUILD", "VISION", "RISE", "FAITH", "DISCIPLINE", "STRENGTH", "VICTORY"],
        risk: ["NOISE", "EXCUSE", "QUITTING", "EGO", "HATE", "CHAOS", "LAZY", "FEAR", "LIE", "ANGER"],
        silence: ["CALM", "LISTEN", "WAIT", "PEACE", "SOUL", "STILL", "BREATHE", "OBSERVE"]
    };

    // --- CARGA DE MISIONES (Simulado o Fetch) ---
    async function loadMissions() {
        // En un entorno real, aquí se hace fetch a los .json proporcionados
        // Por ahora, integramos la estructura de 4 opciones para el motor
        return [
            {
                id: 15, theme: "DIGITAL CONTROL", env: "MATRIX",
                text: { es: "Aparece un anuncio de un juego mientras haces la tarea.", en: "An ad appears while doing homework." },
                options: [
                    { text: { es: "Cerrar y bloquear sitio", en: "Close and block site" }, score: 10, impact: { peace: 5, lead: 5 }, correct: true, expl: { es: "Velocidad al cortar el RUIDO es VISIÓN.", en: "Speed in cutting NOISE is VISION." } },
                    { text: { es: "Cerrar la pestaña", en: "Close tab" }, score: 5, impact: { peace: 2, lead: 0 }, correct: true, expl: { es: "Buen enfoque.", en: "Good focus." } },
                    { text: { es: "Ver el tráiler", en: "Watch trailer" }, score: 0, impact: { peace: -5, lead: -5 }, correct: false, expl: { es: "La curiosidad es una EXCUSA.", en: "Curiosity is an EXCUSE." } },
                    { text: { es: "Descargar el juego", en: "Download game" }, score: -10, impact: { peace: -15, lead: -10 }, correct: false, expl: { es: "Trance total.", en: "Total trance." } }
                ]
            }
            // ... El motor cargará el resto de misiones 16-35 dinámicamente
        ];
    }

    const Speech = {
        say(text) {
            if (!text) return;
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 1.0;
            speechSynthesis.speak(u);
        }
    };

    function spawnWord() {
        if (!state.playing) return;
        
        const types = ["power", "risk", "silence"];
        const realType = types[Math.floor(Math.random() * 3)];
        const word = words[realType][Math.floor(Math.random() * words[realType].length)];

        // --- ENGAÑO VISUAL (Visual Deception) ---
        const isDeception = Math.random() < 0.3;
        let visualClass = realType;
        if (isDeception) {
            visualClass = realType === "power" ? "risk" : "power";
        }

        const el = document.createElement("div");
        el.className = `floating word-${visualClass}`;
        el.innerText = word;
        el.style.left = Math.random() * 80 + 5 + "vw";
        if (isDeception) el.style.filter = "contrast(1.5) brightness(1.2)";

        el.onclick = () => {
            if (realType === "risk") {
                state.score -= 20;
                state.stats.peace -= 5;
                document.getElementById("error").play();
            } else {
                state.score += 10 * state.mastery;
                state.stats.peace += 2;
                document.getElementById("hit").play();
            }
            updateHUD();
            el.classList.add("blast");
            setTimeout(() => el.remove(), 300);
        };

        document.getElementById("game-container").appendChild(el);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 6000);
    }

    function triggerMission() {
        state.playing = false;
        // Limpiar palabras flotantes para enfoque
        document.querySelectorAll(".floating").forEach(e => e.remove());

        const mission = state.missions[Math.floor(Math.random() * state.missions.length)];
        const overlay = document.getElementById("social-overlay");
        
        document.getElementById("scenario-env").innerText = mission.env || "MATRIX TRAINING";
        document.getElementById("scenario-title").innerText = mission.theme;
        document.getElementById("scenario-desc").innerText = mission.text[state.lang];
        
        const container = document.getElementById("decision-container");
        container.innerHTML = "";

        mission.options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "btn-decision";
            btn.innerText = opt.text[state.lang];
            btn.onclick = () => executeDecision(opt);
            container.appendChild(btn);
        });

        overlay.style.display = "flex";
        Speech.say(mission.text[state.lang]);
    }

    function executeDecision(opt) {
        state.score += opt.score;
        state.stats.respect += opt.impact.respect || 0;
        state.stats.peace += opt.impact.peace || 0;
        state.stats.lead += opt.impact.lead || 0;

        const toast = document.getElementById("feedback-toast");
        const msg = document.getElementById("feedback-msg");
        const expl = document.getElementById("explanation-text");

        toast.style.display = "block";
        toast.style.background = opt.correct ? "var(--neon-green)" : "var(--neon-red)";
        toast.style.color = "#000";
        
        msg.innerText = opt.correct ? "MASTERY INCREASED" : "MATRIX GLITCH DETECTED";
        expl.innerText = opt.expl[state.lang];

        Speech.say(opt.expl[state.lang]);

        setTimeout(() => {
            toast.style.display = "none";
            document.getElementById("social-overlay").style.display = "none";
            state.playing = true;
            updateHUD();
        }, 4000);
    }

    function updateHUD() {
        document.getElementById("score-box").innerText = state.score;
        document.getElementById("mastery-lvl").innerText = "x" + state.mastery;
        document.getElementById("stat-respect").innerText = state.stats.respect;
        document.getElementById("stat-peace").innerText = state.stats.peace;
        document.getElementById("stat-lead").innerText = state.stats.lead;

        const m = Math.floor(state.timer / 60).toString().padStart(2, "0");
        const s = (state.timer % 60).toString().padStart(2, "0");
        document.getElementById("timer-box").innerText = `${m}:${s}`;
    }

    function loop() {
        setInterval(() => {
            if (!state.playing) return;
            state.timer--;
            state.nextMissionEvent--;

            if (state.timer <= 0) {
                alert("Training Session Complete. Report generated.");
                location.reload();
            }

            if (state.nextMissionEvent <= 0) {
                triggerMission();
                state.nextMissionEvent = 30 + Math.random() * 20; 
            }
            updateHUD();
        }, 1000);
        
        setInterval(spawnWord, 1200);
    }

    return {
        async init() {
            state.missions = await loadMissions();
            updateHUD();
            loop();
        }
    };

})();

window.onload = () => KamizenEngine.init();
