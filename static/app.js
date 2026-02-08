let map, avatarMarker;
let level = "day";

// =================== LOGIN ===================
async function login(){
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/login", {
        method: "POST",
        body: new URLSearchParams({username, password})
    });

    if(res.ok){
        const data = await res.json();
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("gameArea").style.display = "block";
        alert(data.message);
        initMap();
    } else {
        const err = await res.json();
        document.getElementById("loginMessage").innerText = err.detail;
    }
}

// =================== MAPA ===================
function initMap(){
    // Centrar en Miami por defecto
    map = L.map('map').setView([25.7617, -80.1918], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    // Avatar inicial
    const avatarIcon = L.icon({
        iconUrl: '/static/avatar.png', 
        iconSize: [40, 40]
    });
    avatarMarker = L.marker([25.7617, -80.1918], {icon: avatarIcon}).addTo(map);
}

// =================== INICIAR SESIÓN ===================
async function startSession(l){
    level = l;
    const city = prompt("Indica tu ciudad (solo nombre):", "Miami") || "Miami";

    const res = await fetch("/start_session", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({city, level})
    });

    const data = await res.json();
    document.getElementById("aiMessage").innerText = data.ai_message;

    // Simular avatar caminando (simple animación de prueba)
    let lat = map.getCenter().lat;
    let lng = map.getCenter().lng;
    let steps = 10;
    let stepCount = 0;

    const moveAvatar = setInterval(()=>{
        if(stepCount >= steps) { clearInterval(moveAvatar); return; }
        lat += 0.0005;
        lng += 0.0005;
        avatarMarker.setLatLng([lat,lng]);
        stepCount++;
    }, 500);
}
