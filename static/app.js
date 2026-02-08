async function checkState() {
    const res = await fetch("/state", {
        credentials: "include"
    });
    const data = await res.json();

    if (data.authenticated && data.level === 1) {
        showLevel1();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById("login").classList.remove("hidden");
    document.getElementById("level1").classList.add("hidden");
}

function showLevel1() {
    document.getElementById("login").classList.add("hidden");
    document.getElementById("level1").classList.remove("hidden");
}

async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success) {
        showLevel1();
    } else {
        document.getElementById("loginMsg").innerText = data.message;
    }
}

async function logout() {
    await fetch("/logout", {
        method: "POST",
        credentials: "include"
    });
    showLogin();
}

function microAction(action) {
    if (action === "respirar") {
        alert("Respira profundo");
    }
    if (action === "estirarse") {
        alert("Estírate suavemente");
    }
    if (action === "cerrar_ojos") {
        alert("Cierra los ojos unos segundos");
    }
}

window.onload = checkState;
