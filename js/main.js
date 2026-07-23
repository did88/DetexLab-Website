(function () {
  "use strict";

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
