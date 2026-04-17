/**
 * 🧠 KAMIZEN ENGINE AAA — AL CIELO FINAL
 * Single Brain System — NO CONFLICTS
 */

const KamizenEngine = (() => {

    // ==========================================
    // 📊 GLOBAL STATE (SOURCE OF TRUTH)
    // ==========================================
    const state = {
        score: 0,
        energy: 100,
        lang: "en",
        mission: null,
        locked: false,
        silenceActive: false,
        silenceTime: 180,
        attentionLoss: 0,
        breathingInterval: 4000
    };

    const player = {
        name: "",
        hero: ""
    };

    // ==========================================
    // 🔒 LOCK SYSTEM (HARD CONTROL)
    // ==========================================
    const Lock = {
        on() {
            state.locked = true;
            document.body.style.pointerEvents = "none";
        },
        off() {
            state.locked = false;
            document.body.style.pointerEvents = "auto";
        },
        is() {
            return state.locked;
        }
    };

    // ==========================================
    // 🔊 AUDIO SYSTEM
    // ==========================================
    const AudioSystem = {
        bg: null,
        ok: null,
        bad: null,

        init() {
            this.bg = document.getElementById("bg");
            this.ok = document.getElementById("ok");
            this.bad = document.getElementById("bad");

            if (this.bg) {
                this.bg.volume = 0.4;
                this.bg.playbackRate = 1.1;
                this.bg.play().catch(() => {});
            }
        },

        play(type) {
            if (type === "win" && this.ok) this.ok.play();
            if (type === "bad" && this.bad) this.bad.play();
        }
    };

    // ==========================================
    // 🗣️ SPEECH SYSTEM
    // ==========================================
    const Speech = {
        say(text) {
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = state.lang === "en" ? "en-US" : "es-ES";
            msg.rate = 0.9;
            window.speechSynthesis.speak(msg);
        }
    };

    // ==========================================
    // 🖥️ UI SYSTEM
    // ==========================================
    const UI = {
        set(id, val) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        },

        updateScore() {
            this.set("score-display", `PUNTOS: ${state.score}`);
        },

        clearOptions() {
            const el = document.getElementById("options");
            if (el) el.innerHTML = "";
        },

        showBreath(show) {
            const el = document.getElementById("breath");
            if (el) el.style.display = show ? "block" : "none";
        },

        renderOptions(options) {
            const container = document.getElementById("options");
            container.innerHTML = "";

            options.forEach(opt => {
                const btn = document.createElement("button");
                btn.className = "opt-btn";
                btn.innerText = opt.text[state.lang];
                btn.onclick = () => Decision.handle(opt);
                container.appendChild(btn);
            });
        }
    };

    // ==========================================
    // 🎯 FLOATING WORDS SYSTEM (UNIFIED)
    // ==========================================
    const Floating = {
        start() {
            setInterval(() => {
                if (state.silenceActive || Lock.is()) return;
                this.spawn();
            }, 2000);
        },

        spawn() {
            const types = [
                { cls: "word-good", val: 5, words: ["FOCUS","POWER","TRUTH","CALM"] },
                { cls: "word-bad", val: -10, words: ["FEAR","LIE","LAZY","ANGER"] },
                { cls: "word-neutral", val: 0, words: ["CITY","WAIT","WALK","LOOK"] }
            ];

            const t = types[Math.floor(Math.random()*types.length)];

            const el = document.createElement("div");
            el.className = `floating ${t.cls}`;
            el.innerText = t.words[Math.floor(Math.random()*t.words.length)];
            el.style.left = Math.random() * 90 + "vw";

            el.onmousedown = () => {
                el.classList.add("blast");
                state.score += t.val;
                AudioSystem.play(t.val >= 0 ? "win" : "bad");
                UI.updateScore();
                setTimeout(() => el.remove(), 300);
            };

            document.body.appendChild(el);
            setTimeout(() => el.remove(), 5000);
        }
    };

    // ==========================================
    // 🎮 DECISION SYSTEM (FULL SUPPORT)
    // ==========================================
    const Decision = {
        async handle(option) {
            Lock.on();

            const box = document.getElementById("explanation-box");
            box.style.display = "block";

            const text = option.explanation[state.lang];
            box.innerText = text;

            let feedback;

            if (option.correct === true) {
                state.score += 20;
                feedback = randomGood();
                document.body.style.backgroundColor = "#004400";
                AudioSystem.play("win");

            } else if (option.correct === "partial") {
                state.score += 5;
                feedback = "Aceptable… pero puedes hacerlo mejor.";
                document.body.style.backgroundColor = "#444400";
                AudioSystem.play("win");

            } else {
                state.score -= 10;
                feedback = randomBad();
                document.body.style.backgroundColor = "#440000";
                AudioSystem.play("bad");
            }

            UI.updateScore();
            Speech.say(`${feedback}. ${text}`);

            await sleep(6000);

            document.body.style.backgroundColor = "";
            box.style.display = "none";

            await Silence.start();
        }
    };

    function randomGood(){
        const arr = ["¡Excelente!","¡Poderoso!","¡Nivel Sonic!","¡Sabio!"];
        return arr[Math.floor(Math.random()*arr.length)];
    }

    function randomBad(){
        const arr = ["¡Cuidado!","¡Error!","¡Recalibrando!","¡Atención!"];
        return arr[Math.floor(Math.random()*arr.length)];
    }

    // ==========================================
    // 🧘 SILENCE SYSTEM AAA (REAL)
    // ==========================================
    const Silence = {

        async start() {
            state.silenceActive = true;
            state.attentionLoss = 0;

            UI.clearOptions();
            UI.showBreath(true);

            const lvl = state.mission.level;

            try {
                const res = await fetch(`/api/silence/${lvl}`);
                const data = await res.json();
                state.silenceTime = data.silence_time;
            } catch {
                state.silenceTime = 180;
            }

            UI.set("story", `SILENCIO: ${Math.floor(state.silenceTime/60)} MIN`);
            UI.set("analysis", "No toques nada. Respira.");

            Speech.say("Iniciando reto de silencio.");

            this.breathingLoop();

            let time = state.silenceTime;

            const timer = setInterval(() => {
                time--;

                if (time <= 0) {
                    clearInterval(timer);
                    this.complete();
                }

            }, 1000);
        },

        async breathingLoop() {
            const breath = document.getElementById("breath");

            while (state.silenceActive) {

                breath.style.transform = "scale(2.5)";
                Speech.say("Inhala");
                await sleep(state.breathingInterval);

                breath.style.transform = "scale(1)";
                Speech.say("Exhala");
                await sleep(state.breathingInterval);
            }
        },

        complete() {
            state.silenceActive = false;

            UI.showBreath(false);

            Speech.say("Reto completado.");

            Mission.next();
        }
    };

    // ==========================================
    // 👁️ ATTENTION CONTROL (REAL)
    // ==========================================
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && state.silenceActive) {
            state.attentionLoss++;

            if (state.attentionLoss >= 2) {
                Speech.say("Perdiste atención. Reiniciando.");
                Silence.start();
            }
        }
    });

    document.addEventListener("click", (e) => {
        if (state.silenceActive) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);

    // ==========================================
    // 📂 MISSION SYSTEM
    // ==========================================
    const Mission = {

        async next() {
            Lock.on();

            try {
                const res = await fetch("/api/mission/next");
                const data = await res.json();

                state.mission = data;

                this.render(data);

            } catch (e) {
                console.error("Error misión");
            }

            Lock.off();
        },

        render(m) {
            const story = m.blocks.find(b => b.type === "story").text[state.lang];
            const analysis = m.blocks.find(b => b.type === "analysis").text[state.lang];
            const decision = m.blocks.find(b => b.type === "decision");

            UI.set("story", story);
            UI.set("analysis", "");
            UI.clearOptions();

            Speech.say(story);

            setTimeout(() => {
                UI.set("analysis", analysis);
                Speech.say(analysis);
            }, 4000);

            setTimeout(() => {
                UI.renderOptions(decision.options);
            }, 8000);
        }
    };

    // ==========================================
    // 🧍 INIT
    // ==========================================
    async function init() {

        player.name = prompt("Tu nombre real:") || "Player";
        player.hero = prompt("Nombre de tu héroe:") || "Kamizen";

        UI.set("hero-name", player.hero);

        AudioSystem.init();
        Floating.start();

        Mission.next();

        console.log("🧠 KAMIZEN ENGINE AAA READY");
    }

    function sleep(ms){
        return new Promise(r => setTimeout(r, ms));
    }

    // ==========================================
    // 🌐 PUBLIC API
    // ==========================================
    return {
        init,
        toggleLang(){
            state.lang = state.lang === "en" ? "es" : "en";
            if (state.mission) Mission.render(state.mission);
        }
    };

})();

window.onload = () => KamizenEngine.init();
