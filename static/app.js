let lang = "es";
let level = "day";
let uid = "";

// Cambiar idioma
function setLang(l){
  lang = l;
  speechSynthesis.cancel();
}

// Voz general (Nivel 1)
function speak(text){
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = lang==="es"?"es-ES":"en-US";
  msg.voice = speechSynthesis.getVoices().find(v=>v.lang.includes(msg.lang));
  speechSynthesis.speak(msg);
}

// Iniciar vida (comunicarse con backend)
async function startLife(){
  const age = document.getElementById("age").value;
  const mood = document.getElementById("mood").value;
  const city = document.getElementById("city").value;

  const res = await fetch("/life/guide",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({age,mood,lang,level,city})
  });

  const data = await res.json();
  uid = data.session_id;
  speak(data.message);
  moveAvatar();
}

// Stripe payment
async function pay(lvl){
  level = lvl;
  const price = lvl==="day"?9.99:99.99;

  const res = await fetch("/create-checkout-session",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      level:lvl,
      price:price,
      success:window.location.href,
      cancel:window.location.href
    })
  });

  const data = await res.json();
  window.location.href = data.url;
}

// Cargar Nivel 2
function loadLevel2(){
  resetAvatarLevel2();
  generateLifeMapLevel2();
  drawMapLevel2();
  startTimelineLevel2();
}
