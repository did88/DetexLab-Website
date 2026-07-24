import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const root = process.cwd();
const artifactDir = path.join(root, "qa-artifacts");
fs.rmSync(artifactDir, { recursive: true, force: true });
fs.mkdirSync(artifactDir, { recursive: true });

const expectedPages = [
  "index.html",
  "index-en.html",
  "technology.html",
  "technology-en.html",
  "features.html",
  "features-en.html",
  "campaign-template.html",
  "campaign-template-en.html"
];
const actualPages = fs.readdirSync(root)
  .filter((name) => name.endsWith(".html") && fs.statSync(path.join(root, name)).isFile())
  .sort();
const missingPages = expectedPages.filter((name) => !actualPages.includes(name));
if (missingPages.length) throw new Error(`Missing expected pages: ${missingPages.join(", ")}`);

const viewports = [
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 }
];

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
  [".ico", "image/x-icon"]
]);

function safeFilePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "") || "index.html";
  const resolved = path.resolve(root, clean);
  if (!resolved.startsWith(path.resolve(root) + path.sep) && resolved !== path.resolve(root)) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  const filePath = safeFilePath(req.url || "/");
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  const headers = {
    "content-type": mime.get(path.extname(filePath).toLowerCase()) || "application/octet-stream",
    "cache-control": "no-store"
  };
  res.writeHead(200, headers);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(4173, "127.0.0.1", resolve));
const baseUrl = "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const results = [];
const failures = [];

function record(pageName, viewport, check, ok, detail = "") {
  const row = { page: pageName, viewport: viewport.name, check, status: ok ? "PASS" : "FAIL", detail };
  results.push(row);
  if (!ok) failures.push(row);
}

