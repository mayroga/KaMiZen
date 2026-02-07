let uid = null;
let lang = "es";
let queue = false;

function speak(text){
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "es" ? "es-ES" : "en-US";
  u.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function startSession(){
  lang = document.getElementById("lang").value;

  fetch("/start",{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      age: age.value,
      profile: profile.value,
      state: state.value,
      lang: lang
    })
  })
  .then(r=>r.json())
  .then(d=>{
    uid = d.uid;
    nextBlock();
  });
}

function nextBlock(){
  if(queue) return;
  queue = true;

  fetch(`/next/${uid}`)
  .then(r=>r.json())
  .then(d=>{
    if(d.end) return;

    renderBlock(d.type, d.content);
    speak(d.content);

    setTimeout(()=>{ queue=false; }, 6000);
  });
}

function renderBlock(type, content){
  const box = document.getElementById("content");
  box.innerHTML = "";

  if(type === "game"){
    const parts = content.split("Respuesta:");
    box.innerHTML = `
      <p>${parts[0]}</p>
      <button onclick="showAnswer('${parts[1] || ""}')">
        Ver respuesta
      </button>`;
  } else {
    box.innerHTML = `<p>${content}</p>`;
  }

  setTimeout(nextBlock, 60000); // flujo 10 min total
}

function showAnswer(ans){
  alert("Respuesta correcta: " + ans);
}
