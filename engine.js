/**
 * 🧠 KAMIZEN ENGINE STABLE CORE (NO FREEZE BUILD)
 */

const KamizenEngine = (() => {

    // ==========================================
    // 📊 STATE (CLEAN + NO OVERLOAD)
    // ==========================================
    const state = {
        score: 0,
        focus: 100,
        energy: 100,
        lang: "en",
        mission: null,
        missionId: 1,
        locked: false,
        silenceActive: false,

        timers: {
            float: null,
            silence: null
        }
    };

    const player = { name: "", hero: "" };

    // ==========================================
    // 🔒 LOCK (NO FREEZE BODY)
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
    // 🗣️ SPEECH ANTI-SPAM (CLAVE PARA NO FREEZE)
    // ==========================================
    const Speech = {
        last: 0,
        say(text) {
            const now = Date.now();
            if (now - this.last < 1200) return; // 🔥 ANTI FREEZE REAL
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
    // 🖥️ UI SAFE ACCESS
    // ==========================================
    const UI = {

        get(id) {
            return document.getElementById(id);
        },

        set(id, val) {
            const el = this.get(id);
            if (el) el.textContent = val;
        },

        updateTop() {
            this.set("score-display", `PUNTOS: ${state.score}`);
            this.set("focus-display", `FOCUS: ${state.focus}%`);
            this.set("energy-display", `ENERGY: ${state.energy}`);
        },

        clear(id) {
            const el = this.get(id);
            if (el) el.innerHTML = "";
        },

        show(id, v) {
            const el = this.get(id);
            if (el) el.style.display = v ? "block" : "none";
        },

        renderOptions(options) {
            const c = this.get("options");
            if (!c) return;

            c.innerHTML = "";

            options.forEach(opt => {
                const b = document.createElement("button");
                b.className = "opt-btn";
                b.textContent = opt.text?.[state.lang] || "OPTION";

                b.onclick = () => Decision.handle(opt);

                c.appendChild(b);
            });
        }
    };

    // ==========================================
    // 🎯 FLOATING WORDS (NO OVERLOAD FIX)
    // ==========================================
    const Floating = {

        start() {
            if (state.timers.float) clearInterval(state.timers.float);

            state.timers.float = setInterval(() => {
                if (state.locked || state.silenceActive) return;
                if (document.hidden) return;

                this.spawn();

            }, 2200);
        },

        spawn() {

            const words = ["FOCUS", "TRUTH", "CALM", "POWER", "FEAR", "NOISE"];
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
    // 🎮 DECISION SAFE (NO STACK FREEZE)
    // ==========================================
    const Decision = {

        async handle(opt) {

            if (state.locked) return;

            Lock.on();

            const box = UI.get("explanation-box");
            if (box) box.style.display = "block";

            const txt = opt.explanation?.[state.lang] || "";

            if (opt.correct === true) {
                state.score += 20;
                state.focus += 2;
                state.energy += 2;
                AudioSystem.play("win");
            } else {
                state.score -= 10;
                state.focus -= 2;
                AudioSystem.play("bad");
            }

            UI.updateTop();
            Speech.say(txt);

            if (box) box.textContent = txt;

            await new Promise(r => setTimeout(r, 2000));

            if (box) box.style.display = "none";

            Lock.off();

            Silence.start();
        }
    };

    // ==========================================
    // 🧘 SILENCE SAFE (NO LOOP LOCK)
    // ==========================================
    const Silence = {

        active: false,

        start() {

            if (this.active) return;
            this.active = true;

            state.silenceActive = true;

            UI.clear("options");
            UI.show("breath", true);

            let time = state.missionId <= 7 ? 20 :
                       state.missionId <= 14 ? 180 :
                       state.missionId <= 21 ? 300 : 600;

            if (state.timers.silence) clearInterval(state.timers.silence);

            state.timers.silence = setInterval(() => {

                time--;

                const el = UI.get("analysis");
                if (el) {
                    el.textContent = `SILENCE: ${Math.floor(time/60)}:${String(time%60).padStart(2,"0")}`;
                }

                if (time <= 0) {
                    clearInterval(state.timers.silence);
                    this.stop();
                }

            }, 1000);

            this.breathLoop();
        },

        async breathLoop() {

            const b = UI.get("breath");
            if (!b) return;

            while (this.active) {

                b.style.transform = "scale(2)";
                Speech.say("Inhale");

                await new Promise(r => setTimeout(r, 3000));
                if (!this.active) break;

                b.style.transform = "scale(1)";
                Speech.say("Exhale");

                await new Promise(r => setTimeout(r, 3000));
            }
        },

        stop() {
            this.active = false;
            state.silenceActive = false;

            UI.show("breath", false);

            Mission.next();
        }
    };

    // ==========================================
    // 📂 MISSION SAFE (NO CRASH)
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

            const story = m.blocks?.find(b => b.type === "story")?.text?.[state.lang] || "";
            const analysis = m.blocks?.find(b => b.type === "analysis")?.text?.[state.lang] || "";
            const decision = m.blocks?.find(b => b.type === "decision");

            UI.set("story", story);
            UI.set("analysis", "");

            Speech.say(story);

            setTimeout(() => {
                UI.set("analysis", analysis);
            }, 3000);

            setTimeout(() => {
                if (decision?.options) UI.renderOptions(decision.options);
            }, 6000);
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

window.onload = () => KamizenEngine.init();