function localTargetExists(href, currentPage) {
  const parsed = new URL(href, `${baseUrl}/${currentPage}`);
  if (parsed.origin !== baseUrl) return true;
  const pathname = decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "index.html";
  const filePath = path.join(root, pathname);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  if (!parsed.hash) return true;
  const html = fs.readFileSync(filePath, "utf8");
  const id = parsed.hash.slice(1).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\bid=["']${id}["']`).test(html);
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "no-preference"
    });

    for (const pageName of actualPages) {
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => pageErrors.push(String(error)));

      const response = await page.goto(`${baseUrl}/${pageName}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(250);
      record(pageName, viewport, "HTTP 200", response?.status() === 200, `status=${response?.status()}`);

      const state = await page.evaluate(() => {
        const header = document.getElementById("siteHeader");
        const headerRect = header?.getBoundingClientRect();
        const wordmark = document.querySelector(".wordmark");
        const wordmarkRect = wordmark?.getBoundingClientRect();
        const logoImages = Array.from(document.querySelectorAll(".brand-logo"));
        const allImages = Array.from(document.images);
        const nav = document.getElementById("primaryNav");
        const toggle = document.getElementById("menuToggle");
        const footer = document.querySelector(".site-footer");
        const cta = document.querySelector(".mobile-cta");
        return {
          scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          innerWidth: window.innerWidth,
          headerRect: headerRect ? { left: headerRect.left, right: headerRect.right, width: headerRect.width } : null,
          wordmarkRect: wordmarkRect ? { width: wordmarkRect.width, height: wordmarkRect.height } : null,
          wordmarkLabel: wordmark?.getAttribute("aria-label") || "",
          controlChars: /[\u0001\u0003]/.test(document.body.textContent || ""),
          logoImages: logoImages.map((image) => ({ complete: image.complete, naturalWidth: image.naturalWidth })),
          brokenImages: allImages.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.getAttribute("src")),
          menuExpanded: toggle?.getAttribute("aria-expanded"),
          menuOpen: nav?.classList.contains("open") || false,
          navVisibility: nav ? getComputedStyle(nav).visibility : "missing",
          footerExists: Boolean(footer),
          mobileCtaExists: Boolean(cta),
          cssHref: document.querySelector('link[href^="css/styles.css"]')?.getAttribute("href") || "",
          jsSrc: document.querySelector('script[src^="js/main.js"]')?.getAttribute("src") || ""
        };
      });

      record(pageName, viewport, "No horizontal overflow", state.scrollWidth <= state.innerWidth + 1, `scrollWidth=${state.scrollWidth}, innerWidth=${state.innerWidth}`);
      record(pageName, viewport, "Header inside viewport", Boolean(state.headerRect) && state.headerRect.left >= -1 && state.headerRect.right <= state.innerWidth + 1, JSON.stringify(state.headerRect));
      record(pageName, viewport, "Logo text/wordmark visible", Boolean(state.wordmarkRect) && state.wordmarkRect.width >= 120 && state.wordmarkRect.height > 20 && state.wordmarkLabel.includes("Detex Lab"), JSON.stringify({ rect: state.wordmarkRect, label: state.wordmarkLabel }));
      record(pageName, viewport, "Logo assets loaded", state.logoImages.length >= 3 && state.logoImages.every((image) => image.complete && image.naturalWidth > 0), JSON.stringify(state.logoImages));
      record(pageName, viewport, "No U+0001/U+0003", !state.controlChars);
      record(pageName, viewport, "Menu initially closed", state.menuExpanded === "false" && !state.menuOpen, JSON.stringify({ expanded: state.menuExpanded, open: state.menuOpen, visibility: state.navVisibility }));
      record(pageName, viewport, "All images loaded", state.brokenImages.length === 0, state.brokenImages.join(", "));
      record(pageName, viewport, "Footer present", state.footerExists);
      record(pageName, viewport, "Mobile CTA present", state.mobileCtaExists);
      record(pageName, viewport, "Unified cache key", state.cssHref.includes("v=20260725-final") && state.jsSrc.includes("v=20260725-final"), JSON.stringify({ css: state.cssHref, js: state.jsSrc }));

      const anchors = await page.locator("a[href]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
      const brokenInternal = anchors
        .filter((href) => href && !/^(?:https?:|mailto:|tel:|javascript:)/i.test(href))
        .filter((href) => !localTargetExists(href, pageName));
      record(pageName, viewport, "Internal links and anchors resolve", brokenInternal.length === 0, brokenInternal.join(", "));

      const languageLinks = await page.locator(".language-switch a[href]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
      record(pageName, viewport, "Language switch resolves", languageLinks.length >= 2 && languageLinks.every((href) => localTargetExists(href, pageName)), languageLinks.join(", "));

      const videoSources = await page.locator("video source[src]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("src")));
      const missingVideo = videoSources.filter((src) => !fs.existsSync(path.join(root, src.split("?")[0])));
      record(pageName, viewport, "Video sources exist", missingVideo.length === 0, missingVideo.join(", "));

      if (viewport.width <= 1040) {
        await page.locator("#menuToggle").click();
        await page.waitForTimeout(220);
        const openState = await page.evaluate(() => {
          const nav = document.getElementById("primaryNav");
          const backdrop = document.getElementById("menuBackdrop");
          const rect = nav?.getBoundingClientRect();
          const bg = nav ? getComputedStyle(nav).backgroundColor : "";
          return {
            open: nav?.classList.contains("open") || false,
            visibility: nav ? getComputedStyle(nav).visibility : "missing",
            pointerEvents: nav ? getComputedStyle(nav).pointerEvents : "missing",
            rect: rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : null,
            background: bg,
            backdropOpen: backdrop?.classList.contains("open") || false,
            backdropVisibility: backdrop ? getComputedStyle(backdrop).visibility : "missing",
            bodyLocked: document.body.classList.contains("menu-open")
          };
        });
        const opaque = openState.background.startsWith("rgb(") || (!openState.background.endsWith(", 0)") && !openState.background.includes("0)"));
        const inViewport = openState.rect && openState.rect.left >= -1 && openState.rect.right <= viewport.width + 1 && openState.rect.top >= 0 && openState.rect.bottom <= viewport.height + 1;
        record(pageName, viewport, "Mobile menu opens in viewport", openState.open && openState.visibility === "visible" && openState.pointerEvents === "auto" && inViewport, JSON.stringify(openState));
        record(pageName, viewport, "Mobile menu opaque with backdrop", opaque && openState.backdropOpen && openState.backdropVisibility === "visible" && openState.bodyLocked, JSON.stringify(openState));
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
        const closedState = await page.evaluate(() => {
          const nav = document.getElementById("primaryNav");
          const backdrop = document.getElementById("menuBackdrop");
          return {
            expanded: document.getElementById("menuToggle")?.getAttribute("aria-expanded"),
            open: nav?.classList.contains("open") || false,
            visibility: nav ? getComputedStyle(nav).visibility : "missing",
            pointerEvents: nav ? getComputedStyle(nav).pointerEvents : "missing",
            backdropHidden: backdrop?.hidden ?? false,
            bodyLocked: document.body.classList.contains("menu-open")
          };
        });
        record(pageName, viewport, "Mobile menu closes cleanly", closedState.expanded === "false" && !closedState.open && closedState.visibility === "hidden" && closedState.pointerEvents === "none" && closedState.backdropHidden && !closedState.bodyLocked, JSON.stringify(closedState));
      }

      const hasForm = await page.locator("#contactForm").count();
      if (hasForm) {
        await page.locator("#inquiryType").selectOption("sample");
        await page.locator("#organization").fill("QA Organization");
        await page.locator("#contactName").fill("QA Contact");
        await page.locator("#contactEmail").fill("qa@example.com");
        await page.locator("#message").fill("QA inquiry body");
        await page.evaluate(() => {
          window.__detexMailto = null;
          document.getElementById("contactForm").addEventListener("detex:mailto", (event) => {
            event.preventDefault();
            window.__detexMailto = event.detail.url;
          }, { once: true });
        });
        await page.locator('#contactForm button[type="submit"]').click();
        const mailto = await page.evaluate(() => window.__detexMailto || document.getElementById("contactForm")?.dataset.mailto || "");
        const decoded = decodeURIComponent(mailto);
        const mailOk = mailto.startsWith("mailto:contact@detexlab.com?")
          && decoded.includes("QA Organization")
          && decoded.includes("QA Contact")
          && decoded.includes("qa@example.com")
          && decoded.includes("QA inquiry body");
        record(pageName, viewport, "Contact form mailto workflow", mailOk, mailto);
        const statusHasDirect = await page.locator('#formStatus a[href="mailto:contact@detexlab.com"]').count();
        record(pageName, viewport, "Direct contact fallback visible", statusHasDirect === 1);
      }

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(100);
      if (viewport.width <= 680) {
        const overlap = await page.evaluate(() => {
          const cta = document.querySelector(".mobile-cta");
          const lastFooterText = document.querySelector(".footer-bottom");
          if (!cta || !lastFooterText) return null;
          const ctaRect = cta.getBoundingClientRect();
          const footerRect = lastFooterText.getBoundingClientRect();
          return { overlap: footerRect.bottom > ctaRect.top + 1, ctaTop: ctaRect.top, footerBottom: footerRect.bottom };
        });
        record(pageName, viewport, "Mobile CTA does not cover footer content", overlap !== null && !overlap.overlap, JSON.stringify(overlap));
      }

      record(pageName, viewport, "No console errors", consoleErrors.length === 0, consoleErrors.join(" | "));
      record(pageName, viewport, "No page errors", pageErrors.length === 0, pageErrors.join(" | "));
      await page.close();
    }

    for (const mainPage of ["index.html", "index-en.html"]) {
      const page = await context.newPage();
      await page.goto(`${baseUrl}/${mainPage}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);
      const prefix = `${mainPage.replace(".html", "")}-${viewport.name}`;
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(artifactDir, `${prefix}-top.png`) });
      await page.evaluate(() => window.scrollTo(0, Math.max(0, (document.documentElement.scrollHeight - window.innerHeight) / 2)));
      await page.waitForTimeout(120);
      await page.screenshot({ path: path.join(artifactDir, `${prefix}-middle.png`) });
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(120);
      await page.screenshot({ path: path.join(artifactDir, `${prefix}-bottom.png`) });
      await page.close();
    }

    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

const summary = {
  generatedAt: new Date().toISOString(),
  pages: actualPages,
  viewports,
  totalChecks: results.length,
  passed: results.filter((row) => row.status === "PASS").length,
  failed: failures.length,
  failures,
  results
};
fs.writeFileSync(path.join(artifactDir, "results.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ pages: actualPages.length, viewports: viewports.length, totalChecks: summary.totalChecks, passed: summary.passed, failed: summary.failed }, null, 2));
if (failures.length) {
  console.error(JSON.stringify(failures.slice(0, 30), null, 2));
  process.exitCode = 1;
}
