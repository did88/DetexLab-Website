import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pages = fs.readdirSync(root)
  .filter((name) => name.endsWith(".html") && fs.statSync(path.join(root, name)).isFile())
  .sort();

const noticeCss = `/* === Required test notice: 2026-09-05 === */
:root {
  --notice-bar-height: 92px;
}

.test-notice-bar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 200;
  color: rgba(244, 240, 231, 0.94);
  background: var(--navy-950);
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  font-family: var(--font-body);
}

.test-notice-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: min(100% - 32px, 1320px);
  max-height: 42vh;
  margin-inline: auto;
  padding: 10px 0 11px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.test-notice-mark {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  color: var(--navy-950);
  background: var(--signal-rose, #e978a1);
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.test-notice-copy {
  min-width: 0;
}

.test-notice-title {
  margin: 0 0 3px;
  color: #ffffff;
  font-family: "IBM Plex Sans", var(--font-body);
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.08em;
}

.test-notice-sep {
  margin: 0 6px;
  opacity: 0.45;
}

.test-notice-text {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  word-break: keep-all;
  overflow-wrap: break-word;
}

.test-notice-text + .test-notice-text {
  margin-top: 3px;
  color: rgba(244, 240, 231, 0.68);
}

body {
  padding-top: var(--notice-bar-height);
}

.skip-link:focus {
  top: calc(var(--notice-bar-height) + 10px);
}

.site-header {
  top: var(--notice-bar-height);
}

.detex-signal-system .site-header {
  top: calc(var(--notice-bar-height) + 14px);
}

html {
  scroll-padding-top: calc(var(--notice-bar-height) + 92px);
}

@media (max-width: 1040px) {
  .detex-signal-system .site-header,
  .detex-signal-system .site-header.scrolled {
    top: calc(var(--notice-bar-height) + 8px);
  }
}

@media (max-width: 900px) {
  :root {
    --notice-bar-height: 150px;
  }

  html {
    scroll-padding-top: calc(var(--notice-bar-height) + 78px);
  }
}

@media (max-width: 680px) {
  :root {
    --notice-bar-height: 186px;
  }

  .test-notice-inner {
    gap: 10px;
    padding: 9px 0 10px;
  }

  .test-notice-mark {
    width: 18px;
    height: 18px;
    font-size: 12px;
  }

  .test-notice-title {
    font-size: 11px;
  }

  .test-notice-text {
    font-size: 11.5px;
    line-height: 1.45;
  }

  .detex-signal-system .site-header,
  .detex-signal-system .site-header.scrolled {
    top: calc(var(--notice-bar-height) + 6px);
  }

  html {
    scroll-padding-top: calc(var(--notice-bar-height) + 70px);
  }
}

@media print {
  .test-notice-bar {
    position: static;
    color: #000000;
    background: transparent;
    border-bottom: 1px solid #000000;
  }

  body {
    padding-top: 0;
  }
}`;

const noticeJs = `  // Keep the fixed bilingual screening notice aligned with the actual rendered height.
  const noticeBar = document.getElementById("testNoticeBar");
  if (noticeBar) {
    const syncNoticeBarHeight = () => {
      const height = Math.round(noticeBar.getBoundingClientRect().height);
      if (height > 0) {
        document.documentElement.style.setProperty(
          "--notice-bar-height",
          String(height) + "px",
        );
      }
    };

    syncNoticeBarHeight();
    window.addEventListener("load", syncNoticeBarHeight);

    if (typeof ResizeObserver === "function") {
      new ResizeObserver(syncNoticeBarHeight).observe(noticeBar);
    } else {
      window.addEventListener("resize", syncNoticeBarHeight);
    }
  }

`;

for (const page of pages) {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, "utf8");
  const english = /<html\b[^>]*\blang=["']en["']/i.test(html);
  const home = english ? "index-en.html" : "index.html";
  const contactLabel = english ? "Partnership inquiry" : "협업 문의";
  const sampleLabel = english ? "Pilot / sample inquiry" : "실증·샘플 문의";

  if (!/id=["']testNoticeBar["']/.test(html)) {
    throw new Error(`${page}: required bilingual test notice banner missing`);
  }

  if (!/class=["'][^"']*\bmobile-cta\b/i.test(html)) {
    const cta = `\n    <div class="mobile-cta" aria-label="${english ? "Quick contact" : "빠른 문의"}">\n      <a href="${home}#contact">${contactLabel}</a>\n      <a href="${home}#contact">${sampleLabel}</a>\n    </div>\n`;
    html = html.replace(/\s*<script\s+src=["']js\/main\.js[^>]*><\/script>/i, `${cta}\n    <script src="js/main.js?v=20260725-final"></script>`);
  }

  fs.writeFileSync(file, html.replace(/\r\n/g, "\n"), "utf8");
}

const cssFile = path.join(root, "css", "styles.css");
let css = fs.readFileSync(cssFile, "utf8");
css = css.replace(/\/\* === Mobile nav hardening: 2026-07-25 === \*\/[\s\S]*$/m, "").trimEnd();
css = css.replace(/\/\* === Required test notice: 2026-09-05 === \*\/[\s\S]*$/m, "").trimEnd();
css = css.replace(/\/\* ============================================================\n\s*필수 안전 고지 배너 \(Required test notice bar\)[\s\S]*$/m, "").trimEnd();
css += `\n\n${noticeCss}\n\n/* === Mobile nav hardening: 2026-07-25 === */\n@media (max-width: 1040px) {\n  .detex-signal-system .brand-logo-header-on-dark {\n    display: none !important;\n    opacity: 0 !important;\n  }\n\n  .detex-signal-system .brand-logo-header-on-light {\n    display: block !important;\n    opacity: 1 !important;\n  }\n\n  .detex-signal-system .primary-nav {\n    opacity: 0 !important;\n    visibility: hidden !important;\n    pointer-events: none !important;\n    transform: translateY(-10px) !important;\n  }\n\n  .detex-signal-system .primary-nav.open {\n    opacity: 1 !important;\n    visibility: visible !important;\n    pointer-events: auto !important;\n    transform: translateY(0) !important;\n  }\n}\n\n@media (max-width: 680px) {\n  .detex-signal-system .site-footer {\n    margin-bottom: 72px;\n  }\n}\n`;
fs.writeFileSync(cssFile, css, "utf8");

const jsFile = path.join(root, "js", "main.js");
let js = fs.readFileSync(jsFile, "utf8");
if (!js.includes("syncNoticeBarHeight")) {
  const anchor = '  const year = document.getElementById("year");';
  if (!js.includes(anchor)) throw new Error("js/main.js: year anchor missing");
  js = js.replace(anchor, `${noticeJs}${anchor}`);
}
fs.writeFileSync(jsFile, js.replace(/\r\n/g, "\n"), "utf8");

if (!css.includes(".test-notice-bar") || !js.includes("syncNoticeBarHeight")) {
  throw new Error("Required test notice CSS/JS hardening failed");
}

console.log(`Applied mobile/logo hardening and preserved required test notice on ${pages.length} pages.`);
