// ================== Canvas Avanzado KaMiZen 3D/4D ==================
let canvas, ctx;
let elements = [];
let mysteryElement = null;
let floatingPhrases = [];

function initCanvas() {
  canvas = document.getElementById("kaCanvas");
  ctx = canvas.getContext("2d");
  initElements();
  animateCanvas();
  initFloatingPhrases();
}

// ================= Inicializar elementos dinámicos =================
function initElements() {
  elements = [];

  // Sol y Luna animados
  elements.push({ type: 'sun', x: 100, y: 100, radius: 50, color: 'yellow' });
  elements.push({ type: 'moon', x: 1100, y: 100, radius: 40, color: 'rgba(230,230,250,0.8)' });

  // Estrellas parpadeantes
  for (let i = 0; i < 120; i++) {
    elements.push({
      type: 'star',
      x: Math.random() * 1200,
      y: Math.random() * 700,
      radius: Math.random() * 2 + 1,
      blink: Math.random() * 0.05 + 0.01
    });
  }

  // Lluvia suave
  for (let i = 0; i < 70; i++) {
    elements.push({
      type: 'rain',
      x: Math.random() * 1200,
      y: Math.random() * 700,
      speed: Math.random() * 2 + 1
    });
  }

  // Figuras 3D simuladas con color dinámico
  for (let i = 0; i < 30; i++) {
    elements.push({
      type: 'shape',
      x: Math.random() * 1200,
      y: Math.random() * 700,
      size: Math.random() * 40 + 10,
      color: `hsl(${Math.random() * 360}, 80%, 50%)`
    });
  }

  // Misterio diario sutil
  mysteryElement = { x: Math.random() * 1200, y: Math.random() * 700, size: 30, visible: true };
}

// ================= Inicializar frases flotantes =================
function initFloatingPhrases() {
  floatingPhrases = [
    "Bebe agua y mantente hidratado",
    "Respira profundamente y relájate",
    "Recuerda tus metas y avances",
    "Disfruta el momento presente",
    "La alegría se multiplica al compartirla",
    "Cada microacción cuenta",
    "Hoy es un buen día para crecer",
    "Observa tu entorno y respira",
    "Sonríe, aunque sea pequeño el motivo",
    "Aprende algo nuevo cada hora",
    "Un pequeño desafío fortalece tu mente"
  ];
}

// ================= Animación principal =================
function animateCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let hour = new Date().getHours();

  // Fondo dinámico con gradientes según hora
  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (hour >= 6 && hour < 12) {
    gradient.addColorStop(0, '#FFE4B5'); // amanecer
    gradient.addColorStop(1, '#87CEEB');
  } else if (hour >= 12 && hour < 18) {
    gradient.addColorStop(0, '#87CEEB'); // tarde
    gradient.addColorStop(1, '#FFD700');
  } else {
    gradient.addColorStop(0, '#000022'); // noche
    gradient.addColorStop(1, '#001');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dibujar elementos
  elements.forEach(el => {
    switch (el.type) {
      case 'sun':
      case 'moon':
        ctx.fillStyle = el.color;
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.radius, 0, 2 * Math.PI);
        ctx.fill();
        // Oscilación ligera para animar movimiento
        el.y += Math.sin(Date.now() / 1000 + el.x) * 0.1;
        break;

      case 'star':
        ctx.fillStyle = 'white';
        ctx.globalAlpha = Math.abs(Math.sin(Date.now() * el.blink));
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;

      case 'rain':
        ctx.strokeStyle = 'rgba(173,216,230,0.5)';
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x, el.y + 10);
        ctx.stroke();
        el.y += el.speed;
        if (el.y > canvas.height) el.y = 0;
        break;

      case 'shape':
        ctx.fillStyle = el.color;
        ctx.fillRect(el.x, el.y, el.size, el.size);
        el.x += Math.sin(Date.now() / 500) * 0.2; // movimiento dinámico
        el.y += Math.cos(Date.now() / 500) * 0.2;
        break;
    }
  });

  // Misterio diario sutil
  if (mysteryElement.visible && Math.random() < 0.01) {
    ctx.fillStyle = 'rgba(255,0,0,0.3)';
    ctx.fillRect(mysteryElement.x, mysteryElement.y, mysteryElement.size, mysteryElement.size);
  }

  requestAnimationFrame(animateCanvas);
}

// ================= Efectos de microacciones =================
function updateCanvasOnAction(action) {
  switch (action) {
    case 'respiración consciente':
      elements.forEach(el => { if (el.type === 'star') el.blink += 0.01; });
      break;
    case 'mini estiramiento':
      elements.forEach(el => { if (el.type === 'shape') el.size += 2; });
      break;
    default:
      break;
  }
}

// ================= Frases flotantes dinámicas =================
function showFloatingPhrases() {
  const container = document.getElementById("floatingPhrases");
  container.innerHTML = "";
  floatingPhrases.forEach((p, i) => {
    const span = document.createElement("span");
    span.textContent = p;
    span.style.position = "absolute";
    span.style.top = `${Math.random() * 500}px`;
    span.style.left = `${Math.random() * 800}px`;
    span.style.fontSize = `${14 + Math.random() * 12}px`;
    span.style.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
    span.style.opacity = Math.random() * 0.8 + 0.2;
    span.style.fontWeight = "600";
    span.style.transition = "all 1s ease-in-out";
    container.appendChild(span);
  });
}
setInterval(showFloatingPhrases, 15000);
