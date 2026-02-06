let uid = null;
let lang = "es";
let voice;

function loadVoice(){
  const voices = speechSynthesis.getVoices();
  voice = voices.find(v => v.lang.startsWith(lang) && v.name.toLowerCase().includes("male")) || voices[0];
}
speechSynthesis.onvoiceschanged = loadVoice;

function speak(text){
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "es" ? "es-ES" : "en-US";
  u.voice = voice;
  u.rate = 0.95;
  speechSynthesis.speak(u);
}

function begin(){
  lang = document.getElementById("lang").value;
  fetch("/start",{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      city:city.value,
      age:age.value,
      profile:profile.value,
      mode:"day",
      lang:lang
    })
  })
  .then(r=>r.json())
  .then(d=>{
    uid = d.uid;
    document.getElementById("intro").style.display="none";
    run();
  });
}

function run(){
  setInterval(()=>{
    fetch(`/step/${uid}`)
    .then(r=>r.json())
    .then(d=>{
      speak(d.text);
      animateText(d.text, d.micro_story, d.life_action);
      moveMap(d.move, d.mini_world, d.obstacle, d.choice, d.mini_game);
    });
  }, 8000);
}

function animateText(text, story, action){
  const el = document.getElementById("floatingText");
  el.innerHTML = `<p>${text}</p><p>${story}</p><p>${action}</p>`;
  el.className = "glow";
}

function showMiniGame(game){
  const mg = document.getElementById("miniGame");
  mg.innerHTML = `<p>${game}</p><button onclick="resolveMiniGame(true)">✔</button><button onclick="resolveMiniGame(false)">✖</button>`;
}

function resolveMiniGame(ans){
  const mg = document.getElementById("miniGame");
  mg.innerHTML = ans ? "<p>¡Bien hecho!</p>" : "<p>Intenta de nuevo</p>";
}
