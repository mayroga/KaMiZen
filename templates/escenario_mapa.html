<!DOCTYPE html>
<html lang="{{ lang }}">
<head>
<meta charset="UTF-8">
<title>KaMiZen Experience</title>

<style>
html, body {
    margin:0;
    height:100%;
    overflow:hidden;
    background:black;
    font-family:Georgia, serif;
    color:white;
}

#bg {
    position:absolute;
    width:120%;
    height:120%;
    top:-10%;
    left:-10%;
    background-size:cover;
    background-position:center;
    transition:transform 12s ease, filter 6s ease;
    filter:brightness(0.65);
    z-index:1;
}

#walker {
    position:absolute;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    font-size:80px;
    z-index:3;
}

#panel {
    position:absolute;
    bottom:0;
    width:100%;
    background:rgba(0,0,0,0.85);
    padding:20px;
    text-align:center;
    z-index:4;
}

#choices button {
    background:none;
    border:1px solid gold;
    color:white;
    padding:10px 22px;
    margin:6px;
    cursor:pointer;
}
</style>
</head>

<body>

<div id="bg"></div>
<div id="walker">🚶‍♂️</div>

<div id="panel">
    <div id="text">Preparing your journey…</div>
    <div id="choices"></div>
</div>

<audio id="audio"></audio>

<script>
let active = true;

async function updateScene(){
    if(!active) return;

    try{
        const res = await fetch("/api/state");
        const data = await res.json();

        if(!data.texto){
            data.texto = "You are accompanied. Everything is unfolding.";
        }

        document.getElementById("bg").style.backgroundImage =
            `url(${data.bg})`;
        document.getElementById("bg").style.transform = "scale(1.15)";

        document.getElementById("text").innerText = data.texto;

        const choices = document.getElementById("choices");
        choices.innerHTML = "";

        if(data.opciones){
            data.opciones.forEach(o=>{
                const b = document.createElement("button");
                b.innerText = o.texto;
                b.onclick = ()=>choices.innerHTML="";
                choices.appendChild(b);
            });
        }

        if(data.voz){
            const audio = document.getElementById("audio");
            audio.src = "/api/audio?text=" + encodeURIComponent(data.texto);
            audio.play().catch(()=>{});
        }

        if(data.final){
            active = false;
            setTimeout(()=>location.href="/logout", 4000);
        }

    }catch(e){
        console.error(e);
    }
}

updateScene();
setInterval(updateScene, 6000);
</script>

</body>
</html>
