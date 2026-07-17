/* ═══════════════════════════════════════════════
   JACOB1K — scroll engine
   Lenis smooth scroll + canvas frame scrub
   ═══════════════════════════════════════════════ */

(() => {
  "use strict";

  /* ── config ─────────────────────────────── */
  const FRAME_COUNT = 129; // set by build after ffmpeg extraction
  const FRAME_PATH = (i) => `assets/frames/frame_${String(i + 1).padStart(4, "0")}.jpg`;

  /* ── dom ────────────────────────────────── */
  const loader = document.getElementById("loader");
  const loaderPct = document.getElementById("loader-pct");
  const loaderBar = document.getElementById("loader-bar");
  const nav = document.getElementById("nav");
  const canvas = document.getElementById("orbit-canvas");
  const ctx = canvas.getContext("2d");
  const heroSection = document.getElementById("hero-scrub");
  const heroLetters = [...document.querySelectorAll(".hero-name .ltr")];
  const heroSub = document.getElementById("hero-sub");
  const heroTitle = document.getElementById("hero-title");
  const heroCue = document.getElementById("hero-scrollcue");
  const hudFrame = document.getElementById("hud-frame");
  const pillarsSection = document.getElementById("pillars");
  const pillars = [...document.querySelectorAll(".pillar")];
  const pillarsProgress = document.getElementById("pillars-progress");
  const pillarsVideo = document.getElementById("pillars-video");
  const workVideo = document.getElementById("work-video");

  /* ── frame preload ──────────────────────── */
  const frames = new Array(FRAME_COUNT);
  let loaded = 0;

  const updateLoader = () => {
    const pct = Math.round((loaded / FRAME_COUNT) * 100);
    loaderPct.textContent = pct + "%";
    loaderBar.style.width = pct + "%";
  };

  const preload = () =>
    new Promise((resolve) => {
      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        img.src = FRAME_PATH(i);
        const done = () => {
          loaded++;
          updateLoader();
          if (loaded === FRAME_COUNT) resolve();
        };
        img.onload = done;
        img.onerror = done;
        frames[i] = img;
      }
    });

  /* ── canvas ─────────────────────────────── */
  let cw = 0, ch = 0, dpr = 1;
  const sizeCanvas = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = window.innerWidth;
    ch = window.innerHeight;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  let currentFrame = -1;
  const drawFrame = (index, force = false) => {
    if (!force && index === currentFrame) return;
    const img = frames[index];
    if (!img || !img.naturalWidth) return;
    currentFrame = index;
    // cover fit
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    hudFrame.textContent = `FR ${String(index + 1).padStart(3, "0")}/${String(FRAME_COUNT).padStart(3, "0")}`;
  };

  /* ── helpers ────────────────────────────── */
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  // progress of a pinned section: 0 when its top hits viewport top, 1 when its end unpins
  const pinProgress = (el, scrollY, vh) => {
    const top = el.offsetTop;
    const range = el.offsetHeight - vh;
    return clamp01((scrollY - top) / range);
  };
  const remap = (v, a, b) => clamp01((v - a) / (b - a));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /* ── scroll choreography ────────────────── */
  let vh = window.innerHeight;
  let scrollY = 0;
  let needsDraw = true;
  let introP = 0; // post-loader auto track-in; scroll takes over past it

  const update = () => {
    // nav
    nav.classList.toggle("scrolled", scrollY > 40);

    /* ACT I — orbit scrub + kinetic title */
    const hp = pinProgress(heroSection, scrollY, vh);
    drawFrame(Math.min(FRAME_COUNT - 1, Math.floor(hp * FRAME_COUNT)));

    // letters track in one-by-one over p 0 → 0.34
    const eff = Math.max(hp, introP * 0.45);
    heroLetters.forEach((ltr, i) => {
      const t = easeOut(remap(eff, 0.02 + i * 0.028, 0.14 + i * 0.028));
      ltr.style.opacity = t;
      ltr.style.transform = `translateY(${(1 - t) * 0.35}em) rotate(${(1 - t) * 4}deg)`;
      ltr.style.filter = `blur(${(1 - t) * 10}px)`;
    });

    // subtitle
    const st = easeOut(remap(eff, 0.3, 0.42));
    heroSub.style.opacity = st;
    heroSub.style.transform = `translateY(${(1 - st) * 1.2}rem)`;
    heroSub.style.letterSpacing = `${0.42 + (1 - st) * 0.3}em`;

    // exit: title drifts up + fades near the end of the orbit
    const ex = remap(hp, 0.8, 0.98);
    heroTitle.style.opacity = 1 - ex;
    heroTitle.style.transform = `translateY(${-ex * 18}vh) scale(${1 + ex * 0.06})`;

    heroCue.style.opacity = hp > 0.04 ? 0 : 1;

    /* ACT III — pillars, one at a time */
    const pp = pinProgress(pillarsSection, scrollY, vh);
    pillarsProgress.style.width = pp * 100 + "%";
    // thirds with small dead-zones so each pillar holds
    const active = pp < 1 / 3 ? 0 : pp < 2 / 3 ? 1 : 2;
    pillars.forEach((p, i) => p.classList.toggle("active", i === active));
  };

  /* ── lenis ──────────────────────────────── */
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on("scroll", (e) => {
    scrollY = e.scroll;
    needsDraw = true;
  });

  const raf = (time) => {
    lenis.raf(time);
    if (needsDraw) {
      needsDraw = false;
      update();
    }
    requestAnimationFrame(raf);
  };

  /* ── anchor scrolls ─────────────────────── */
  document.querySelectorAll("[data-scrollto]").forEach((a) => {
    a.addEventListener("click", (ev) => {
      const target = a.getAttribute("href");
      if (target && target.startsWith("#")) {
        ev.preventDefault();
        lenis.scrollTo(target === "#top" ? 0 : target, { duration: 1.6 });
      }
    });
  });

  /* ── lightbox ───────────────────────────── */
  const lightbox = document.getElementById("lightbox");
  const lightboxFrame = document.getElementById("lightbox-frame");

  const openLightbox = (videoId) => {
    lightboxFrame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1" title="Jacob1K video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    lenis.stop();
  };
  const closeLightbox = () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxFrame.innerHTML = ""; // kills playback
    lenis.start();
  };

  document.querySelectorAll(".work-card[data-video]").forEach((card) => {
    card.addEventListener("click", (ev) => {
      ev.preventDefault();
      openLightbox(card.dataset.video);
    });
  });
  lightbox.querySelectorAll("[data-lightbox-close]").forEach((el) =>
    el.addEventListener("click", closeLightbox)
  );
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
  });

  /* ── contact modal ──────────────────────── */
  const contactModal = document.getElementById("contact-modal");
  const contactForm = document.getElementById("contact-form");
  const contactNote = document.getElementById("contact-note");
  const contactSuccess = document.getElementById("contact-success");
  const CONTACT_NOTE_DEFAULT = contactNote.textContent;

  const resetContactView = () => {
    contactForm.hidden = false;
    contactSuccess.hidden = true;
    contactForm.reset();
    contactNote.classList.remove("contact-note-error");
    contactNote.textContent = CONTACT_NOTE_DEFAULT;
    const sendBtn = contactForm.querySelector(".contact-send");
    sendBtn.disabled = false;
    sendBtn.textContent = "Send message";
  };

  const openContact = () => {
    contactModal.classList.add("open");
    contactModal.setAttribute("aria-hidden", "false");
    lenis.stop();
    if (contactSuccess.hidden) {
      setTimeout(() => contactForm.elements.name.focus(), 300);
    }
  };
  const closeContact = () => {
    contactModal.classList.remove("open");
    contactModal.setAttribute("aria-hidden", "true");
    lenis.start();
    if (!contactSuccess.hidden) {
      setTimeout(resetContactView, 400);
    }
  };

  document.querySelectorAll("[data-contact-open]").forEach((btn) =>
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      openContact();
    })
  );
  contactModal.querySelectorAll("[data-contact-close]").forEach((el) =>
    el.addEventListener("click", closeContact)
  );
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && contactModal.classList.contains("open")) closeContact();
  });

  contactForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const sendBtn = contactForm.querySelector(".contact-send");
    const { name, email, message, company } = contactForm.elements;

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending…";
    contactNote.classList.remove("contact-note-error");
    contactNote.textContent = "SENDING YOUR MESSAGE…";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.value,
          email: email.value,
          message: message.value,
          company: company.value, // honeypot — always empty for real visitors
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "");

      contactForm.hidden = true;
      contactSuccess.hidden = false;
      contactSuccess.querySelector(".contact-success-close").focus();
    } catch (err) {
      contactNote.classList.add("contact-note-error");
      contactNote.textContent = err.message || "SOMETHING WENT WRONG · EMAIL JACOB@JACOB1K.COM DIRECTLY";
      sendBtn.disabled = false;
      sendBtn.textContent = "Send message";
    }
  });

  /* ── reveals ────────────────────────────── */
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      }),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ── stagger sibling reveals ────────────── */
  document.querySelectorAll(".work-grid, .faq-list, .manifesto-line, .finale-title").forEach((group) => {
    [...group.children].forEach((child, i) => {
      if (child.classList.contains("reveal")) child.style.transitionDelay = i * 0.09 + "s";
    });
  });

  /* ── bg videos: play only in view ───────── */
  const vio = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        const v = en.target;
        if (en.isIntersecting) v.play().catch(() => {});
        else v.pause();
      }),
    { rootMargin: "200px" }
  );
  [pillarsVideo, workVideo].forEach((v) => v && vio.observe(v));

  /* ── resize ─────────────────────────────── */
  window.addEventListener("resize", () => {
    vh = window.innerHeight;
    sizeCanvas();
    drawFrame(currentFrame < 0 ? 0 : currentFrame, true);
    needsDraw = true;
  });

  /* ── boot ───────────────────────────────── */
  sizeCanvas();
  preload().then(() => {
    drawFrame(0, true);
    loader.classList.add("done");
    document.body.classList.add("ready");
    scrollY = lenis.scroll || window.scrollY || 0;
    needsDraw = true;
    // auto track-in of the title once the loader lifts
    const t0 = performance.now();
    const intro = (now) => {
      introP = Math.min(1, (now - t0 - 350) / 2200);
      needsDraw = true;
      if (introP < 1) requestAnimationFrame(intro);
    };
    requestAnimationFrame(intro);
  });
  requestAnimationFrame(raf);
})();
