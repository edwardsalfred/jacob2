/* ═══════════════════════════════════════════════
   JACOB1K — interior page script
   (articles / privacy / terms — no hero canvas)
   ═══════════════════════════════════════════════ */

(() => {
  "use strict";

  const nav = document.getElementById("nav");

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  lenis.on("scroll", (e) => nav.classList.toggle("scrolled", e.scroll > 40));

  document.querySelectorAll("[data-scrollto]").forEach((a) => {
    a.addEventListener("click", (ev) => {
      const target = a.getAttribute("href");
      if (target && target.startsWith("#")) {
        ev.preventDefault();
        lenis.scrollTo(target === "#top" ? 0 : target, { duration: 1.6 });
      }
    });
  });

  /* ── contact modal ──────────────────────── */
  const contactModal = document.getElementById("contact-modal");
  const contactForm = document.getElementById("contact-form");
  const contactNote = document.getElementById("contact-note");
  const CONTACT_NOTE_DEFAULT = contactNote.textContent;

  const openContact = () => {
    contactModal.classList.add("open");
    contactModal.setAttribute("aria-hidden", "false");
    lenis.stop();
    setTimeout(() => contactForm.elements.name.focus(), 300);
  };
  const closeContact = () => {
    contactModal.classList.remove("open");
    contactModal.setAttribute("aria-hidden", "true");
    lenis.start();
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

      contactNote.textContent = "MESSAGE SENT · I’LL REPLY WITHIN ONE BUSINESS DAY";
      setTimeout(() => {
        closeContact();
        contactForm.reset();
        contactNote.classList.remove("contact-note-error");
        contactNote.textContent = CONTACT_NOTE_DEFAULT;
        sendBtn.disabled = false;
        sendBtn.textContent = "Send message";
      }, 1800);
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

  document.querySelectorAll(".article-grid").forEach((group) => {
    [...group.children].forEach((child, i) => {
      if (child.classList.contains("reveal")) child.style.transitionDelay = i * 0.07 + "s";
    });
  });
})();
