/**
 * 🧠 KAMIZEN ENGINE CORE — CEREBRO PURO
 * Sin DOM. Sin UI. Sin duplicación. Solo lógica.
 */

const KamizenEngine = (() => {

    // ==========================================
    // 📊 STATE GLOBAL (Single Source of Truth)
    // ==========================================
    const state = {
        score: 0,
        energy: 100,
        lang: "en",
        missionId: 1,
        mission: null,
        silenceActive: false,
        silenceTime: 180
    };

    // ==========================================
    // 🔊 EVENT BUS (comunicación con UI)
    // ==========================================
    const Events = {
        emit(name, data) {
            window.dispatchEvent(new CustomEvent(name, { detail: data }));
        }
    };

    // ==========================================
    // 🗣️ SPEECH (solo lógica, no DOM control)
    // ==========================================
    const Speech = {
        say(text) {
            Events.emit("speech", {
                text,
                lang: state.lang
            });
        }
    };

    // ==========================================
    // 🔊 AUDIO (solo eventos)
    // ==========================================
    const AudioSystem = {
        play(type) {
            Events.emit("audio", { type });
        }
    };

    // ==========================================
    // 🎯 FLOATING LOGIC (solo decisiones, NO DOM)
    // ==========================================
    const FloatingLogic = {

        psychology: {
            CRITERION: "Decision power: leader mindset.",
            STRATEGY: "You attract strong allies.",
            WISDOM: "Financial freedom mindset.",
            COURAGE: "Courage builds respect.",
            LOYALTY: "Real support system.",
            CALM: "Control through breathing.",

            APPROVAL: "Approval destroys identity.",
            IMPULSE: "Impulse weakens control.",
            VICTIM: "Victim mindset removes power.",
            SPEND: "Impulse spending creates dependency.",
            DISTRACTION: "You lose purpose.",
            EGO: "Fear of opinion kills dreams.",

            OPPORTUNITY: "Opportunities move fast.",
            TIME: "Time is your most valuable asset.",
            PHONE: "Device can control you.",
            SCREEN: "Screen addiction risk.",
            NOISE: "Distraction pulls you away."
        },

        generate() {
            const r = Math.random();

            if (r > 0.9) {
                return {
                    type: "trap",
                    value: -20,
                    words: ["PHONE", "SCREEN", "NOISE"]
                };
            }

            if (r > 0.6) {
                return {
                    type: "positive",
                    value: 20,
                    words: ["CRITERION", "STRATEGY", "OPPORTUNITY", "TIME"]
                };
            }

            return {
                type: "negative",
                value: -10,
                words: ["IMPULSE", "EGO", "VICTIM", "DISTRACTION"]
            };
        },

        resolve(word, config) {
            state.score += config.value;

            AudioSystem.play(
                config.value > 0 ? "win" : "bad"
            );

            Speech.say(
                (config.type === "trap" ? "Trap. " : "") +
                (this.psychology[word] || "")
            );

            Events.emit("score:update", state.score);
        }
    };

    // ==========================================
    // 🎮 DECISION ENGINE (sin UI)
    // ==========================================
    const Decision = {

        select(option) {

            const result = {
                correct: option.correct,
                explanation: option.explanation?.[state.lang] || ""
            };

            if (result.correct) {
                state.score += 20;
                AudioSystem.play("win");
                Speech.say("Correct. " + result.explanation);
            } else {
                state.score -= 10;
                AudioSystem.play("bad");
                Speech.say("Careful. " + result.explanation);
            }

            Events.emit("decision:result", result);
        }
    };

    // ==========================================
    // 🧘 SILENCE SYSTEM (solo lógica)
    // ==========================================
    const Silence = {

        start() {
            state.silenceActive = true;

            Events.emit("silence:start", {
                duration: state.silenceTime
            });

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
            state.silenceTime = Math.min(state.silenceTime + 60, 1200);

            Events.emit("silence:complete", {
                nextDuration: state.silenceTime
            });

            Mission.next();
        }
    };

    // ==========================================
    // 📂 MISSION SYSTEM (solo data)
    // ==========================================
    const Mission = {

        async next() {
            try {

                const res = await fetch("/api/mission/next");
                const data = await res.json();

                state.mission = data;

                Events.emit("mission:load", data);

            } catch (e) {
                Events.emit("error", e);
            }
        }
    };

    // ==========================================
    // 🚀 PUBLIC API
    // ==========================================
    return {
        init() {
            Mission.next();
        },

        state,

        Decision,
        Silence,
        FloatingLogic,
        Speech,
        AudioSystem,
        Mission
    };

})();

window.onload = () => KamizenEngine.init();
