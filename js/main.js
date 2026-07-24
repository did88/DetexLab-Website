(function () {
  "use strict";

  const lang = document.documentElement.lang === "en" ? "en" : "ko";
  const text = lang === "en"
    ? { open: "Open menu", close: "Close menu", play: "Play", pause: "Pause" }
    : { open: "메뉴 열기", close: "메뉴 닫기", play: "재생", pause: "일시정지" };

  if (document.body.classList.contains("detex-signal-system")) {
    const style = document.createElement("style");
    style.textContent = `
      html, body { max-width: 100%; overflow-x: clip; }
      .detex-signal-system .site-header {
        top: 14px !important;
        right: auto !important;
        left: 50% !important;
        width: min(calc(100% - 48px), 1760px) !important;
        max-width: none !important;
        margin: 0 !important;
        overflow: visible !important;
        transform: translateX(-50%) !important;
      }
      .detex-signal-system .container,
      .detex-signal-system .header-inner,
      .detex-signal-system .hero-layout,
      .detex-content-page .content-hero-layout,
      .campaign-template-page .campaign-hero-layout {
        width: min(calc(100% - 64px), 1640px) !important;
        margin-inline: auto !important;
      }
      .detex-signal-system .hero-copy,
      .detex-signal-system .hero-visual,
      .detex-content-page .content-hero-copy,
      .detex-content-page .content-hero-media,
      .campaign-template-page .campaign-copy,
      .campaign-template-page .campaign-hero-media { min-width: 0; }
      @media (max-width: 1280px) {
        .detex-signal-system .container,
        .detex-signal-system .header-inner,
        .detex-signal-system .hero-layout,
        .detex-content-page .content-hero-layout,
        .campaign-template-page .campaign-hero-layout {
          width: min(calc(100% - 48px), 1180px) !important;
        }
      }
      @media (max-width: 1040px) {
        .detex-signal-system .site-header,
        .detex-signal-system .site-header.scrolled {
          top: 8px !important;
          right: 8px !important;
          left: 8px !important;
          width: auto !important;
          color: var(--ink) !important;
          background: #fff !important;
          border-color: rgba(11, 43, 86, .14) !important;
          box-shadow: 0 12px 34px rgba(4, 18, 38, .12) !important;
          transform: none !important;
        }
        .detex-signal-system .container,
        .detex-signal-system .header-inner,
        .detex-signal-system .hero-layout,
        .detex-content-page .content-hero-layout,
        .campaign-template-page .campaign-hero-layout {
          width: min(calc(100% - 32px), 1180px) !important;
        }
        .detex-signal-system .brand-logo-header-on-dark { display: none !important; }
        .detex-signal-system .brand-logo-header-on-light { display: block !important; }
        .detex-signal-system .primary-nav {
          position: fixed !important;
          top: 86px !important;
          right: 8px !important;
          bottom: auto !important;
          left: 8px !important;
          z-index: 120 !important;
          width: auto !important;
          max-height: calc(100dvh - 102px) !important;
          padding: 14px 22px 24px !important;
          overflow-y: auto !important;
          color: var(--ink) !important;
          background: #fff !important;
          border: 1px solid rgba(11, 43, 86, .14) !important;
          border-radius: 12px !important;
          box-shadow: 0 24px 64px rgba(4, 18, 38, .22) !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transform: translateY(-12px) !important;
        }
        .detex-signal-system .primary-nav.open {
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: auto !important;
          transform: translateY(0) !important;
        }
      }
      @media (max-width: 680px) {
        .detex-signal-system .site-header,
        .detex-signal-system .site-header.scrolled {
          top: 6px !important; right: 6px !important; left: 6px !important;
        }
        .detex-signal-system .header-inner {
          width: calc(100% - 20px) !important;
          min-height: 64px !important;
          gap: 10px !important;
        }
        .detex-signal-system .brand-logo-header {
          height: 27px !important;
          max-width: 148px !important;
        }
        .detex-signal-system .primary-nav {
          top: 76px !important;
          right: 6px !important;
          left: 6px !important;
          max-height: calc(100dvh - 88px) !important;
        }
      }
    `;
    document.head.appendChild(style);

    const home = lang === "en" ? "index-en.html" : "index.html";
    const label = lang === "en" ? "Detex Lab home" : "Detex Lab 홈";
    document.querySelectorAll(".brand-logo-swap, .brand-logo-footer").forEach(function (logo) {
      if (logo.closest("a")) return;
      const link = document.createElement("a");
      if (logo.classList.contains("brand-logo-swap")) link.className = "wordmark";
      link.href = home;
      link.setAttribute("aria-label", label);
      logo.replaceWith(link);
      link.appendChild(logo);
    });
  }

  document.querySelectorAll(".reveal").forEach(function (el) {
    el.classList.add("is-visible");
  });

  const header = document.getElementById("siteHeader");
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("primaryNav");

  function closeMenu() {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", text.open);
    nav.classList.remove("open");
    document.body.classList.remove("menu-open");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      const open = toggle.getAttribute("aria-expanded") === "true";
      if (open) return closeMenu();
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", text.close);
      nav.classList.add("open");
      document.body.classList.add("menu-open");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("open") || nav.contains(event.target) || toggle.contains(event.target)) return;
      closeMenu();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });
    window.addEventListener("pageshow", closeMenu);
    closeMenu();
  }

  function updateHeader() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  document.querySelectorAll("[data-video-player]").forEach(function (player) {
    const video = player.querySelector("video");
    const button = player.querySelector(".video-toggle");
    if (!video || !button) return;
    function sync() { button.textContent = video.paused ? text.play : text.pause; }
    button.addEventListener("click", function () {
      if (video.paused) video.play().catch(sync); else video.pause();
    });
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    sync();
  });

  const colorShift = document.getElementById("colorShift");
  if (colorShift) colorShift.classList.add("is-active");

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
