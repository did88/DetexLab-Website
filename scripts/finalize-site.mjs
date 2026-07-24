import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const cacheVersion = "20260725-final";
const officialEmail = "contact@detexlab.com";

const mainJs = String.raw`(function () {
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
`;

const responsiveCss = String.raw`
/* === Responsive source integration: 2026-07-25 === */
html,
body {
  max-width: 100%;
  overflow-x: clip;
}

.detex-signal-system .container,
.detex-signal-system .header-inner,
.detex-signal-system .hero-layout,
.detex-content-page .content-hero-layout,
.campaign-template-page .campaign-hero-layout {
  width: min(calc(100% - 64px), 1440px);
  margin-inline: auto;
}

.detex-signal-system :is(
  .hero-copy,
  .hero-visual,
  .content-hero-copy,
  .content-hero-media,
  .campaign-copy,
  .campaign-hero-media,
  .technology-layout > *,
  .risk-media-grid > *,
  .contact-layout > *,
  .split-heading > *,
  .feature-list > *,
  .footer-top > *
) {
  min-width: 0;
}

.detex-signal-system .site-header {
  top: 14px;
  right: 24px;
  left: 24px;
  width: auto;
  max-width: 1760px;
  margin-inline: auto;
  overflow: visible;
  border-radius: 16px;
  transform: none;
}

.detex-signal-system .header-inner {
  max-width: 1640px;
  padding-inline: 22px;
}

.detex-signal-system .wordmark {
  display: inline-flex;
  flex: 0 1 auto;
  min-width: 142px;
  max-width: 196px;
  align-items: center;
}

.detex-signal-system .brand-logo-swap {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 392 / 84;
}

.detex-signal-system .brand-logo-header,
.detex-signal-system .brand-logo-footer {
  width: 100%;
  height: auto;
  object-fit: contain;
}

.detex-signal-system .brand-logo-header-on-light {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.detex-signal-system .site-header.scrolled .brand-logo-header-on-dark {
  opacity: 0;
}

.detex-signal-system .site-header.scrolled .brand-logo-header-on-light {
  opacity: 1;
}

.detex-signal-system .brand-logo-header-on-dark,
.detex-signal-system .brand-logo-header-on-light {
  transition: opacity 180ms ease;
}

.detex-signal-system .primary-nav {
  min-width: 0;
}

.detex-signal-system .menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: block;
  background: rgba(4, 18, 38, 0.48);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 180ms ease, visibility 180ms ease;
}

.detex-signal-system .menu-backdrop.open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.detex-signal-system .menu-backdrop[hidden] {
  display: none;
}

.detex-signal-system .direct-email-link {
  color: var(--navy-700);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.detex-signal-system .video-failed video {
  display: block;
}

@media (max-width: 1280px) {
  .detex-signal-system .container,
  .detex-signal-system .header-inner,
  .detex-signal-system .hero-layout,
  .detex-content-page .content-hero-layout,
  .campaign-template-page .campaign-hero-layout {
    width: min(calc(100% - 48px), 1180px);
  }

  .detex-signal-system .primary-nav {
    gap: 18px;
  }
}

@media (max-width: 1040px) {
  .detex-signal-system .site-header,
  .detex-signal-system .site-header.scrolled {
    top: 8px;
    right: 8px;
    left: 8px;
    width: auto;
    max-width: none;
    margin: 0;
    color: var(--ink);
    background: #fff;
    border: 1px solid rgba(11, 43, 86, 0.14);
    border-radius: 14px;
    box-shadow: 0 12px 34px rgba(4, 18, 38, 0.12);
    transform: none;
  }

  .detex-signal-system .container,
  .detex-signal-system .header-inner,
  .detex-signal-system .hero-layout,
  .detex-content-page .content-hero-layout,
  .campaign-template-page .campaign-hero-layout {
    width: min(calc(100% - 32px), 960px);
  }

  .detex-signal-system .header-inner {
    min-height: 68px;
    padding-inline: 10px;
    gap: 12px;
  }

  .detex-signal-system .wordmark {
    min-width: 136px;
    max-width: 176px;
  }

  .detex-signal-system .brand-logo-header-on-dark {
    opacity: 0;
  }

  .detex-signal-system .brand-logo-header-on-light {
    opacity: 1;
  }

  .detex-signal-system .primary-nav {
    position: fixed;
    top: 86px;
    right: 8px;
    bottom: auto;
    left: 8px;
    z-index: 140;
    display: flex;
    width: auto;
    max-height: calc(100dvh - 102px);
    padding: 16px 22px 24px;
    overflow-y: auto;
    overscroll-behavior: contain;
    color: var(--ink);
    background: #fff;
    border: 1px solid rgba(11, 43, 86, 0.14);
    border-radius: 12px;
    box-shadow: 0 24px 64px rgba(4, 18, 38, 0.22);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(-10px);
    transition: opacity 180ms ease, visibility 180ms ease, transform 180ms ease;
  }

  .detex-signal-system .primary-nav.open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
  }

  .detex-signal-system .header-cta {
    display: none;
  }

  .detex-signal-system .menu-toggle {
    display: block;
    flex: 0 0 auto;
  }

  .detex-signal-system .language-switch {
    flex: 0 0 auto;
  }
}

@media (max-width: 768px) {
  .detex-signal-system .section {
    padding-block: 84px;
  }

  .detex-signal-system :is(
    .hero-layout,
    .content-hero-layout,
    .campaign-hero-layout,
    .technology-layout,
    .risk-media-grid,
    .contact-layout,
    .split-heading
  ) {
    grid-template-columns: minmax(0, 1fr);
  }

  .detex-signal-system .footer-top {
    gap: 36px;
  }
}

@media (max-width: 680px) {
  .detex-signal-system {
    padding-bottom: 72px;
  }

  .detex-signal-system .site-header,
  .detex-signal-system .site-header.scrolled {
    top: 6px;
    right: 6px;
    left: 6px;
  }

  .detex-signal-system .container,
  .detex-signal-system .header-inner,
  .detex-signal-system .hero-layout,
  .detex-content-page .content-hero-layout,
  .campaign-template-page .campaign-hero-layout {
    width: calc(100% - 24px);
  }

  .detex-signal-system .header-inner {
    min-height: 62px;
    padding-inline: 6px;
    gap: 8px;
  }

  .detex-signal-system .wordmark {
    min-width: 122px;
    max-width: 148px;
  }

  .detex-signal-system .header-actions {
    min-width: 0;
    margin-left: auto;
    gap: 7px;
  }

  .detex-signal-system .language-switch {
    font-size: 0.61rem;
  }

  .detex-signal-system .language-switch a {
    min-width: 25px;
    height: 24px;
  }

  .detex-signal-system .menu-toggle {
    width: 40px;
    height: 40px;
  }

  .detex-signal-system .primary-nav {
    top: 76px;
    right: 6px;
    left: 6px;
    max-height: calc(100dvh - 88px);
    padding: 12px 18px 20px;
  }

  .detex-signal-system :is(h1, h2, h3, p, a, span, strong, small) {
    overflow-wrap: anywhere;
  }

  .detex-signal-system .mobile-cta {
    z-index: 150;
  }

  .detex-signal-system .site-footer {
    padding-bottom: 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .detex-signal-system *,
  .detex-signal-system *::before,
  .detex-signal-system *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function write(file, content) {
  fs.writeFileSync(path.join(root, file), content.replace(/\r\n/g, "\n"), "utf8");
}

function replaceTagAttribute(tag, name, value) {
  const attr = new RegExp(`\\s${name}=("[^"]*"|'[^']*')`, "i");
  if (attr.test(tag)) return tag.replace(attr, ` ${name}="${value}"`);
  return tag.replace(/\s*\/?>(?=$)/, function (end) {
    return ` ${name}="${value}"${end}`;
  });
}

