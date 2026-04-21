/**
 * 🧠 KAMIZEN ENGINE CORE — AL CIELO FINAL STABLE
 * SINGLE ENGINE (NO DUPLICATES, NO FREEZE)
 */

const KamizenEngine = (() => {

    // ==========================================
    // 📊 STATE
    // ==========================================
    const state = {
        score: 0,
        lang: "en",
        missionId: 1,
        mission: null,
        silenceMinutes: 3,
        locked: false,
        silenceActive: false
    };

    // ==========================================
    // 🔊 AUDIO
    // ==========================================
    const Audio = {
        bg: null, ok: null, bad: null,

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
            if (type === "ok" && this.ok) this.ok.play();
            if (type === "bad" && this.bad) this.bad.play();
        }
    };

    // ==========================================
    // 🗣️ SPEECH (SAFE)
    // ==========================================
    const Speech = {
        say(text) {
            if (!text) return;
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = state.lang === "en" ? "en-US" : "es-ES";
            u.rate = 0.9;
            speechSynthesis.speak(u);
        }
    };

    // ==========================================
    // 🌌 FLOATING
    // ==========================================
    const Floating = {
        start() {
            setInterval(() => {
                if (state.locked || state.silenceActive) return;

                const types = [
                    { cls: "word-good", val: 5, words: ["FOCUS","POWER","TRUTH","CONTROL"] },
                    { cls: "word-bad", val: -10, words: ["FEAR","IMPULSE","LIE","CHAOS"] },
                    { cls: "word-neutral", val: 0, words: ["CITY","WALK","WATCH"] }
                ];

                const t = types[Math.floor(Math.random()*types.length)];
                const el = document.createElement("div");

                el.className = `floating ${t.cls}`;
                el.innerText = t.words[Math.floor(Math.random()*t.words.length)];
                el.style.left = Math.random()*90+"vw";

                el.onclick = () => {
                    state.score += t.val;
                    Audio.play(t.val >= 0 ? "ok" : "bad");
                    UI.updateScore();

                    el.classList.add("blast");
                    setTimeout(() => el.remove(), 300);
                };

                document.body.appendChild(el);

                setTimeout(() => el.remove(), 5000);

            }, 2000);
        }
    };

    // ==========================================
    // 🎯 DECISION
    // ==========================================
    const Decision = {
        handle(opt) {

            if (state.locked) return;
            state.locked = true;

            const box = document.getElementById("explanation-box");
            const text = opt.explanation[state.lang];

            box.innerText = text;
            box.style.display = "block";

            if (opt.correct) {
                state.score += 20;
                Audio.play("ok");
            } else {
                state.score -= 10;
                Audio.play("bad");
            }

            UI.updateScore();
            Speech.say(text);

            setTimeout(() => {
                box.style.display = "none";
                Silence.start();
            }, 5000);
        }
    };

    // ==========================================
    // 🧘 SILENCE SYSTEM
    // ==========================================
    const Silence = {
        start() {

            state.silenceActive = true;

            UI.clearOptions();
            UI.showBreath(true);

            UI.setText("story", `SILENCE: ${state.silenceMinutes} MIN`);
            UI.setText("analysis", "Stay still. Control your breath.");

            Speech.say("Silence challenge started.");

            let seconds = state.silenceMinutes * 60;

            const timer = setInterval(() => {
                seconds--;

                if (seconds <= 0 || !state.silenceActive) {
                    clearInterval(timer);
                    this.end();
                }

            }, 1000);
        },

        end() {
            state.silenceActive = false;

            state.silenceMinutes = Math.min(state.silenceMinutes + 1, 20);

            UI.showBreath(false);

            Speech.say("Challenge complete.");

            Mission.next();
        }
    };

    // ==========================================
    // 📂 MISSION
    // ==========================================
    const Mission = {

        async load() {
            try {
                const res = await fetch(`/api/mission/${state.missionId}`);
                if (!res.ok) throw "fail";

                const data = await res.json();
                state.mission = data;

                this.render(data);

            } catch {
                console.warn("mission error");
            }
        },

        render(m) {

            const story = m.blocks.find(b=>b.type==="story").text[state.lang];
            const analysis = m.blocks.find(b=>b.type==="analysis").text[state.lang];
            const decision = m.blocks.find(b=>b.type==="decision");

            UI.setText("story", story);
            UI.setText("analysis", "");
            UI.clearOptions();
            UI.showBreath(false);

            Speech.say(story);

            setTimeout(()=>{
                UI.setText("analysis", analysis);
                Speech.say(analysis);
            },3000);

            setTimeout(()=>{
                UI.renderOptions(decision.options);
                state.locked = false;
            },6000);
        },

        next() {
            state.missionId++;
            if (state.missionId > 40) state.missionId = 1;
            this.load();
        }
    };

    // ==========================================
    // 🖥️ UI
    // ==========================================
    const UI = {
        setText(id,val){ document.getElementById(id).innerText = val; },
        updateScore(){ this.setText("score-display", `PUNTOS: ${state.score}`); },
        clearOptions(){ document.getElementById("options").innerHTML = ""; },
        showBreath(v){ document.getElementById("breath").style.display = v?"block":"none"; },

        renderOptions(opts){
            const c = document.getElementById("options");
            c.innerHTML = "";

            opts.forEach(opt=>{
                const b = document.createElement("button");
                b.className = "opt-btn";
                b.innerText = opt.text[state.lang];
                b.onclick = ()=>Decision.handle(opt);
                c.appendChild(b);
            });
        }
    };

    // ==========================================
    // 🚀 INIT
    // ==========================================
    return {
        init() {
            Audio.init();
            Floating.start();
            Mission.load();
            console.log("🔥 KAMIZEN READY");
        },
        toggleLang() {
            state.lang = state.lang === "en" ? "es" : "en";
            if (state.mission) Mission.render(state.mission);
        }
    };

})();

window.onload = () => KamizenEngine.init();
