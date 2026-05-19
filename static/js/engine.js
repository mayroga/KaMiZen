/* =========================================================
   ADD ONLY THIS TO KAMIZEN ENGINE V14
   REAL-TIME MULTILANGUAGE PATCH
   KEEP JSON ONLY IN ENGLISH
   ========================================================= */


/* =========================
   ADD INSIDE state = { }
========================= */

lang: localStorage.getItem("kamizen_lang") || (
    navigator.language.toLowerCase().includes("es")
    ? "es"
    : "en"
),

translationCache: {},


/* =========================================================
   ADD BELOW STATE
========================================================= */

async function tr(text) {

    if (!text) return "";

    // ENGLISH = ORIGINAL
    if (state.lang === "en") return text;

    // CACHE
    const key = state.lang + "_" + text;

    if (state.translationCache[key]) {
        return state.translationCache[key];
    }

    try {

        const url =
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${state.lang}&dt=t&q=${encodeURIComponent(text)}`;

        const res = await fetch(url);

        const data = await res.json();

        const translated =
            data?.[0]
            ?.map(x => x[0])
            ?.join("") || text;

        state.translationCache[key] = translated;

        return translated;

    } catch(err) {

        console.warn("Translation Error:", err);

        return text;
    }
}

function setLang(lang) {

    state.lang = lang;

    localStorage.setItem("kamizen_lang", lang);

    render();
}


/* =========================================================
   REPLACE ONLY showIntro()
========================================================= */

async function showIntro() {

    state.phase = "intro";

    document.getElementById("app").innerHTML = `

        <div class="card center">

            <div style="
                display:flex;
                gap:10px;
                justify-content:center;
                margin-bottom:15px;
            ">

                <button onclick="setLang('en')">
                    ENGLISH
                </button>

                <button onclick="setLang('es')">
                    ESPAÑOL
                </button>

            </div>

            <h1>${await tr("KAMIZEN LIFE SYSTEM")}</h1>

            <p>${await tr("Training • Awareness • Control")}</p>

            <p class="small">
                ${await tr("Range: Missions 1 - 63 Loaded")}
            </p>

            <button onclick="startSystem()">
                ${await tr("CONTINUE MISSION")}
            </button>

            <button
                onclick="restartSystem()"
                style="
                    background:var(--danger);
                    margin-top:10px;
                ">

                ${await tr("RESET PROGRESS")}

            </button>

        </div>
    `;
}


/* =========================================================
   REPLACE narrate()
========================================================= */

function narrate(text, callback) {

    if (!text) {
        if (callback) callback();
        return;
    }

    state.speechLocked = true;

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.lang =
        state.lang === "es"
        ? "es-US"
        : "en-US";

    speech.rate = 0.9;

    speech.onend = () => {

        state.speechLocked = false;

        if (callback) callback();
    };

    window.speechSynthesis.speak(speech);
}


/* =========================================================
   INSIDE render()
   REPLACE STORY HTML SECTION ONLY
========================================================= */

const storyTitle =
    await tr(story.t || "");

const storyBody =
    await tr(story.en || "");

app.innerHTML = navHeader + `

    <div class="card">

        <h2 style="color:var(--primary)">
            ${await tr("STORY")} ${story.id}
        </h2>

        <h3>${storyTitle}</h3>

        <p style="
            font-size:1.1rem;
            line-height:1.6;
        ">
            ${storyBody}
        </p>

    </div>

    <button id="continueBtn" disabled>
        ${await tr("NARRATING...")}
    </button>
`;

narrate(
    `${storyTitle}. ${storyBody}`,
    () => {
        setTimeout(startMission, 1500);
    }
);


/* =========================================================
   INSIDE renderBlock()
   ADD AT TOP
========================================================= */

const TT = async (t) => await tr(t || "");


/* =========================================================
   REPLACE:
   block.tx?.en
   WITH:
========================================================= */

await TT(block.tx?.en)


/* =========================================================
   REPLACE:
   block.story.en
   WITH:
========================================================= */

await TT(block.story.en)


/* =========================================================
   REPLACE QUESTION BLOCK
========================================================= */

if (block.t === "d") {

    const q =
        await TT(block.q?.en || "");

    html += `<div class="card"><h3>${q}</h3>`;

    for (let i = 0; i < block.op.length; i++) {

        const translatedOption =
            await TT(block.op[i]);

        html += `

            <div
                class="answer"
                id="opt-${i}"
                onclick="selectAnswer(
                    ${i},
                    ${block.c},
                    ${JSON.stringify(block.ex).replace(/"/g, '&quot;')}
                )">

                ${translatedOption}

            </div>
        `;
    }

    html += `</div>`;

    const translatedOptions =
        await Promise.all(
            block.op.map(o => TT(o))
        );

    textToRead =
        `${q}. ${
            translatedOptions.join(". ")
        }`;
}


/* =========================================================
   REPLACE selectAnswer()
========================================================= */

async function selectAnswer(
    index,
    correct,
    explanations
) {

    if (state.speechLocked) return;

    const isCorrect =
        index === correct;

    const explanation =
        await tr(
            explanations?.[index] || ""
        );

    const feedbackWrap =
        document.createElement("div");

    feedbackWrap.innerHTML = `

        <div class="card">

            <h3 style="
                color:${
                    isCorrect
                    ? '#22c55e'
                    : '#ef4444'
                }
            ">

                ${
                    isCorrect
                    ? await tr("EXCELLENT!")
                    : await tr("KEEP LEARNING")
                }

            </h3>

            <p>${explanation}</p>

        </div>

        <button id="continueBtn" disabled>
            ${await tr("NARRATING...")}
        </button>
    `;

    document
        .getElementById("app")
        .appendChild(feedbackWrap);

    narrate(explanation, () => {

        unlockContinue(
            state.lang === "es"
            ? "SIGUIENTE"
            : "NEXT STEP",

            nextBlock
        );
    });
}


/* =========================================================
   OPTIONAL:
   INSIDE startGuidedBreathing()
   REPLACE LABELS
========================================================= */

label.innerText =
    inhale
    ? (state.lang === "es" ? "INHALA" : "INHALE")
    : (state.lang === "es" ? "EXHALA" : "EXHALE");


/* =========================================================
   DONE
   NOW:
   ✔ JSON STAYS ENGLISH ONLY
   ✔ REAL-TIME SPANISH FOR MIAMI LATINO PARENTS
   ✔ AUTO VOICE LANGUAGE
   ✔ NO DUPLICATED ES JSON
   ✔ VERY SMALL PATCH
   ✔ ENGINE V14 REMAINS INTACT
   ========================================================= */
