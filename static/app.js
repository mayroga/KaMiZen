let session_id = "";
let map, avatarMarker;

// ================= LOGIN =================
async function login(){
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/admin/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password})
    });

    if(res.ok){
        const data = await res.json();
        alert("Login exitoso: " + data.role);
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("gameArea").style.display = "block";
        startSession();
    } else {
        const err = await res.json();
        alert("Error: " + err.detail);
    }
}

// ================= INICIO DE SESIÓN =================
async function startSession(){
    const res = await fetch("/session/start", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({})
    });
    const data = await res.json();
    session_id = data.session_id;
    speak(data.message);
    initMap();
}

// ================= VOZ =================
function speak(text){
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "es-ES";
    speechSynthesis.speak(msg);
}

// ================= MICROACCIONES =================
async function microAction(action){
    const res = await fetch("/session/action", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({session_id, action})
    });
    const data = await res.json();
    speak(data.message);
}

// ================= MAPA =================
async function initMap(){
    const res = await fetch("/session/map", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({city: "Miami"})
    });
    const data = await res.json();

    map = L.map('map').setView([data.lat, data.lon], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Avatar
    avatarMarker = L.marker([data.lat, data.lon]).addTo(map)
        .bindPopup("Aquí estás")
        .openPopup();
}
