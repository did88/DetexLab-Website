import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pages = fs.readdirSync(root)
  .filter((name) => name.endsWith(".html") && fs.statSync(path.join(root, name)).isFile())
  .sort();

for (const page of pages) {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, "utf8");
  const english = /<html\b[^>]*\blang=["']en["']/i.test(html);
  const home = english ? "index-en.html" : "index.html";
  const contactLabel = english ? "Partnership inquiry" : "협업 문의";
  const sampleLabel = english ? "Pilot / sample inquiry" : "실증·샘플 문의";

  if (!/class=["'][^"']*\bmobile-cta\b/i.test(html)) {
    const cta = `\n    <div class="mobile-cta" aria-label="${english ? "Quick contact" : "빠른 문의"}">\n      <a href="${home}#contact">${contactLabel}</a>\n      <a href="${home}#contact">${sampleLabel}</a>\n    </div>\n`;
    html = html.replace(/\s*<script\s+src=["']js\/main\.js[^>]*><\/script>/i, `${cta}\n    <script src="js/main.js?v=20260725-final"></script>`);
  }

  fs.writeFileSync(file, html.replace(/\r\n/g, "\n"), "utf8");
}

const cssFile = path.join(root, "css", "styles.css");
let css = fs.readFileSync(cssFile, "utf8");
css = css.replace(/\/\* === Mobile nav hardening: 2026-07-25 === \*\/[\s\S]*$/m, "").trimEnd();
css += `\n\n/* === Mobile nav hardening: 2026-07-25 === */\n@media (max-width: 1040px) {\n  .detex-signal-system .primary-nav {\n    opacity: 0 !important;\n    visibility: hidden !important;\n    pointer-events: none !important;\n    transform: translateY(-10px) !important;\n  }\n\n  .detex-signal-system .primary-nav.open {\n    opacity: 1 !important;\n    visibility: visible !important;\n    pointer-events: auto !important;\n    transform: translateY(0) !important;\n  }\n}\n\n@media (max-width: 680px) {\n  .detex-signal-system .site-footer {\n    margin-bottom: 72px;\n  }\n}\n`;
fs.writeFileSync(cssFile, css, "utf8");

console.log(`Applied mobile navigation hardening and ensured mobile CTA markup on ${pages.length} pages.`);
