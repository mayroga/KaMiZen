/**
 * 🧠 KAMIZEN ENGINE CORE — ALINEADO CON BACKEND FLASK
 */

const KamizenEngine = (() => {

    const state = {
        score: 0,
        lang: "en",
        mission: null,
        silenceActive: false,
        level: 1
    };

    // =========================
    // 🔊 AUDIO
    // =========================
    const Audio = {
        bg: null,
        ok: null,
        bad: null,

        init() {
            this.bg = document.getElementById("bg");
            this.ok = document.getElementById("ok");
            this.bad = document.getElementById("bad");

            this.bg.volume = 0.3;
            this.bg.play().catch(() => {});
        },

        play(type) {
            if (type === "ok") this.ok?.play();
            if (type === "bad") this.bad?.play();
        }
    };

    // =========================
    // 🗣️ VOZ
    // =========================
    const Voice = {
        say(text) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.9;
            speechSynthesis.speak(u);
        }
    };

    // =========================
    // 🖥️ UI
    // =========================
    const UI = {
        set(id, v) {
            const el = document.getElementById(id);
            if (el) el.innerText = v;
        },

        score() {
            this.set("score-display", `PUNTOS: ${state.score}`);
        },

        options(opts) {
            const c = document.getElementById("options");
            c.innerHTML = "";

            opts.forEach(o => {
                const b = document.createElement("button");
                b.className = "opt-btn";
                b.innerText = o.text[state.lang];

                b.onclick = () => Engine.choose(o);

                c.appendChild(b);
            });
        }
    };

    // =========================
    // 🎯 MISIÓN (BACKEND LINK)
    // =========================
    const Mission = {

        async next() {
            const res = await fetch("/api/mission/next");
            const data = await res.json();

            state.mission = data;
            this.render(data);
        },

        async load(id) {
            const res = await fetch(`/api/mission/${id}`);
            const data = await res.json();

            state.mission = data;
            this.render(data);
        },

        render(m) {
            const story = m.blocks.find(b => b.type === "story").text[state.lang];
            const analysis = m.blocks.find(b => b.type === "analysis").text[state.lang];
            const decision = m.blocks.find(b => b.type === "decision");

            UI.set("story", story);
            UI.set("analysis", "");

            Voice.say(story);

            setTimeout(() => {
                UI.set("analysis", analysis);
                Voice.say(analysis);
            }, 3500);

            setTimeout(() => {
                UI.options(decision.options);
            }, 7000);
        }
    };

    // =========================
    // 🎮 DECISIONES
    // =========================
    const Decision = {

        async choose(opt) {

            const box = document.getElementById("explanation-box");
            box.style.display = "block";
            box.innerText = opt.explanation[state.lang];

            if (opt.correct) {
                state.score += 20;
                document.body.style.background = "#003300";
                Audio.play("ok");
                Voice.say("Correct. " + opt.explanation[state.lang]);
            } else {
                state.score -= 10;
                document.body.style.background = "#330000";
                Audio.play("bad");
                Voice.say("Incorrect. " + opt.explanation[state.lang]);
            }

            UI.score();

            setTimeout(() => {
                document.body.style.background = "";
                box.style.display = "none";
                Silence.start();
            }, 4000);
        }
    };

    // =========================
    // 🧘 SILENCIO (BACKEND CONTROLADO)
    // =========================
    const Silence = {

        async start() {
            state.silenceActive = true;

            const res = await fetch(`/api/silence/${state.level}`);
            const data = await res.json();

            const breath = document.getElementById("breath");
            breath.style.display = "block";

            Voice.say("Silence mode activated");

            let t = data.silence_time;

            const timer = setInterval(() => {
                t--;
                if (t <= 0) {
                    clearInterval(timer);
                    this.end();
                }
            }, 1000);
        },

        end() {
            state.silenceActive = false;

            document.getElementById("breath").style.display = "none";

            state.level++;

            Voice.say("Silence complete");

            Mission.next();
        }
    };

    // =========================
    // 🚀 INIT
    // =========================
    const Engine = {

        init() {
            Audio.init();
            Mission.next();
            console.log("KAMIZEN ENGINE READY");
        },

        choose: Decision.choose
    };

    return Engine;

})();

// GLOBAL ACCESS (IMPORTANTE)
window.KamizenEngine = KamizenEngine;
window.toggleLang = () => {
    KamizenEngine.state?.lang;
};
window.onload = () => KamizenEngine.init();
