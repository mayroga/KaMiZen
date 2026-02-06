let lang = "en";
let level = "day";

function setLang(l) {
  lang = l;
  speechSynthesis.cancel();
}

function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = lang === "es" ? "es-ES" : "en-US";
  msg.voice = speechSynthesis.getVoices().find(v => v.lang.includes(msg.lang));
  speechSynthesis.speak(msg);
}

async function startLife() {
  const age = document.getElementById("age").value;
  const mood = document.getElementById("mood").value;

  const res = await fetch("/life/guide", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ age, mood, lang, level })
  });

  const data = await res.json();
  speak(data.message);
}

async function pay(lvl) {
  level = lvl;
  const price = lvl === "day" ? 1.69 : 99.0;

  const res = await fetch("/create-checkout-session", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      level: lvl,
      price: price,
      success: window.location.href,
      cancel: window.location.href
    })
  });

  const data = await res.json();
  window.location.href = data.url;
}
