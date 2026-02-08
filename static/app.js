let map, marker, avatarPos = [0,0];

// ================= LOGIN =================
async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/login", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({username, password})
    });

    const data = await res.json();
    if(res.ok && data.success){
        alert("Login exitoso");
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("gameArea").style.display = "block";
    } else {
        alert(data.detail);
    }
}

// ================= INICIO SESIÓN =================
async function startSession() {
    const city = document.getElementById("city").value;
    const level = "day"; // puedes cambiar según botón

    const res = await fetch("/start_session", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({level, city})
    });

    const data = await res.json();
    if(data.success){
        initMap(data.city);
        alert(data.message);
    } else {
        alert("Error iniciando sesión");
    }
}

// ================= MAPA LEAFLET =================
function initMap(city){
    map = L.map('map').setView([0,0], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    // Obtener coordenadas de ciudad con Nominatim
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city}`)
        .then(res => res.json())
        .then(data => {
            if(data.length>0){
                const loc = data[0];
                const lat = parseFloat(loc.lat);
                const lon = parseFloat(loc.lon);
                map.setView([lat, lon], 15);
                avatarPos = [lat, lon];
                marker = L.marker([lat, lon]).addTo(map);
            }
        });
}

// ================= AVATAR =================
function moveAvatar(){
    if(!marker) return;
    avatarPos[0] += 0.0005; // simple walking animation
    avatarPos[1] += 0.0005;
    marker.setLatLng(avatarPos);
}
