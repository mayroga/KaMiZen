import React, { useEffect } from "react";

// --- Reproduce sonido de fondo sin bloquear ---
async function playBackgroundSound(layers) {
  if (!layers || layers.length === 0) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    await Promise.all(
      layers.map(async (layer) => {
        const res = await fetch(`/sounds/${layer.name}.mp3`);
        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = layer.loop || false;
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = layer.volume || 1;
        source.connect(gainNode).connect(audioCtx.destination);
        source.start(0);
      })
    );
  } catch (err) {
    console.warn("Error cargando audio de fondo:", err);
  }
}

// --- Animaciones del preload ---
const PreloadAnimation = () => {
  const clouds = [];
  const particles = [];

  for (let i = 0; i < 5; i++) {
    const top = Math.random() * 50;
    const left = Math.random() * 100;
    const size = 50 + Math.random() * 50;
    clouds.push(
      <div
        key={`cloud-${i}`}
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
        key={`particle-${i}`}
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

// --- Componente principal de preload ---
export default function LoadingScreen({ onReady }) {
  useEffect(() => {
    // Reproduce audio de fondo opcional
    playBackgroundSound([{ name: "ambient", volume: 0.3, loop: true }]);

    // Carga datos iniciales
    fetch(`/init?user_id=guest&lang=es`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Datos iniciales cargados:", data);
        // Espera 1s extra para transición suave
        setTimeout(() => onReady(data), 1000);
      })
      .catch((err) => {
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

      {/* Animaciones CSS inline */}
      <style>{`
        @keyframes cloudMove {0%{transform: translateX(-10%);}100%{transform: translateX(110%);}}
        @keyframes particleMove {0%{transform: translateY(0);}100%{transform: translateY(-20px);}}
      `}</style>
    </div>
  );
}
