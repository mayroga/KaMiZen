// =========================
// CANVAS PRINCIPAL DE KAMIZEN
// =========================
const canvas = document.getElementById("ai-canvas");
const ctx = canvas.getContext("2d");
let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;
window.onresize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
};

// Variables globales para animaciones
let t = 0, p = 0, e = 0, phase = 0, depth = 0;
let clouds = [], stars = [], fog = [];

// =========================
// CAPÍTULO 1 – Amanecer Interior
// =========================
function renderChapter1(config) {
    clouds = Array.from({ length: 20 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height / 2,
        r: 50 + Math.random() * 80,
        v: 0.2 + Math.random() * 0.5
    }));

    function draw1() {
        t += 0.002;
        phase += 0.02;

        // Fondo dinámico
        const g = ctx.createLinearGradient(0, 0, 0, height);
        g.addColorStop(0, `hsl(${Math.random()*360},60%,${40 + 20 * Math.sin(t)}%)`);
        g.addColorStop(1, config.background || "#1a1a2e");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);

        // Sol animado
        ctx.beginPath();
        ctx.arc(width / 2, height * 0.65 - Math.sin(t) * 40, 80, 0, Math.PI * 2);
        ctx.fillStyle = config.accent || "rgba(255,200,120,0.8)";
        ctx.fill();

        requestAnimationFrame(draw1);
    }

    draw1();
}

// =========================
// CAPÍTULO 2 – El mundo te escucha
// =========================
function renderChapter2(config) {
    stars = Array.from({ length: 40 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        a: Math.random()
    }));

    let thoughts = Array.from({ length: 30 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        v: 0.2 + Math.random()
    }));

    function draw2() {
        t += 0.003;
        p += 0.04;
        e += 0.05;
        depth += 0.001;

        // Fondo noche
        ctx.fillStyle = config.background || "#02010a";
        ctx.fillRect(0, 0, width, height);

        // Luna
        ctx.beginPath();
        ctx.arc(width * 0.7, height * 0.3, 60 + Math.sin(t) * 5, 0, Math.PI * 2);
        ctx.fillStyle = config.accent || "rgba(220,220,255,0.6)";
        ctx.fill();

        // Estrellas lentas
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            s.a += 0.002;
            if (s.a > 1) s.a = 0;
            ctx.fillStyle = `rgba(255,255,255,${s.a})`;
            ctx.fillRect(s.x, s.y, 2, 2);
        }

        // Respiración líquida
        for (let i = 0; i < 50; i++) {
            ctx.beginPath();
            ctx.arc(i * 30, height / 2 + Math.sin(p + i) * 40, 20, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0,150,255,0.15)";
            ctx.fill();
        }

        // Pensamientos que pasan
        thoughts.forEach(th => {
            ctx.beginPath();
            ctx.arc(th.x, th.y, 25, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.04)";
            ctx.fill();
            th.y -= th.v;
            if (th.y < 0) th.y = height;
        });

        // Energía interna
        for (let i = 0; i < 60; i++) {
            ctx.fillStyle = "rgba(255,80,0,0.12)";
            ctx.fillRect(width / 2 + Math.sin(e + i) * 100, height / 2 - Math.random() * 200, 4, 20);
        }

        // Continuidad
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 100 + depth * 30, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.stroke();

        requestAnimationFrame(draw2);
    }

    draw2();
}

// =========================
// CAPÍTULO 3 – Mundos finales
// =========================
function renderChapter3(config) {
    fog = Array.from({ length: 30 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 100 + Math.random() * 200,
        v: 0.1 + Math.random() * 0.3
    }));

    stars = Array.from({ length: 100 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        v: 0.05 + Math.random() * 0.2
    }));

    function draw3() {
        t += 0.003;
        p += 0.015;

        // Fondo
        const g = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
        g.addColorStop(0, config.background || "#1b263b");
        g.addColorStop(1, config.accent || "#03071e");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);

        // Niebla
        fog.forEach(f => {
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.02)";
            ctx.fill();
            f.x += f.v;
            if (f.x - f.r > width) f.x = -f.r;
        });

        // Estrellas
        stars.forEach(s => {
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.fillRect(s.x, s.y, 2, 2);
            s.y += s.v;
            if (s.y > height) s.y = 0;
        });

        requestAnimationFrame(draw3);
    }

    draw3();
}
