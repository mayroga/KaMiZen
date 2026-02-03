import React, { useEffect } from "react";

// --- Función para reproducir sonido en background ---
async function playBackgroundSound(layers) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    for (const layer of layers) {
      fetch(`/sounds/${layer.name}.mp3`)
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = layer.volume;
          source.loop = layer.loop;
          source.connect(gainNode).connect(audioCtx.destination);
          source.start(0);
        });
    }
  } catch (err) {
    console.warn("Error al cargar audio de fondo:", err);
  }
}

// --- Componente animaciones del preload ---
const PreloadAnimation = () => {
  const clouds = [];
  const particles = [];

  for (let i = 0; i < 5; i++) {
    const top = Math.random() * 50;
    const left = Math.random() * 100;
    const size = 50 + Math.random() * 50;
    clouds.push(
      <div
        key={i}
        style={{
          position: "absolute",
          top: `${top}%`,
          left: `${left}%`,
          width: `${size}px`,
          height: `${size / 2}px`,
          background: "rgba(255,255,255,0.3)",
          borderRadius: "50%",
          animation: `cloudMove ${20 + Math.random() * 10}s linear infinite`,
        }}
      ></div>
    );
  }

  for (let i = 0; i < 15; i++) {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    particles.push(
      <div
        key={i}
        style={{
          position: "absolute",
          top: `${top}%`,
          left: `${left}%`,
          width: "4px",
          height: "4px",
          background: "white",
          borderRadius: "50%",
          animation: `particleMove ${5 + Math.random() * 5}s linear infinite alternate`,
        }}
      ></div>
    );
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "linear-gradient(to top, #223344, #445566)",
        }}
      ></div>
      {clouds}
      {particles}
    </>
  );
};

export default function LoadingScreen({ onReady }) {
  useEffect(() => {
    // --- Audio opcional de fondo ---
    playBackgroundSound([{ name: "ambient", volume: 0.3, loop: true }]);

    // --- Simular fetch inicial en background ---
    fetch(`/init?user_id=guest&lang=es`)
      .then(res => res.json())
      .then(data => {
        console.log("Datos iniciales cargados:", data);
        // Espera 1s extra para transición suave
        setTimeout(() => onReady(data), 1000);
      })
      .catch(err => {
        console.warn("Error cargando init:", err);
        onReady(null);
      });
  }, [onReady]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <PreloadAnimation />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          width: "100%",
          textAlign: "center",
          color: "white",
          fontSize: "1.8em",
        }}
      >
        🌿 Relájate... Cargando experiencia 🌿
      </div>
    </div>
  );
}
