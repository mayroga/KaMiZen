// src/components/LoadingScreen.jsx
import React, { useEffect, useRef } from "react";
import { Howl } from "howler";
import { useNavigate } from "react-router-dom"; // Para la transición a Nivel 1

const LoadingScreen = () => {
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // =========================
    // 1️⃣ SONIDO DE FONDO
    // =========================
    const sound = new Howl({
      src: ["/sounds/relaxing_loop.mp3"], // Pon aquí tu mp3
      loop: true,
      volume: 0.2,
    });
    sound.play();

    // =========================
    // 2️⃣ FONDO ANIMADO CON PARTICULAS
    // =========================
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
    }));

    const animate = () => {
      // Fondo azul profundo
      ctx.fillStyle = "#0A1E2E";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar partículas
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;
        if (p.y > canvas.height) p.y = 0;
        if (p.y < 0) p.y = canvas.height;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(144,238,144,0.5)"; // Verde suave
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    // =========================
    // 3️⃣ TRANSICIÓN AUTOMÁTICA AL NIVEL 1
    // =========================
    const timer = setTimeout(() => {
      navigate("/nivel1"); // Cambia la ruta según tu app
    }, 4000); // 4 segundos de carga

    // =========================
    // CLEANUP
    // =========================
    return () => {
      clearTimeout(timer);
      sound.stop();
    };
  }, [navigate]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <canvas ref={canvasRef} />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "#d4f0dc",
          fontSize: "2rem",
          fontFamily: "sans-serif",
          textAlign: "center",
          textShadow: "0 0 8px #1f5e1f",
        }}
      >
        🌿 Relájate… Cargando experiencia 🌿
      </div>
    </div>
  );
};

export default LoadingScreen;
