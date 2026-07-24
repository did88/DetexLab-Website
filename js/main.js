(function () {
  "use strict";

  const isEnglish = document.documentElement.lang === "en";
  const copy = isEnglish
    ? {
        open: "Open menu",
        close: "Close menu",
        play: "Play",
        pause: "Pause",
        opening: "Opening your email app. If it does not open, email contact@detexlab.com directly.",
        typeFallback: "General inquiry",
        subjectPrefix: "Detex Lab inquiry",
        fields: {
          type: "Inquiry type",
          organization: "Organization / company",
          name: "Contact name",
          email: "Reply email",
          message: "Message"
        }
      }
    : {
        open: "메뉴 열기",
        close: "메뉴 닫기",
        play: "재생",
        pause: "일시정지",
        opening: "이메일 앱을 여는 중입니다. 열리지 않으면 contact@detexlab.com으로 직접 보내 주세요.",
        typeFallback: "일반 문의",
        subjectPrefix: "Detex Lab 문의",
        fields: {
          type: "문의 유형",
          organization: "기관·회사명",
          name: "담당자명",
          email: "회신 이메일",
          message: "문의 내용"
        }
      };

  const header = document.getElementById("siteHeader");
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("primaryNav");
  const backdrop = document.getElementById("menuBackdrop");
  let lastMenuTrigger = null;

  function setBackdropOpen(open) {
    if (!backdrop) return;
    if (open) {
      backdrop.hidden = false;
      requestAnimationFrame(function () {
        backdrop.classList.add("open");
      });
      return;
    }
    backdrop.classList.remove("open");
    backdrop.hidden = true;
  }

  function closeMenu(restoreFocus) {
    if (!toggle || !nav) return;
    const wasOpen = nav.classList.contains("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", copy.open);
    nav.classList.remove("open");
    nav.setAttribute("aria-hidden", window.matchMedia("(max-width: 1040px)").matches ? "true" : "false");
    document.body.classList.remove("menu-open");
    setBackdropOpen(false);
    if (restoreFocus && wasOpen && lastMenuTrigger instanceof HTMLElement) {
      lastMenuTrigger.focus({ preventScroll: true });
    }
  }

  function openMenu() {
    if (!toggle || !nav) return;
    lastMenuTrigger = toggle;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", copy.close);
    nav.classList.add("open");
    nav.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");
    setBackdropOpen(true);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      if (toggle.getAttribute("aria-expanded") === "true") closeMenu(true);
      else openMenu();
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu(false);
      });
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("open")) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      closeMenu(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu(true);
    });

    if (backdrop) backdrop.addEventListener("click", function () { closeMenu(true); });
    window.addEventListener("pageshow", function () { closeMenu(false); });
    window.addEventListener("resize", function () {
      if (!window.matchMedia("(max-width: 1040px)").matches) closeMenu(false);
    }, { passive: true });
    closeMenu(false);
  }

  function updateHeader() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  } else {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
    revealItems.forEach(function (item) { observer.observe(item); });
  }

  document.querySelectorAll("[data-video-player]").forEach(function (player) {
    const video = player.querySelector("video");
    const button = player.querySelector(".video-toggle");
    if (!video || !button) return;

    function sync() {
      const paused = video.paused;
      button.textContent = paused ? copy.play : copy.pause;
      button.setAttribute("aria-label", paused ? copy.play : copy.pause);
    }

    function fallback() {
      player.classList.add("video-failed");
      button.hidden = true;
      video.pause();
    }

    button.addEventListener("click", function () {
      if (video.paused) video.play().then(sync).catch(fallback);
      else video.pause();
    });
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    video.addEventListener("error", fallback);
    if (reduceMotion) video.pause();
    sync();
  });

  const colorShift = document.getElementById("colorShift");
  if (colorShift) {
    colorShift.setAttribute("role", "button");
    colorShift.setAttribute("tabindex", "0");
    colorShift.setAttribute("aria-pressed", "true");
    colorShift.classList.add("is-active");
    function toggleColorShift() {
      const active = colorShift.classList.toggle("is-active");
      colorShift.setAttribute("aria-pressed", String(active));
    }
    colorShift.addEventListener("click", toggleColorShift);
    colorShift.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleColorShift();
    });
  }

  const inquiryType = document.getElementById("inquiryType");
  document.querySelectorAll("[data-inquiry]").forEach(function (link) {
    link.addEventListener("click", function () {
      if (!inquiryType) return;
      const requested = link.getAttribute("data-inquiry");
      if (Array.from(inquiryType.options).some(function (option) { return option.value === requested; })) {
        inquiryType.value = requested;
        inquiryType.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });

  const form = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const typeSelect = form.querySelector("#inquiryType");
      const selectedType = typeSelect && typeSelect.selectedOptions.length
        ? typeSelect.selectedOptions[0].textContent.trim()
        : copy.typeFallback;
      const organization = String(data.get("organization") || "").trim();
      const contactName = String(data.get("contactName") || "").trim();
      const contactEmail = String(data.get("contactEmail") || "").trim();
      const message = String(data.get("message") || "").trim();

      const subject = "[" + copy.subjectPrefix + "] " + selectedType + " - " + organization;
      const body = [
        copy.fields.type + ": " + selectedType,
        copy.fields.organization + ": " + organization,
        copy.fields.name + ": " + contactName,
        copy.fields.email + ": " + contactEmail,
        "",
        copy.fields.message + ":",
        message
      ].join("\n");
      const mailto = "mailto:contact@detexlab.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      form.dataset.mailto = mailto;

      if (formStatus) {
        formStatus.innerHTML = "";
        formStatus.append(document.createTextNode(copy.opening + " "));
        const directLink = document.createElement("a");
        directLink.className = "direct-email-link";
        directLink.href = "mailto:contact@detexlab.com";
        directLink.textContent = "contact@detexlab.com";
        formStatus.appendChild(directLink);
      }

      const mailEvent = new CustomEvent("detex:mailto", {
        bubbles: true,
        cancelable: true,
        detail: { url: mailto, subject: subject, body: body }
      });
      if (form.dispatchEvent(mailEvent)) window.location.href = mailto;
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
