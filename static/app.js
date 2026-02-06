// ================== Canvas avanzado KaMiZen ==================
let canvas, ctx;
let elements = [];
let mysteryElement = null;

function initCanvas(){
  canvas = document.getElementById("kaCanvas");
  ctx = canvas.getContext("2d");
  initElements();
  animateCanvas();
}

function initElements(){
  elements = [];

  // Sol y Luna animados
  elements.push({type:'sun', x:100, y:100, radius:50});
  elements.push({type:'moon', x:1100, y:100, radius:40});

  // Estrellas
  for(let i=0;i<100;i++){
    elements.push({type:'star', x:Math.random()*1200, y:Math.random()*700, radius:Math.random()*2+1, blink:Math.random()*0.05+0.01});
  }

  // Lluvia
  for(let i=0;i<50;i++){
    elements.push({type:'rain', x:Math.random()*1200, y:Math.random()*700, speed:Math.random()*2+1});
  }

  // Figuras 3D simuladas
  for(let i=0;i<20;i++){
    elements.push({type:'shape', x:Math.random()*1200, y:Math.random()*700, size:Math.random()*40+10, color:`hsl(${Math.random()*360}, 80%, 50%)`});
  }

  // Misterio diario
  mysteryElement = {x: Math.random()*1200, y:Math.random()*700, size:30, visible:true};
}

// ================= Animaciones Canvas =================
function animateCanvas(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  let hour = new Date().getHours();

  // Fondo dinámico según hora
  if(hour>=6 && hour<12){
    ctx.fillStyle = 'linear-gradient(#FFE4B5, #87CEEB)'; // amanecer
    ctx.fillRect(0,0,canvas.width,canvas.height);
  } else if(hour>=12 && hour<18){
    ctx.fillStyle = 'linear-gradient(#87CEEB, #FFD700)'; // tarde
    ctx.fillRect(0,0,canvas.width,canvas.height);
  } else {
    ctx.fillStyle = '#001'; // noche
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  // Dibujar elementos
  elements.forEach(el=>{
    switch(el.type){
      case 'sun':
        ctx.fillStyle='yellow';
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.radius,0,2*Math.PI);
        ctx.fill();
        break;
      case 'moon':
        ctx.fillStyle='rgba(230,230,250,0.8)';
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.radius,0,2*Math.PI);
        ctx.fill();
        break;
      case 'star':
        ctx.fillStyle='white';
        ctx.globalAlpha = Math.abs(Math.sin(Date.now()*el.blink));
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.radius,0,2*Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      case 'rain':
        ctx.strokeStyle='rgba(173,216,230,0.5)';
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x, el.y+10);
        ctx.stroke();
        el.y += el.speed;
        if(el.y>canvas.height) el.y=0;
        break;
      case 'shape':
        ctx.fillStyle=el.color;
        ctx.fillRect(el.x, el.y, el.size, el.size);
        break;
    }
  });

  // Misterio diario sutil
  if(mysteryElement.visible && Math.random()<0.01){
    ctx.fillStyle='rgba(255,0,0,0.3)';
    ctx.fillRect(mysteryElement.x, mysteryElement.y, mysteryElement.size, mysteryElement.size);
  }

  requestAnimationFrame(animateCanvas);
}

// ================= Efectos según microacciones =================
function updateCanvasOnAction(action){
  switch(action){
    case 'respiración consciente':
      elements.forEach(el=>{ if(el.type==='star') el.blink+=0.01;});
      break;
    case 'mini estiramiento':
      elements.forEach(el=>{ if(el.type==='shape') el.size +=2;});
      break;
    default:
      break;
  }
}
