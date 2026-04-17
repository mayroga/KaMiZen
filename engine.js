/**
 * 🧠 KAMIZEN ENGINE vFINAL STABLE
 * NO FREEZE + NO LOOP SPAM + UI SAFE + SYNC CONTROL
 */

const KamizenEngine = (() => {

    // ==========================================
    // 📊 STATE
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
        missionId: 1,
        running: true,
        floatInterval: null,
        breathActive: false
    };

    const player = { name: "", hero: "" };

    // ==========================================
    // 🔒 SAFE LOCK (NO FULL FREEZE)
    // ==========================================
    const Lock = {
        on() {
            state.locked = true;
            document.body.classList.add("locked");
        },
        off() {
            state.locked = false;
            document.body.classList.remove("locked");
        },
        is() { return state.locked; }
    };

    // ==========================================
    // 🔊 AUDIO SAFE
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
                this.bg.volume = 0.3;
                this.bg.play().catch(() => {});
            }
        },

        play(type) {
            try {
                if (type === "win" && this.ok) this.ok.play();
                if (type === "bad" && this.bad) this.bad.play();
            } catch {}
        }
    };

    // ==========================================
    // 🗣️ SPEECH SAFE (ANTI SPAM)
    // ==========================================
    const Speech = {
        last: 0,

        say(text) {
            const now = Date.now();
            if (now - this.last < 1200) return; // 🔥 ANTI FREEZE
            this.last = now;

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
    // 🌍 TEXT CLEAN (NO MIX ISSUES)
    // ==========================================
    const TEXT = {
        en: {
            points: "POINTS",
            focus: "FOCUS",
            energy: "ENERGY",
            silence: "SILENCE",
            inhale: "Inhale",
            exhale: "Exhale",
            lost: "Attention lost"
        },
        es: {
            points: "PUNTOS",
            focus: "FOCO",
            energy: "ENERGÍA",
            silence: "SILENCIO",
            inhale: "Inhala",
            exhale: "Exhala",
            lost: "Atención perdida"
        }
    };

    // ==========================================
    // 🖥️ UI SAFE
    // ==========================================
    const UI = {

        set(id, val) {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
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

        renderOptions(options) {
            const c = document.getElementById("options");
            if (!c) return;

            c.innerHTML = "";

            options.forEach(opt => {
                const b = document.createElement("button");
                b.className = "opt-btn";
                b.textContent = opt.text[state.lang];
                b.onclick = () => Decision.handle(opt);
                c.appendChild(b);
            });
        },

        show(id, show) {
            const el = document.getElementById(id);
            if (el) el.style.display = show ? "block" : "none";
        }
    };

    // ==========================================
    // 🎯 FLOATING WORDS SAFE (NO INTERVAL OVERLOAD)
    // ==========================================
    const Floating = {
        start() {

            if (state.floatInterval) clearInterval(state.floatInterval);

            state.floatInterval = setInterval(() => {

                if (state.locked || state.silenceActive) return;

                if (document.hidden) return;

                this.spawn();

            }, 2500);
        },

        spawn() {

            const words = ["FOCUS", "TRUTH", "CALM", "FEAR", "NOISE", "POWER"];
            const val = Math.random() > 0.5 ? 5 : -5;

            const el = document.createElement("div");
            el.className = "floating";
            el.textContent = words[Math.floor(Math.random() * words.length)];
            el.style.left = Math.random() * 90 + "vw";

            el.onclick = () => {
                state.score += val;
                state.focus += val > 0 ? 1 : -2;
                AudioSystem.play(val > 0 ? "win" : "bad");
                UI.updateTop();
                el.remove();
            };

            document.body.appendChild(el);

            setTimeout(() => el.remove(), 4000);
        }
    };

    // ==========================================
    // 🎮 DECISION SAFE
    // ==========================================
    const Decision = {
        async handle(opt) {

            if (state.locked) return;

            Lock.on();

            const box = document.getElementById("explanation-box");
            if (box) box.style.display = "block";

            let txt = opt.explanation[state.lang];

            if (opt.correct === true) {
                state.score += 20;
                state.focus += 2;
                state.energy += 2;
                AudioSystem.play("win");
            } else if (opt.correct === "partial") {
                state.score += 5;
                AudioSystem.play("win");
            } else {
                state.score -= 10;
                state.focus -= 2;
                AudioSystem.play("bad");
            }

            UI.updateTop();
            Speech.say(txt);

            if (box) box.textContent = txt;

            await new Promise(r => setTimeout(r, 2500));

            if (box) box.style.display = "none";

            Lock.off();

            Silence.start();
        }
    };

    // ==========================================
    // 🧘 SILENCE FIX (NO LOOP FREEZE)
    // ==========================================
    const Silence = {

        active: false,

        start() {

            if (this.active) return;

            this.active = true;
            state.silenceActive = true;

            UI.clearOptions();
            UI.show("breath", true);

            let time = state.missionId <= 7 ? 20 :
                       state.missionId <= 14 ? 180 :
                       state.missionId <= 21 ? 300 : 600;

            const el = document.getElementById("analysis");

            if (state.timerInterval) clearInterval(state.timerInterval);

            state.timerInterval = setInterval(() => {

                time--;

                if (el) {
                    el.textContent =
                        `${TEXT[state.lang].silence}: ${Math.floor(time/60)}:${String(time%60).padStart(2,"0")}`;
                }

                if (time <= 0) {
                    clearInterval(state.timerInterval);
                    this.stop();
                }

            }, 1000);

            this.breathCycle();
        },

        breathCycle() {

            if (state.breathActive) return;

            state.breathActive = true;

            const loop = async () => {
                while (this.active) {

                    const b = document.getElementById("breath");
                    if (b) b.style.transform = "scale(2)";

                    Speech.say(TEXT[state.lang].inhale);
                    await new Promise(r => setTimeout(r, 3000));

                    if (!this.active) break;

                    if (b) b.style.transform = "scale(1)";

                    Speech.say(TEXT[state.lang].exhale);
                    await new Promise(r => setTimeout(r, 3000));
                }

                state.breathActive = false;
            };

            loop();
        },

        stop() {
            this.active = false;
            state.silenceActive = false;

            UI.show("breath", false);
            Mission.next();
        }
    };

    // ==========================================
    // 📂 MISSION SAFE
    // ==========================================
    const Mission = {

        async next() {

            try {
                const res = await fetch("/api/mission/next");
                const m = await res.json();

                state.mission = m;
                state.missionId = m.id;

                this.render(m);

            } catch {}
        },

        render(m) {

            UI.set("story", m.blocks[0].text[state.lang]);
            UI.set("analysis", m.blocks[1].text[state.lang]);

            setTimeout(() => {
                UI.renderOptions(m.blocks[2].options);
            }, 4000);

            Speech.say(m.blocks[0].text[state.lang]);
        }
    };

    // ==========================================
    // 🚀 INIT SAFE
    // ==========================================
    function init() {

        player.name = "Player";
        player.hero = "Kamizen";

        AudioSystem.init();
        Floating.start();
        UI.updateTop();

        Mission.next();
    }

    return {
        init,
        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
            UI.updateTop();
        },
        restart() {
            location.reload();
        }
    };

})();

window.onload = null;
