let sesiones = [];
let indexSesion = 0;
let indexBloque = 0;

// Cargar JSON
fetch('static/kamizen_content.json')
  .then(response => response.json())
  .then(data => {
    sesiones = data.sesiones;
    mostrarBloque();
  })
  .catch(err => console.error('Error cargando sesiones:', err));

const bloqueContenido = document.getElementById('bloque-contenido');
const userInput = document.getElementById('user-input');
const btnSiguiente = document.getElementById('siguiente');
const btnRegresar = document.getElementById('regresar');
const btnBorrar = document.getElementById('borrar');

// Función para mostrar bloque actual
function mostrarBloque() {
  if (!sesiones[indexSesion]) return;

  const bloque = sesiones[indexSesion].bloques[indexBloque];
  if (!bloque) return;

  // Limpiar contenido previo
  bloqueContenido.innerHTML = '';
  userInput.value = '';

  let contenido = '';

  switch(bloque.tipo) {
    case 'voz':
    case 'historia':
    case 'escenario':
    case 'reflexion':
      contenido = `<p style="color:${bloque.color}">${bloque.texto || bloque.titulo}</p>`;
      break;
    case 'respiracion':
      contenido = `<p style="color:${bloque.color}">Respiración: ${bloque.instrucciones}</p>`;
      break;
    case 'decision':
      contenido = `<p style="color:${bloque.color}">${bloque.pregunta}</p>`;
      bloque.opciones.forEach((op, i) => {
        contenido += `<p>${i+1}. ${op}</p>`;
      });
      break;
    case 'juego_mental':
      contenido = `<p style="color:${bloque.color}">${bloque.pregunta}</p>`;
      bloque.opciones.forEach((op, i) => {
        contenido += `<p>${i+1}. ${op}</p>`;
      });
      break;
    case 'ejercicio_fisico':
      contenido = `<p style="color:${bloque.color}">${bloque.texto} (Duración: ${bloque.duracion} seg)</p>`;
      break;
    case 'escribir':
      contenido = `<p style="color:${bloque.color}">${bloque.texto}</p>`;
      break;
    case 'tvid':
      contenido = `<p style="color:${bloque.color}"><strong>${bloque.nombre}</strong>: ${bloque.instrucciones}</p>`;
      break;
    default:
      contenido = `<p>${JSON.stringify(bloque)}</p>`;
  }

  bloqueContenido.innerHTML = contenido;
}

// Botón Siguiente
btnSiguiente.addEventListener('click', () => {
  const bloque = sesiones[indexSesion].bloques[indexBloque];

  // No se guarda la escritura, solo se limpia automáticamente
  if (userInput.value) {
    console.log('Entrada usuario (solo visual):', userInput.value);
  }

  if (indexBloque < sesiones[indexSesion].bloques.length - 1) {
    indexBloque++;
    mostrarBloque();
  } else if (indexSesion < sesiones.length - 1) {
    indexSesion++;
    indexBloque = 0;
    mostrarBloque();
  } else {
    alert('¡Has completado todas las sesiones!');
    userInput.value = ''; // limpiar escritura final
  }
});

// Botón Regresar
btnRegresar.addEventListener('click', () => {
  if (indexBloque > 0) {
    indexBloque--;
    mostrarBloque();
  } else if (indexSesion > 0) {
    indexSesion--;
    indexBloque = sesiones[indexSesion].bloques.length - 1;
    mostrarBloque();
  }
});

// Botón Borrar
btnBorrar.addEventListener('click', () => {
  userInput.value = '';
});
