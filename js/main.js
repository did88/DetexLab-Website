(function () {
  "use strict";

  if (document.body.classList.contains("detex-signal-system")) {
    const responsiveLayoutHotfix = document.createElement("style");
    responsiveLayoutHotfix.id = "detex-responsive-layout-hotfix-v2";
    responsiveLayoutHotfix.textContent = `
      html,
      body {
        max-width: 100%;
        overflow-x: clip;
      }

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
      .campaign-template-page .campaign-hero-media {
        min-width: 0;
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
          border-color: rgba(11, 43, 86, 0.14) !important;
          box-shadow: 0 12px 34px rgba(4, 18, 38, 0.12) !important;
          transform: none !important;
        }

        .detex-signal-system .header-inner {
          width: min(calc(100% - 24px), 1180px) !important;
        }

        .detex-signal-system .brand-logo-header-on-dark {
          display: none !important;
        }

        .detex-signal-system .brand-logo-header-on-light {
          display: block !important;
        }

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
          border: 1px solid rgba(11, 43, 86, 0.14) !important;
          border-radius: 12px !important;
          box-shadow: 0 24px 64px rgba(4, 18, 38, 0.22) !important;
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
          top: 6px !important;
          right: 6px !important;
          left: 6px !important;
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
    document.head.appendChild(responsiveLayoutHotfix);

    const homeHref = document.documentElement.lang === "en" ? "index-en.html" : "index.html";
    const brandLabel = document.documentElement.lang === "en" ? "Detex Lab home" : "Detex Lab 홈";

    document.querySelectorAll(".brand-logo-swap").forEach(function (logoSwap) {
      if (logoSwap.closest("a")) return;
      const brandLink = document.createElement("a");
      brandLink.className = "wordmark";
      brandLink.href = homeHref;
      brandLink.setAttribute("aria-label", brandLabel);
      logoSwap.replaceWith(brandLink);
      brandLink.appendChild(logoSwap);
    });

    document.querySelectorAll(".brand-logo-footer").forEach(function (footerLogo) {
      if (footerLogo.closest("a")) return;
      const brandLink = document.createElement("a");
      brandLink.href = homeHref;
      brandLink.setAttribute("aria-label", brandLabel);
      footerLogo.replaceWith(brandLink);
      brandLink.appendChild(footerLogo);
    });

    document.querySelectorAll(".header-inner, .footer-top").forEach(function (container) {
      Array.from(container.childNodes).forEach(function (node) {
        if (node.nodeType !== Node.TEXT_NODE) return;
        if (/^[\s\u0001\u0003]*$/.test(node.textContent || "")) node.remove();
      });
    });
  }

  const language = document.documentElement.lang === "en" ? "en" : "ko";
  const copy = {
    ko: {
      openMenu: "메뉴 열기",
      closeMenu: "메뉴 닫기",
      play: "재생",
      pause: "일시정지",
      playVideo: "영상 재생",
      pauseVideo: "영상 일시정지",
      formConfirmed:
        "이메일 앱을 열었습니다. 전송 전 받는 사람과 내용을 확인해 주세요.",
    },
    en: {
      openMenu: "Open menu",
      closeMenu: "Close menu",
      play: "Play",
      pause: "Pause",
      playVideo: "Play video",
      pauseVideo: "Pause video",
      formConfirmed:
        "Your email app has been opened. Please review the recipient and message before sending.",
    },
  }[language];

  const header = document.getElementById("siteHeader");
  const menuToggle = document.getElementById("menuToggle");
  const primaryNav = document.getElementById("primaryNav");
  const contactForm = document.getElementById("contactForm");
  const inquiryType = document.getElementById("inquiryType");
  const formStatus = document.getElementById("formStatus");
  const colorShift = document.getElementById("colorShift");
  const videoPlayers = Array.from(
    document.querySelectorAll("[data-video-player]")
  );

  const mobileNavigation = window.matchMedia("(max-width: 1040px)");
  let menuReturnFocus = null;

  function isMenuOpen() {
    return Boolean(
      menuToggle &&
        primaryNav &&
        menuToggle.getAttribute("aria-expanded") === "true"
    );
  }

  function openMenu() {
    if (!menuToggle || !primaryNav) return;
    menuReturnFocus = menuToggle;
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", copy.closeMenu);
    primaryNav.classList.add("open");
    document.body.classList.add("menu-open");

    const firstLink = primaryNav.querySelector("a");
    if (firstLink) {
      window.requestAnimationFrame(function () {
        firstLink.focus();
      });
    }
  }

  function closeMenu(restoreFocus) {
    if (!menuToggle || !primaryNav) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", copy.openMenu);
    primaryNav.classList.remove("open");
    document.body.classList.remove("menu-open");

    if (restoreFocus && menuReturnFocus instanceof HTMLElement) {
      menuReturnFocus.focus();
    }
    menuReturnFocus = null;
  }

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", function () {
      if (isMenuOpen()) {
        closeMenu(false);
      } else {
        openMenu();
      }
    });

    primaryNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu(false);
      });
    });

    window.addEventListener("resize", function () {
      if (!mobileNavigation.matches) closeMenu(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isMenuOpen()) {
        closeMenu(true);
        return;
      }

      if (event.key !== "Tab" || !isMenuOpen()) return;

      const focusable = Array.from(
        primaryNav.querySelectorAll("a[href], button:not([disabled])")
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (
        !isMenuOpen() ||
        primaryNav.contains(event.target) ||
        menuToggle.contains(event.target)
      ) {
        return;
      }
      closeMenu(false);
    });

    closeMenu(false);
    window.addEventListener("pageshow", function () {
      closeMenu(false);
    });
  }

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 24);
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    revealElements.forEach(function (element) {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach(function (element) {
      element.classList.add("is-visible");
    });
  }

  const navLinks = Array.from(document.querySelectorAll(".primary-nav a"));
  const navSections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && navSections.length) {
    const navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            const isActive = link.getAttribute("href") === "#" + entry.target.id;
            link.classList.toggle("active", isActive);
            if (isActive) {
              link.setAttribute("aria-current", "location");
            } else if (link.getAttribute("aria-current") === "location") {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    navSections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  if (colorShift) {
    if ("IntersectionObserver" in window) {
      const colorObserver = new IntersectionObserver(
        function (entries, observer) {
          if (!entries[0].isIntersecting) return;
          colorShift.classList.add("is-active");
          observer.disconnect();
        },
        { threshold: 0.45 }
      );
      colorObserver.observe(colorShift);
    } else {
      colorShift.classList.add("is-active");
    }
  }

  if (videoPlayers.length) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    videoPlayers.forEach(function (player) {
      const video = player.querySelector("video");
      const toggle = player.querySelector(".video-toggle");
      if (!video || !toggle) return;

      let userPaused = reducedMotion.matches;

      function syncVideoButton() {
        const isPaused = video.paused;
        toggle.textContent = isPaused ? copy.play : copy.pause;
        toggle.setAttribute(
          "aria-label",
          isPaused ? copy.playVideo : copy.pauseVideo
        );
      }

      function markVideoUnavailable() {
        player.classList.add("video-unavailable");
        toggle.hidden = true;
      }

      if (userPaused) {
        video.pause();
      }

      toggle.addEventListener("click", function () {
        if (video.paused) {
          userPaused = false;
          video.play().catch(syncVideoButton);
        } else {
          userPaused = true;
          video.pause();
        }
      });

      video.addEventListener("play", syncVideoButton);
      video.addEventListener("pause", syncVideoButton);
      video.addEventListener("error", markVideoUnavailable);
      video.querySelectorAll("source").forEach(function (source) {
        source.addEventListener("error", markVideoUnavailable);
      });

      if (
        video.error ||
        video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
      ) {
        markVideoUnavailable();
      }

      if ("IntersectionObserver" in window && video.hasAttribute("autoplay")) {
        const videoObserver = new IntersectionObserver(
          function (entries) {
            const entry = entries[0];
            if (entry.isIntersecting && !userPaused && !reducedMotion.matches) {
              video.play().catch(syncVideoButton);
            } else if (!entry.isIntersecting) {
              video.pause();
            }
          },
          { threshold: 0.18 }
        );
        videoObserver.observe(player);
      }

      syncVideoButton();
    });
  }

  document.querySelectorAll("[data-inquiry]").forEach(function (link) {
    link.addEventListener("click", function () {
      if (!inquiryType) return;
      inquiryType.value = link.getAttribute("data-inquiry") || "partnership";
    });
  });

  if (contactForm && formStatus) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const data = new FormData(contactForm);
      const inquiryLabels = {
        ko: {
          partnership: "협업 및 파트너십 문의",
          sample: "실증 및 샘플 문의",
          product: "제품 문의",
        },
        en: {
          partnership: "Collaboration & partnership inquiry",
          sample: "Pilot & sample inquiry",
          product: "Product inquiry",
        },
      }[language];
      const inquiry = inquiryLabels[data.get("inquiryType")] || inquiryLabels.partnership;
      const organization = String(data.get("organization") || "").trim();
      const contactName = String(data.get("contactName") || "").trim();
      const contactEmail = String(data.get("contactEmail") || "").trim();
      const message = String(data.get("message") || "").trim();
      const subject = `[Detex Lab] ${inquiry}`;
      const body =
        language === "ko"
          ? [
              `문의 유형: ${inquiry}`,
              `기관·회사명: ${organization || "-"}`,
              `담당자명: ${contactName}`,
              `회신 이메일: ${contactEmail}`,
              "",
              "문의 내용:",
              message,
            ].join("\n")
          : [
              `Inquiry type: ${inquiry}`,
              `Organization: ${organization || "-"}`,
              `Contact name: ${contactName}`,
              `Reply email: ${contactEmail}`,
              "",
              "Message:",
              message,
            ].join("\n");

      window.location.href =
        `mailto:contact@detexlab.com?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;
      formStatus.textContent = copy.formConfirmed;
      formStatus.classList.add("is-confirmed");
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
