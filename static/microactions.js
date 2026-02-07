// microactions.js
let microactions = [
    { name: "respirar", effect: "calma" },
    { name: "estirarse", effect: "energia" },
    { name: "cerrar_ojos", effect: "relax" }
];

function performMicroaction(action, visualModule) {
    console.log(`Microacción realizada: ${action.name}`);
    // Cambia colores, luz o partículas
    if(visualModule) visualModule.triggerEffect(action.effect);
}
