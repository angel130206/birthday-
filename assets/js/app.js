/* =========================================================
   APP — merangkai semuanya
   ========================================================= */
(function () {
  "use strict";

  const C = window.BIRTHDAY_CONFIG || {};
  const A = window.BirthdayAudio;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  let opened = false;
  let candlesLit = false;
  let letterOpened = false;
  let ambientTimer = null;

  /* ---------------- util ---------------- */
  function toast(message, duration) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-in");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-in"), duration || 2600);
  }

  function setText(sel, value) {
    const el = $(sel);
    if (el && value != null) el.textContent = value;
  }

  /* ---------------- isi teks dari config ---------------- */
  function applyConfig() {
    const nama = C.nama || "Mama";
    const tanggal = (C.tanggal || "") + (C.tahun ? " " + C.tahun : "");
    const inisial = (C.panggilanSayang || nama).trim().charAt(0).toUpperCase() || "M";

    document.title = "Selamat Ulang Tahun, " + nama + " 🎂";

    setText("#gateName", nama);
    setText("#gateSub", C.pembuka);
    setText("#heroName", nama);
    setText("#outroName", nama);
    setText("#letterTo", nama);
    setText("#sealWax", inisial);
    setText("#brandMark", inisial);
    setText("#footName", nama);
    setText("#footYear", C.tahun || new Date().getFullYear());
    setText("#dateText", tanggal.trim());
    setText("#letterDate", tanggal.trim());
    setText("#tagline", C.tagline);
    setText("#outroSign", "— " + (C.pengirim || "Anakmu"));
    setText("#letterFrom", C.pengirim || "Anakmu");

    // surat
    const body = $("#letterText");
    if (body && Array.isArray(C.surat)) {
      body.innerHTML = "";
      C.surat.forEach((par) => {
        const p = document.createElement("p");
        p.textContent = par;
        body.appendChild(p);
      });
    }
  }

  /* ---------------- lilin ---------------- */
  function buildCandles() {
    const wrap = $("#candles");
    if (!wrap) return;
    const count = Math.max(1, Math.min(7, Number(C.jumlahLilin) || 5));
    wrap.innerHTML = "";
    const heights = [40, 48, 36, 52, 42, 46, 38];
    for (let i = 0; i < count; i++) {
      const c = document.createElement("div");
      c.className = "candle";
      c.style.setProperty("--h", heights[i % heights.length] + "px");
      c.style.animation = "none";
      c.innerHTML = '<span class="candle__flame"></span>';
      wrap.appendChild(c);
    }
  }

  function puffSmoke() {
    $$(".candle", $("#candles")).forEach((c, i) => {
      setTimeout(() => {
        const s = document.createElement("span");
        s.className = "smoke";
        c.appendChild(s);
        setTimeout(() => s.remove(), 2400);
      }, i * 90);
    });
  }

  function toggleCandles(forceLit) {
    const wrap = $("#candles");
    const stage = $(".cake-stage");
    const label = $("#blowLabel");
    const note = $("#cakeNote");
    const wantLit = typeof forceLit === "boolean" ? forceLit : !candlesLit;

    if (wantLit) {
      candlesLit = true;
      wrap.classList.remove("is-out");
      stage.classList.remove("is-out");
      if (label) label.textContent = "Tiup Lilin";
      if (note) {
        note.textContent = "Permohonannya boleh diulang, tidak apa-apa.";
        note.classList.remove("is-bright");
      }
      return;
    }

    candlesLit = false;
    wrap.classList.add("is-out");
    stage.classList.add("is-out");
    puffSmoke();
    if (label) label.textContent = "Nyalakan Lagi";
    if (note) {
      note.textContent = "Semoga yang Mama minta hari ini dikabulkan. 🤍";
      note.classList.add("is-bright");
    }

    if (A) { A.blow(); setTimeout(() => A.chime(), 700); }
    if (window.FX) {
      const rect = $("#cake").getBoundingClientRect();
      setTimeout(() => {
        window.FX.confetti(70);
        window.FX.burstAt(rect.left + rect.width / 2, rect.top + 10, {
          shape: "heart", color: "#ffc2d8", count: 40
        });
      }, 500);
      window.FX.fireworks(3);
    }
    toast("Permohonan Mama sudah terbang ke langit ✨");
  }

  /* ---------------- galeri ---------------- */
  function buildGallery() {
    const wrap = $("#gallery");
    if (!wrap) return;
    const photos = Array.isArray(C.foto) ? C.foto : [];
    wrap.innerHTML = "";

    photos.forEach((item, i) => {
      const btn = document.createElement("button");
      btn.className = "polaroid";
      btn.type = "button";
      btn.setAttribute("aria-label", "Perbesar foto: " + (item.caption || "kenangan"));
      btn.innerHTML =
        '<span class="polaroid__tape" aria-hidden="true"></span>' +
        '<span class="polaroid__frame"><img src="' + item.src + '" alt="' +
        (item.caption || "Kenangan bersama Mama") + '" loading="lazy" /></span>' +
        '<span class="polaroid__cap">' + (item.caption || "") + "</span>" +
        '<span class="polaroid__spark" aria-hidden="true">✨</span>';

      const img = $("img", btn);
      img.addEventListener("error", () => {
        const frame = $(".polaroid__frame", btn);
        frame.style.background = "linear-gradient(150deg, #4a2a52, #7b3f5e 55%, #b5756d)";
        frame.innerHTML =
          '<div style="position:absolute;inset:0;display:grid;place-items:center;font-size:2.4rem;opacity:.8">🌸</div>';
      });

      btn.addEventListener("click", () => openLightbox(item));
      wrap.appendChild(btn);
    });
  }

  function openLightbox(item) {
    const box = $("#lightbox");
    const img = $("#lightboxImg");
    const cap = $("#lightboxCap");
    if (!box) return;
    img.src = item.src;
    img.alt = item.caption || "Kenangan bersama Mama";
    cap.textContent = item.caption || "";
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add("is-in"));
    document.body.classList.add("is-locked");
    if (A) A.paper();
  }

  function closeLightbox() {
    const box = $("#lightbox");
    if (!box || box.hidden) return;
    box.classList.remove("is-in");
    document.body.classList.remove("is-locked");
    setTimeout(() => {
      box.hidden = true;
      $("#lightboxImg").removeAttribute("src");
    }, 380);
  }

  /* ---------------- alasan ---------------- */
  function buildReasons() {
    const wrap = $("#reasons");
    if (!wrap) return;
    wrap.innerHTML = "";
    (C.alasan || []).forEach((r, i) => {
      const card = document.createElement("article");
      card.className = "reason";
      card.style.transitionDelay = Math.min(i * 90, 540) + "ms";
      card.innerHTML =
        '<div class="reason__icon" aria-hidden="true">' + (r.ikon || "💛") + "</div>" +
        '<h3 class="reason__title">' + (r.judul || "") + "</h3>" +
        '<p class="reason__text">' + (r.isi || "") + "</p>";
      wrap.appendChild(card);
    });
  }

  /* ---------------- doa / lentera ---------------- */
  const WISH_KEY = "birthday-wishes-v1";

  function loadWishes() {
    try {
      const raw = localStorage.getItem(WISH_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(-14) : [];
    } catch (e) {
      return [];
    }
  }

  function saveWishes(list) {
    try {
      localStorage.setItem(WISH_KEY, JSON.stringify(list.slice(-20)));
    } catch (e) { /* diam saja */ }
  }

  let wishes = [];

  function renderWish(text, animate) {
    const list = $("#wishes");
    if (!list) return;
    const li = document.createElement("li");
    li.className = "wish";
    if (!animate) li.style.animation = "none";
    li.innerHTML = "<span aria-hidden=\"true\">🏮</span>" + escapeHtml(text);
    list.appendChild(li);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[s]));
  }

  function initWishes() {
    wishes = loadWishes();
    const seed = Array.isArray(C.doaAwal) ? C.doaAwal : [];
    seed.forEach((w) => renderWish(w, false));
    wishes.forEach((w) => renderWish(w, false));

    const form = $("#wishForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#wishInput");
      const value = (input.value || "").trim();
      if (!value) {
        input.focus();
        toast("Tulis dulu doanya ya 🤍");
        return;
      }

      renderWish(value, true);
      wishes.push(value);
      saveWishes(wishes);
      input.value = "";

      if (A) { A.chime(); A.launch(); }
      if (window.FX) {
        window.FX.lanterns(3);
        const r = form.getBoundingClientRect();
        window.FX.burstAt(r.left + r.width / 2, r.top, { shape: "ring", color: "#ffd88a", count: 34 });
      }
      toast("Lentera doanya sudah dilepas 🏮");
    });
  }

  /* ---------------- pembuka ---------------- */
  function openGate() {
    if (opened) return;
    opened = true;

    const gift = $("#giftBtn");
    const gate = $("#gate");

    if (A) { A.ensure(); A.pop(); }
    if (gift) gift.classList.add("is-open");

    if (window.FX) {
      const rect = gift ? gift.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setTimeout(() => window.FX.burstAt(cx, cy, { shape: "sphere", color: "#ffe6bb", count: 60 }), 180);
      setTimeout(() => window.FX.confetti(70), 260);
      setTimeout(() => window.FX.fireworks(4), 420);
    }

    setTimeout(() => {
      document.body.classList.remove("is-locked");
      document.body.classList.add("is-open");
      if (gate) gate.classList.add("is-leaving");
      window.scrollTo(0, 0);
      initReveal();
      setTimeout(() => {
        if (gate) {
          gate.setAttribute("inert", "");
          gate.setAttribute("aria-hidden", "true");
        }
      }, 1300);
    }, 620);

    // musik mulai setelah gesture pengguna
    setTimeout(() => {
      if (!A) return;
      const ok = A.playMusic();
      const btn = $("#musicBtn");
      if (btn) btn.setAttribute("aria-pressed", ok ? "true" : "false");
    }, 300);

    setTimeout(() => {
      toast("Ketuk di mana saja di langit untuk meluncurkan kembang api ✨", 4000);
      startAmbient();
    }, 2600);
  }

  function startAmbient() {
    if (reduceMotion) return;
    clearTimeout(ambientTimer);

    const loop = () => {
      if (document.hidden) {
        ambientTimer = setTimeout(loop, 5000);
        return;
      }
      if (opened && window.FX) {
        window.FX.fireworks(1);
        if (Math.random() < 0.28) window.FX.lanterns(1);
      }
      ambientTimer = setTimeout(loop, 4600 + Math.random() * 5200);
    };
    ambientTimer = setTimeout(loop, 3200);
  }

  /* ---------------- event ---------------- */
  function bindEvents() {
    const gift = $("#giftBtn");
    if (gift) gift.addEventListener("click", openGate);

    const blowBtn = $("#blowBtn");
    if (blowBtn) blowBtn.addEventListener("click", () => {
      candlesLit = !$("#candles").classList.contains("is-out");
      toggleCandles(!candlesLit);
    });

    const sealBtn = $("#sealBtn");
    if (sealBtn) sealBtn.addEventListener("click", () => {
      const env = $("#envelope");
      letterOpened = !env.classList.contains("is-open");
      env.classList.toggle("is-open", letterOpened);
      sealBtn.setAttribute("aria-expanded", letterOpened ? "true" : "false");
      if (A) A.paper();
      if (letterOpened) {
        toast("Suratnya dibuka perlahan... 💌");
        setTimeout(() => {
          const y = env.getBoundingClientRect().top + window.scrollY - 90;
          window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
        }, 420);
      }
    });

    const burstBtn = $("#burstBtn");
    if (burstBtn) burstBtn.addEventListener("click", () => {
      if (A) A.launch();
      if (window.FX) window.FX.fireworks(3);
      toast("Kembang api untuk Mama 🎆");
    });

    const finaleBtn = $("#finaleBtn");
    if (finaleBtn) finaleBtn.addEventListener("click", () => {
      if (A) { A.chime(); A.launch(); }
      if (window.FX) window.FX.finale();
      toast("Selamat ulang tahun, Mama! 🎉", 3200);
    });

    const replayBtn = $("#replayBtn");
    if (replayBtn) replayBtn.addEventListener("click", () => {
      document.body.style.transition = "opacity .6s";
      document.body.style.opacity = "0";
      setTimeout(() => window.location.reload(), 620);
    });

    const musicBtn = $("#musicBtn");
    if (musicBtn) musicBtn.addEventListener("click", () => {
      if (!A) return;
      if (A.isPlaying()) {
        A.stopMusic();
        musicBtn.setAttribute("aria-pressed", "false");
      } else {
        A.playMusic();
        musicBtn.setAttribute("aria-pressed", "true");
      }
    });

    const closeBtn = $("#lightboxClose");
    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    const box = $("#lightbox");
    if (box) box.addEventListener("click", (e) => {
      if (e.target === box) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });

    // ketuk di mana saja untuk kembang api (abaikan kalau sedang menggulir)
    let downAt = null;
    window.addEventListener("pointerdown", (e) => {
      downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    }, { passive: true });

    window.addEventListener("pointerup", (e) => {
      if (!opened || !downAt) return;
      const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
      const quick = performance.now() - downAt.t < 700;
      downAt = null;
      if (moved > 12 || !quick) return;
      if (e.target.closest("button, a, input, textarea, .lightbox, .envelope__seal, .polaroid")) return;
      if (!window.FX) return;
      if (A) A.launch();
      window.FX.burstAt(e.clientX, e.clientY, { count: 46 });
    }, { passive: true });

    // kilau mengikuti kursor
    if (!isTouch && !reduceMotion && window.FX) {
      let last = 0;
      window.addEventListener("pointermove", (e) => {
        if (!opened) return;
        const now = performance.now();
        if (now - last < 42) return;
        last = now;
        window.FX.sparkle(e.clientX, e.clientY);
      }, { passive: true });
    }
  }

  /* ---------------- reveal saat digulir ---------------- */
  function initReveal() {
    const items = $$("[data-reveal], .reason");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    items.forEach((el) => io.observe(el));
  }

  /* ---------------- mulai ---------------- */
  function init() {
    applyConfig();
    buildCandles();
    buildGallery();
    buildReasons();
    initWishes();
    bindEvents();
    if (window.FX) window.FX.init();

    // elemen gerbang muncul satu per satu
    requestAnimationFrame(() => {
      document.querySelectorAll("#gate .reveal-up").forEach((el) => el.classList.add("is-in"));
    });

    // pembuka: kalau pengguna sudah pernah membuka, tetap tampilkan gerbang
    // (setiap kunjungan harus terasa seperti kejutan pertama)
    if (reduceMotion) {
      // tetap butuh interaksi untuk audio, jadi gerbang tidak dilewati
      document.querySelectorAll("#gate .reveal-up").forEach((el) => el.classList.add("is-in"));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
