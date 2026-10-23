/* =========================================================
   FX — langit berbintang, kembang api, konfeti, lentera
   Canvas 2D tanpa library. Semua efek bertumpuk di atas konten.
   ========================================================= */
(function () {
  "use strict";

  const skyCanvas = document.getElementById("sky");
  const fxCanvas = document.getElementById("fx");
  if (!skyCanvas || !fxCanvas) return;

  const skyCtx = skyCanvas.getContext("2d");
  const ctx = fxCanvas.getContext("2d");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 720px)").matches;

  let W = 0, H = 0, DPR = 1;
  let stars = [];
  let particles = [];
  let rockets = [];
  let running = true;
  let lastTime = 0;

  const PALETTE = [
    "#ffd88a", "#ffb85c", "#fff3d0", "#ffb3cc", "#ff87ad",
    "#c9b6ff", "#9fdcff", "#ffe2a8", "#ff9e6b"
  ];

  const MAX_PARTICLES = isMobile ? 620 : 1300;

  /* ---------------- setup ---------------- */
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;

    [skyCanvas, fxCanvas].forEach((c) => {
      c.width = Math.floor(W * DPR);
      c.height = Math.floor(H * DPR);
      c.style.width = W + "px";
      c.style.height = H + "px";
    });
    skyCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    buildStars();
  }

  function buildStars() {
    const count = Math.round((W * H) / (isMobile ? 9000 : 5200));
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.25 + 0.28,
        base: Math.random() * 0.55 + 0.18,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.9 + 0.35,
        tint: Math.random() < 0.16 ? "#ffd9a3" : Math.random() < 0.3 ? "#cfd6ff" : "#ffffff"
      });
    }
  }

  /* ---------------- partikel ---------------- */
  function add(p) {
    if (particles.length > MAX_PARTICLES) {
      particles.splice(0, Math.ceil(MAX_PARTICLES * 0.12));
    }
    particles.push(p);
    return p;
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  /* ---------------- kembang api ---------------- */
  function launch(targetX, targetY, opts) {
    opts = opts || {};
    const x = targetX == null ? rand(W * 0.16, W * 0.84) : targetX;
    const ty = targetY == null ? rand(H * 0.12, H * 0.46) : targetY;
    // kecepatan dihitung agar puncaknya tepat di ketinggian target
    const dist = Math.max(140, H + 12 - ty);
    const speed = Math.sqrt(2 * 0.14 * dist) * rand(0.97, 1.05);

    rockets.push({
      x: x,
      y: H + 12,
      tx: x,
      ty: ty,
      vx: rand(-0.22, 0.22),
      vy: -speed,
      hueColor: pick(PALETTE),
      trail: [],
      opts: opts
    });
  }

  function explode(x, y, color, opts) {
    opts = opts || {};
    const shape = opts.shape || pick(["sphere", "sphere", "sphere", "ring", "willow", "heart"]);
    const baseColor = color || pick(PALETTE);
    const scale = isMobile ? 0.78 : 1;
    let count = Math.round((opts.count || rand(48, 82)) * scale);
    count = Math.min(count, 130);

    for (let i = 0; i < count; i++) {
      let angle, speed;
      if (shape === "ring") {
        angle = (i / count) * Math.PI * 2;
        speed = rand(3.4, 4.1) * scale;
      } else if (shape === "willow") {
        angle = rand(0, Math.PI * 2);
        speed = rand(1.4, 3.4) * scale;
      } else if (shape === "heart") {
        const t = (i / count) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        angle = Math.atan2(hy, hx);
        speed = Math.hypot(hx, hy) * 0.24 * scale;
      } else {
        angle = rand(0, Math.PI * 2);
        speed = Math.pow(Math.random(), 0.62) * 5.1 * scale;
      }

      const c = Math.random() < 0.72 ? baseColor : pick(PALETTE);
      add({
        type: "spark",
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: c,
        size: rand(1.1, 2.7) * (isMobile ? 0.9 : 1),
        life: 1,
        decay: shape === "willow" ? rand(0.006, 0.011) : rand(0.009, 0.018),
        gravity: shape === "willow" ? 0.055 : 0.035,
        drag: shape === "willow" ? 0.985 : 0.968,
        twinkle: Math.random() < 0.4,
        px: x, py: y
      });
    }

    // kilau inti
    add({
      type: "flash", x: x, y: y, life: 1, decay: 0.075,
      size: rand(60, 100) * scale, color: baseColor
    });
  }

  function fireworks(rounds, opts) {
    rounds = rounds || 1;
    for (let i = 0; i < rounds; i++) {
      setTimeout(() => launch(null, null, opts), i * rand(140, 430));
    }
  }

  function finale() {
    fireworks(10);
    setTimeout(() => confetti(90), 380);
    setTimeout(() => fireworks(6), 2200);
    setTimeout(() => confetti(70), 3400);
  }

  function burstAt(x, y, opts) {
    explode(x, y, (opts && opts.color) || pick(PALETTE), opts);
  }

  /* ---------------- konfeti ---------------- */
  function confetti(n) {
    const total = Math.round((n || 70) * (isMobile ? 0.65 : 1));
    for (let i = 0; i < total; i++) {
      add({
        type: "confetti",
        x: rand(W * 0.1, W * 0.9),
        y: rand(-H * 0.35, -10),
        vx: rand(-1.1, 1.1),
        vy: rand(1.9, 4.2),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.12, 0.12),
        w: rand(5, 11),
        h: rand(7, 15),
        color: pick(["#ffd88a", "#ffb3cc", "#c9b6ff", "#ffeccb", "#9fdcff", "#ff9e6b"]),
        sway: rand(0.4, 1.5),
        swayPhase: rand(0, Math.PI * 2),
        life: 1,
        decay: rand(0.0022, 0.0045),
        gravity: 0.045,
        drag: 0.995
      });
    }
  }

  /* ---------------- lentera ---------------- */
  function lantern(x, y) {
    add({
      type: "lantern",
      x: x == null ? rand(W * 0.2, W * 0.8) : x,
      y: y == null ? H + 60 : y,
      vx: 0,
      vy: -rand(0.75, 1.2),
      sway: rand(0.5, 1.4),
      swayPhase: rand(0, Math.PI * 2),
      bob: 0,
      scale: rand(0.75, 1.15),
      life: 1,
      decay: 0.0009,
      color: "#ffbf72"
    });
  }

  function lanterns(n) {
    for (let i = 0; i < (n || 3); i++) {
      setTimeout(() => lantern(rand(W * 0.15, W * 0.85), H + 40), i * 280);
    }
  }

  /* ---------------- kilau kursor ---------------- */
  function sparkle(x, y, color) {
    add({
      type: "sparkle",
      x: x + rand(-4, 4),
      y: y + rand(-4, 4),
      vx: rand(-0.35, 0.35),
      vy: rand(-0.9, -0.15),
      color: color || pick(["#ffe1a4", "#fff3d0", "#ffc2d8"]),
      size: rand(1, 2.4),
      life: 1,
      decay: rand(0.016, 0.032),
      drag: 0.96,
      gravity: 0.002
    });
  }

  /* ---------------- gambar ---------------- */
  function drawSpark(p) {
    const a = Math.max(p.life, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = p.color;
    ctx.globalAlpha = a * 0.92;
    ctx.lineWidth = p.size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.px, p.py);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    if (p.twinkle && a > 0.35) {
      ctx.globalAlpha = a * 0.8;
      ctx.fillStyle = "#fffdf6";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawConfetti(p) {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = Math.min(p.life * 1.6, 1);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (0.6 + 0.4 * Math.abs(Math.sin(p.rot * 1.7))));
    ctx.restore();
  }

  function drawLantern(p) {
    const s = p.scale;
    const a = p.life * p.fade;
    ctx.globalCompositeOperation = "lighter";

    // cahaya
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 92 * s);
    g.addColorStop(0, "rgba(255, 190, 110," + (0.5 * a) + ")");
    g.addColorStop(0.45, "rgba(255, 150, 70," + (0.16 * a) + ")");
    g.addColorStop(1, "rgba(255, 120, 40, 0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 92 * s, 0, Math.PI * 2);
    ctx.fill();

    // badan lentera
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = a;
    const w = 22 * s, h = 30 * s;
    ctx.beginPath();
    ctx.moveTo(p.x - w / 2, p.y - h / 2);
    ctx.quadraticCurveTo(p.x, p.y - h * 0.78, p.x + w / 2, p.y - h / 2);
    ctx.lineTo(p.x + w * 0.34, p.y + h / 2);
    ctx.quadraticCurveTo(p.x, p.y + h * 0.66, p.x - w * 0.34, p.y + h / 2);
    ctx.closePath();
    const body = ctx.createLinearGradient(p.x, p.y - h / 2, p.x, p.y + h / 2);
    body.addColorStop(0, "#ffe3ab");
    body.addColorStop(0.55, "#ffb162");
    body.addColorStop(1, "#c9612c");
    ctx.fillStyle = body;
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 245, 220, 0.55)";
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // api kecil di dasar
    ctx.globalAlpha = a * 0.95;
    ctx.fillStyle = "#fff6d8";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + h * 0.34, 3.2 * s, 2.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFlash(p) {
    const a = Math.max(p.life, 0);
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (1.7 - a));
    g.addColorStop(0, "rgba(255, 255, 255," + (0.85 * a) + ")");
    g.addColorStop(0.3, "rgba(255, 226, 175," + (0.4 * a) + ")");
    g.addColorStop(1, "rgba(255, 200, 140, 0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1.7 - a), 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSparkle(p) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = p.life;
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
    grd.addColorStop(0, "rgba(255, 248, 220, 0.95)");
    grd.addColorStop(0.35, p.color);
    grd.addColorStop(1, "rgba(255, 200, 140, 0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---------------- bintang latar ---------------- */
  function drawSky(t) {
    skyCtx.clearRect(0, 0, W, H);
    skyCtx.globalCompositeOperation = "lighter";
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.001 * s.speed + s.phase));
      skyCtx.globalAlpha = s.base * tw;
      skyCtx.fillStyle = s.tint;
      skyCtx.beginPath();
      skyCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      skyCtx.fill();
    }
    skyCtx.globalAlpha = 1;
  }

  /* ---------------- loop ---------------- */
  function frame(t) {
    if (!running) { lastTime = t; requestAnimationFrame(frame); return; }
    const dt = Math.min((t - lastTime) / 16.6667, 2.5) || 1;
    lastTime = t;

    drawSky(t);

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    // roket
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.px = r.x; r.py = r.y;
      r.vy += 0.14 * dt;
      r.x += r.vx * dt;
      r.y += r.vy * dt;

      // jejak
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = r.hueColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(r.px, r.py);
      ctx.lineTo(r.x, r.y);
      ctx.stroke();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#fff4dd";
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2.1, 0, Math.PI * 2);
      ctx.fill();

      if (Math.random() < 0.7) {
        add({
          type: "spark", x: r.x, y: r.y, px: r.x, py: r.y,
          vx: rand(-0.5, 0.5), vy: rand(0.2, 1),
          color: "#ffd9a0", size: rand(0.8, 1.7),
          life: 1, decay: 0.05, gravity: 0.02, drag: 0.97
        });
      }

      if (r.y <= r.ty || r.vy >= 0) {
        explode(r.x, r.y, r.hueColor, r.opts);
        rockets.splice(i, 1);
        if (r.opts && r.opts.onDone) r.opts.onDone();
      }
    }

    // partikel
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      if (p.type === "lantern") {
        p.fade = Math.min(1, (H + 60 - p.y) / (H * 0.35));
        p.swayPhase += 0.014 * dt;
        p.x += Math.sin(p.swayPhase) * p.sway * 0.5 * dt;
        p.y += p.vy * dt;
        drawLantern(p);
        p.life -= p.decay * dt;
        if (p.y < -120 || p.life <= 0) particles.splice(i, 1);
        continue;
      }

      if (p.type === "confetti") {
        p.swayPhase += 0.05 * dt;
        p.vx += Math.sin(p.swayPhase) * 0.03 * dt;
        p.vy = Math.min(p.vy + p.gravity * dt, 3.2);
        p.vx *= 0.995;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        drawConfetti(p);
        if (p.y > H + 40) {
          p.life -= 0.02 * dt;
        } else {
          p.life -= p.decay * dt * 0.35;
        }
        if (p.life <= 0) particles.splice(i, 1);
        continue;
      }

      if (p.type === "flash") {
        drawFlash(p);
        p.life -= p.decay * dt;
        if (p.life <= 0) particles.splice(i, 1);
        continue;
      }

      // sparkle / spark
      p.px = p.x; p.py = p.y;
      p.vx *= Math.pow(p.drag, dt);
      p.vy *= Math.pow(p.drag, dt);
      p.vy += (p.gravity || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === "sparkle") drawSparkle(p); else drawSpark(p);

      p.life -= p.decay * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    requestAnimationFrame(frame);
  }

  /* ---------------- kontrol ---------------- */
  function init() {
    resize();
    window.addEventListener("resize", () => {
      clearTimeout(init._t);
      init._t = setTimeout(resize, 180);
    });
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
    });
    if (!reduceMotion) requestAnimationFrame(frame);
    else drawSky(0);
  }

  window.FX = {
    init,
    fireworks,
    finale,
    confetti,
    lantern,
    lanterns,
    burstAt,
    sparkle,
    launch,
    explode,
    get reduceMotion() { return reduceMotion; }
  };
})();