function makeRequired(html, selectorId) {
  const pattern = new RegExp(`<(?:input|select|textarea)\\b(?=[^>]*\\bid=["']${selectorId}["'])[^>]*>`, "gi");
  return html.replace(pattern, function (tag) {
    if (/\srequired(?:\s|=|\/?>)/i.test(tag)) return tag;
    return tag.replace(/\s*\/?>(?=$)/, function (end) {
      return ` required${end}`;
    });
  });
}

function patchHtml(filename) {
  let html = read(filename);
  const english = /<html\b[^>]*\blang=["']en["']/i.test(html);
  const home = english ? "index-en.html" : "index.html";
  const homeLabel = english ? "Detex Lab home" : "Detex Lab 홈";
  const statusCopy = english
    ? "Your entries are not stored on a server. Submitting opens your email app. If it does not open, email"
    : "입력 내용은 서버에 저장되지 않으며, 제출하면 이메일 앱이 열립니다. 열리지 않으면";

  html = html.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  html = html.replace(/[A-Z0-9._%+-]+@detexlab\.com/gi, officialEmail);
  html = html.replace(/mailto:[^"'\s?]+@detexlab\.com/gi, `mailto:${officialEmail}`);

  const headerLogo = `\n        <a class="wordmark" href="${home}" aria-label="${homeLabel}">\n          <span class="brand-logo-swap" aria-hidden="true">\n            <img class="brand-logo brand-logo-header brand-logo-header-on-dark" src="assets/logo-detex-horizontal-light.svg" alt="" width="392" height="84" />\n            <img class="brand-logo brand-logo-header brand-logo-header-on-light" src="assets/logo-detex-horizontal.svg" alt="" width="392" height="84" />\n          </span>\n        </a>\n`;
  const headerPattern = /(<div\s+class=["']container header-inner["']>)[\s\S]*?(?=\s*<nav\s+class=["']primary-nav["'])/i;
  if (!headerPattern.test(html)) throw new Error(`${filename}: header logo region not found`);
  html = html.replace(headerPattern, `$1${headerLogo}\n        `);

  const footerLogo = `\n          <a href="${home}" aria-label="${homeLabel}">\n            <img class="brand-logo brand-logo-footer" src="assets/logo-detex-footer.svg" alt="" width="392" height="84" />\n          </a>\n`;
  const footerPattern = /(<div\s+class=["']container footer-top["']>\s*<div>)[\s\S]*?(?=\s*<p>)/i;
  if (!footerPattern.test(html)) throw new Error(`${filename}: footer logo region not found`);
  html = html.replace(footerPattern, `$1${footerLogo}          `);

  if (!/id=["']menuBackdrop["']/.test(html)) {
    html = html.replace(/<\/header>/i, `</header>\n\n    <div class="menu-backdrop" id="menuBackdrop" hidden aria-hidden="true"></div>`);
  }

  html = html.replace(/href=["']css\/styles\.css(?:\?[^"']*)?["']/gi, `href="css/styles.css?v=${cacheVersion}"`);
  html = html.replace(/src=["']js\/main\.js(?:\?[^"']*)?["']/gi, `src="js/main.js?v=${cacheVersion}"`);

  html = makeRequired(html, "inquiryType");
  html = makeRequired(html, "organization");
  html = makeRequired(html, "contactName");
  html = makeRequired(html, "contactEmail");
  html = makeRequired(html, "message");

  if (/id=["']contactForm["']/.test(html)) {
    const status = `<p class="form-status" id="formStatus" aria-live="polite">\n                ${statusCopy}\n                <a class="direct-email-link" href="mailto:${officialEmail}">${officialEmail}</a>.\n              </p>`;
    const statusPattern = /<p\s+class=["']form-status["'][^>]*id=["']formStatus["'][^>]*>[\s\S]*?<\/p>/i;
    if (!statusPattern.test(html)) throw new Error(`${filename}: form status region not found`);
    html = html.replace(statusPattern, status);
  }

  if (/responsiveLayoutHotfix|createElement\(["']style["']\)/.test(html)) {
    throw new Error(`${filename}: runtime hotfix reference remains`);
  }

  write(filename, html);
}

const htmlFiles = fs.readdirSync(root)
  .filter(function (name) { return name.endsWith(".html") && fs.statSync(path.join(root, name)).isFile(); })
  .sort();

if (htmlFiles.length === 0) throw new Error("No HTML files found");
htmlFiles.forEach(patchHtml);

write("js/main.js", mainJs);

let css = read("css/styles.css");
css = css.replace(/\/\* === Responsive source integration: 2026-07-25 === \*\/[\s\S]*$/m, "").trimEnd();
write("css/styles.css", `${css}\n\n${responsiveCss.trim()}\n`);

const packageJson = {
  name: "detexlab-website",
  private: true,
  version: "1.0.0",
  scripts: {
    qa: "node scripts/qa-site.mjs"
  },
  devDependencies: {
    playwright: "^1.54.1"
  }
};
write("package.json", `${JSON.stringify(packageJson, null, 2)}\n`);

const gitignorePath = path.join(root, ".gitignore");
let gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";
for (const entry of ["node_modules/", "qa-artifacts/", "playwright-report/", "test-results/"]) {
  if (!gitignore.split(/\r?\n/).includes(entry)) gitignore += `${gitignore.endsWith("\n") || gitignore.length === 0 ? "" : "\n"}${entry}\n`;
}
write(".gitignore", gitignore);

console.log(`Patched ${htmlFiles.length} HTML files: ${htmlFiles.join(", ")}`);
console.log("Integrated responsive CSS, restored JavaScript, and normalized contact workflow.");
