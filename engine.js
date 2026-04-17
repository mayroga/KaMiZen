/**
 * 🧠 KAMIZEN ENGINE
 * SINGLE CONTROL SYSTEM + UI CONTROL + TIME FIXED + LANGUAGE FIX
 */

const KamizenEngine = (() => {

    // ==========================================
    // 📊 STATE (SINGLE SOURCE OF TRUTH)
    // ==========================================
    const state = {
        score: 0,
        focus: 100,
        energy: 100,
        lang: "en",
        mission: null,
        locked: false,
        silenceActive: false,
        silenceTime: 20,
        timerInterval: null,
        missionId: 1
    };

    const player = { name: "", hero: "" };

    // ==========================================
    // 🔒 LOCK SYSTEM
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
        is() { return state.locked; }
    };

    // ==========================================
    // 🔊 AUDIO
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
                this.bg.volume = 0.35;
                this.bg.playbackRate = 1.05;
                this.bg.play().catch(() => {});
            }
        },

        play(type) {
            if (type === "win" && this.ok) this.ok.play();
            if (type === "bad" && this.bad) this.bad.play();
        }
    };

    // ==========================================
    // 🗣️ SPEECH (SAFE)
    // ==========================================
    const Speech = {
        say(text) {
            try {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                u.lang = state.lang === "en" ? "en-US" : "es-ES";
                u.rate = 0.9;
                window.speechSynthesis.speak(u);
            } catch {}
        }
    };

    // ==========================================
    // 🌍 TEXT SYSTEM (NO MIX LANGUAGE)
    // ==========================================
    const TEXT = {
        en: {
            start: "Start",
            back: "Back",
            restart: "Restart",
            points: "POINTS",
            focus: "FOCUS",
            energy: "ENERGY",
            silence: "SILENCE",
            inhale: "Inhale",
            exhale: "Exhale",
            ready: "Mission Ready",
            lost: "Attention lost. Restarting."
        },
        es: {
            start: "Iniciar",
            back: "Atrás",
            restart: "Reiniciar",
            points: "PUNTOS",
            focus: "FOCO",
            energy: "ENERGÍA",
            silence: "SILENCIO",
            inhale: "Inhala",
            exhale: "Exhala",
            ready: "Misión lista",
            lost: "Atención perdida. Reiniciando."
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

        updateTop() {
            this.set("score-display", `${TEXT[state.lang].points}: ${state.score}`);
            this.set("focus-display", `${TEXT[state.lang].focus}: ${state.focus}%`);
            this.set("energy-display", `${TEXT[state.lang].energy}: ${state.energy}`);
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
            const c = document.getElementById("options");
            c.innerHTML = "";

            options.forEach(opt => {
                const b = document.createElement("button");
                b.className = "opt-btn";
                b.innerText = opt.text[state.lang];
                b.onclick = () => Decision.handle(opt);
                c.appendChild(b);
            });
        }
    };

    // ==========================================
    // 🎯 FLOATING WORDS (SAFE)
    // ==========================================
    const Floating = {
        start() {
            setInterval(() => {
                if (state.silenceActive || Lock.is()) return;
                this.spawn();
            }, 2200);
        },

        spawn() {
            const types = [
                { cls: "word-good", val: 5, words: ["FOCUS","TRUTH","CALM","POWER"] },
                { cls: "word-bad", val: -10, words: ["FEAR","LIE","ANGER","LOSS"] },
                { cls: "word-neutral", val: 0, words: ["WALK","LOOK","WAIT","CITY"] }
            ];

            const t = types[Math.floor(Math.random() * types.length)];

            const el = document.createElement("div");
            el.className = `floating ${t.cls}`;
            el.innerText = t.words[Math.floor(Math.random() * t.words.length)];
            el.style.left = Math.random() * 90 + "vw";

            el.onmousedown = () => {
                el.classList.add("blast");
                state.score += t.val;
                if (t.val < 0) state.focus -= 2;
                if (t.val > 0) state.energy += 1;

                AudioSystem.play(t.val >= 0 ? "win" : "bad");
                UI.updateTop();
                setTimeout(() => el.remove(), 300);
            };

            document.body.appendChild(el);
            setTimeout(() => el.remove(), 5000);
        }
    };

    // ==========================================
    // 🎮 DECISION SYSTEM
    // ==========================================
    const Decision = {
        async handle(opt) {

            Lock.on();

            const box = document.getElementById("explanation-box");
            box.style.display = "block";

            let resultText = opt.explanation[state.lang];

            if (opt.correct === true) {
                state.score += 20;
                state.focus += 2;
                state.energy += 2;
                AudioSystem.play("win");
                Speech.say("Excellent. " + resultText);
            }

            else if (opt.correct === "partial") {
                state.score += 5;
                state.focus += 1;
                AudioSystem.play("win");
                Speech.say("Partial. " + resultText);
            }

            else {
                state.score -= 10;
                state.focus -= 3;
                state.energy -= 2;
                AudioSystem.play("bad");
                Speech.say("Incorrect. " + resultText);
            }

            UI.updateTop();
            box.innerText = resultText;

            await sleep(4000);

            box.style.display = "none";
            document.body.style.background = "";

            await Silence.start();
        }
    };

    // ==========================================
    // 🧘 SILENCE SYSTEM FIXED (NO FREEZE)
    // ==========================================
    const Silence = {

        async start() {

            state.silenceActive = true;
            UI.clearOptions();
            UI.showBreath(true);

            const lvl = state.missionId;

            if (lvl <= 7) state.silenceTime = 20;
            else if (lvl <= 14) state.silenceTime = 180;
            else if (lvl <= 21) state.silenceTime = 300;
            else if (lvl <= 28) state.silenceTime = 600;
            else state.silenceTime = 1200;

            let time = state.silenceTime;

            this.startTimer(time);
            this.breathLoop();

        },

        startTimer(time) {

            const box = document.getElementById("story");

            if (state.timerInterval) clearInterval(state.timerInterval);

            state.timerInterval = setInterval(() => {

                time--;

                const min = Math.floor(time / 60);
                const sec = time % 60;

                UI.set("analysis", `${TEXT[state.lang].silence}: ${min}:${sec < 10 ? "0" + sec : sec}`);

                if (time <= 0) {
                    clearInterval(state.timerInterval);
                    this.complete();
                }

            }, 1000);
        },

        async breathLoop() {

            const b = document.getElementById("breath");

            while (state.silenceActive) {

                b.style.transform = "scale(2.5)";
                Speech.say(TEXT[state.lang].inhale);
                await sleep(3500);

                b.style.transform = "scale(1)";
                Speech.say(TEXT[state.lang].exhale);
                await sleep(3500);
            }
        },

        complete() {
            state.silenceActive = false;
            UI.showBreath(false);
            Speech.say("Completed");
            Mission.next();
        }
    };

    // ==========================================
    // 👁️ ANTI FREEZE ATTENTION SYSTEM
    // ==========================================
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && state.silenceActive) {
            Speech.say(TEXT[state.lang].lost);
            Silence.start();
        }
    });

    // ==========================================
    // 📂 MISSION SYSTEM
    // ==========================================
    const Mission = {

        async next() {

            Lock.on();

            try {
                const res = await fetch("/api/mission/next");
                state.mission = await res.json();
                state.missionId = state.mission.id;
                this.render(state.mission);
            } catch {}

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
            }, 3000);

            setTimeout(() => {
                UI.renderOptions(decision.options);
            }, 6000);
        }
    };

    // ==========================================
    // 🚀 INIT SAFE (NO DOUBLE LOAD)
    // ==========================================
    async function init() {

        player.name = prompt("Name") || "Player";
        player.hero = prompt("Hero") || "Kamizen";

        UI.set("hero-name", player.hero);

        AudioSystem.init();
        Floating.start();
        UI.updateTop();

        Mission.next();
    }

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    // ==========================================
    // 🌐 PUBLIC API
    // ==========================================
    return {
        init,
        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
            if (state.mission) Mission.render(state.mission);
        },
        back() {
            Mission.next();
        },
        restart() {
            location.reload();
        }
    };

})();

window.onload = null;
