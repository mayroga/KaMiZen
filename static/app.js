let uid=null;
let lang="es";
let voice;

function loadVoice(){
  const voices = speechSynthesis.getVoices();
  voice = voices.find(v=>v.lang.startsWith(lang)) || voices[0];
}
speechSynthesis.onvoiceschanged = loadVoice;

function speak(text, pace){
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang==="es"?"es-ES":"en-US";
  u.voice = voice;
  u.rate = pace==="slow"?0.85:1;
  speechSynthesis.speak(u);
}

function acceptLegal(){
  legal.style.display="none";
  intro.style.display="block";
}

function begin(){
  lang = langSelect.value;

  fetch("/start",{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      age:age.value,
      lang:lang,
      profile:profile.value,
      duration:parseInt(duration.value)
    })
  }).then(r=>r.json()).then(d=>{
    uid=d.uid;
    intro.style.display="none";
    run();
  });
}

function run(){
  const interval = 10000;
  const timer = setInterval(()=>{
    fetch(`/step/${uid}`).then(r=>r.json()).then(d=>{
      if(d.end){ clearInterval(timer); return; }

      speak(d.welcome, d.voice_pace);
      renderText(d);
      moveMap(
        d.map.move,
        d.map.mini_world,
        d.map.obstacle,
        d.map.choice,
        d.mini_game
      );
    });
  }, interval);
}

function renderText(d){
  floatingText.innerHTML = `
    <p>${d.welcome}</p>
    <p>${d.validation}</p>
    <p>${d.story}</p>
    <p>${d.companion}</p>
    <p><b>${d.action}</b></p>
  `;
}

function showMiniGame(game){
  miniGame.innerHTML = `
    <p>${game.question}</p>
    <button onclick="resolveMiniGame(true,${game.correct_answer})">✔</button>
    <button onclick="resolveMiniGame(false,${game.correct_answer})">✖</button>
  `;
}

function resolveMiniGame(ans, correct){
  miniGame.innerHTML = ans===correct
    ? "<p>Correcto. Continúa.</p>"
    : "<p>Observa. La respuesta estaba ahí.</p>";
}
