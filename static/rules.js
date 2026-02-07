// rules.js
function canShowNext(prevShown) {
    // Evita mostrar varias cosas simultáneamente
    return !prevShown;
}

function sessionEnd(avatar, path) {
    // Asegura llegada al bienestar biopsicosocial
    avatar.x = path[path.length-1].x;
    avatar.y = path[path.length-1].y;
    console.log("Sesión completada: bienestar alcanzado");
}
