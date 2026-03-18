// Variables de sesión
let currentId = 0;
let sessions = []; // Aquí se cargará tu kamizen_content.json
let sessionData = []; // Guarda temporalmente inputs del usuario

// Cargar JSON de sesiones al iniciar
fetch('kamizen_content.json')
    .then(response => response.json())
    .then(data => {
        sessions = data;
        // Inicializar sessionData vacío
        sessionData = sessions.map(s => ({ id: s.id, userInput: '' }));
        renderSession(currentId);
    })
    .catch(error => console.error('Error cargando sesiones:', error));

// Función para renderizar una sesión
function renderSession(id) {
    if (id < 0 || id >= sessions.length) return;

    const session = sessions[id];
    const container = document.getElementById('sessionContent');
    container.innerHTML = ''; // Limpiar contenido previo

    // Mostrar categoría
    const cat = document.createElement('h2');
    cat.textContent = session.categoria;
    container.appendChild(cat);

    // Renderizar cada bloque de la sesión
    session.bloques.forEach(bloque => {
        const div = document.createElement('div');
        div.classList.add('session-text');
        div.style.color = bloque.color || '#000';

        switch(bloque.tipo) {
            case 'voz':
            case 'historia':
            case 'escenario':
            case 'reflexion':
                div.textContent = bloque.texto || bloque.titulo || '';
                break;
            case 'respiracion':
                div.innerHTML = `<strong>Respiración:</strong> ${bloque.instrucciones} (${bloque.repeticiones} repeticiones)`;
                break;
            case 'decision':
                div.innerHTML = `<strong>Decisión:</strong> ${bloque.pregunta} Opciones: ${bloque.opciones.join(', ')}`;
                break;
            case 'juego_mental':
                div.innerHTML = `<strong>Juego Mental:</strong> ${bloque.pregunta} Opciones: ${bloque.opciones.join(', ')}`;
                break;
            case 'ejercicio_fisico':
                div.innerHTML = `<strong>Ejercicio Físico:</strong> ${bloque.texto} Duración: ${bloque.duracion} segundos`;
                break;
            default:
                div.textContent = bloque.texto || '';
        }

        container.appendChild(div);
    });

    // Cargar texto previo si existe
    document.getElementById('userInput').value = sessionData[id].userInput || '';
}

// Botón Siguiente
document.getElementById('btnSiguiente').addEventListener('click', () => {
    const input = document.getElementById('userInput');
    
    // Guardar solo si escribió algo
    if (input.value.trim() !== '') {
        sessionData[currentId].userInput = input.value.trim();
    } else {
        sessionData[currentId].userInput = '';
    }

    input.value = ''; // Limpiar input para la siguiente sesión
    currentId++;

    if (currentId < sessions.length) {
        renderSession(currentId);
    } else {
        alert("Has completado la sesión KaMiZen. Todos los datos escritos se eliminarán.");
        // Borrar todos los inputs
        sessionData = sessionData.map(s => ({ id: s.id, userInput: '' }));
        currentId = 0;
        renderSession(currentId);
    }
});

// Botón Regresar
document.getElementById('btnRegresar').addEventListener('click', () => {
    if (currentId > 0) {
        currentId--;
        renderSession(currentId);
    }
});

// Botón Borrar
document.getElementById('btnBorrar').addEventListener('click', () => {
    document.getElementById('userInput').value = '';
    sessionData[currentId].userInput = '';
});
