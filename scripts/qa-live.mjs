import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const baseUrl = (process.env.DETEX_BASE_URL || "https://detexlab.com").replace(/\/$/, "");
const expectedCacheKey = "v=20260725-final";
const pages = [
  "campaign-template-en.html",
  "campaign-template.html",
  "features-en.html",
  "features.html",
  "index-en.html",
  "index.html",
  "technology-en.html",
  "technology.html"
];
const viewports = [
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 }
];
const artifactDir = path.resolve("live-qa-artifacts");
fs.rmSync(artifactDir, { recursive: true, force: true });
fs.mkdirSync(artifactDir, { recursive: true });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDeployment() {
  let last = "";
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/?deploy=${Date.now()}`, { redirect: "follow", cache: "no-store" });
      last = `status=${response.status}`;
      if (response.ok) {
        const html = await response.text();
        if (html.includes(`css/styles.css?${expectedCacheKey}`) && html.includes(`js/main.js?${expectedCacheKey}`)) {
          console.log(`Deployment detected on attempt ${attempt}.`);
          return;
        }
        last += ", cache key not visible yet";
      }
    } catch (error) {
      last = String(error);
    }
    console.log(`Waiting for deployment (${attempt}/30): ${last}`);
    await delay(10_000);
  }
  throw new Error(`Deployment did not expose ${expectedCacheKey}: ${last}`);
}

await waitForDeployment();

const browser = await chromium.launch({ headless: true });
const rows = [];
const failures = [];

function record(page, viewport, check, ok, detail = "") {
  const row = { page, viewport: viewport.name, check, status: ok ? "PASS" : "FAIL", detail };
  rows.push(row);
  if (!ok) failures.push(row);
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    for (const pageName of pages) {
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => pageErrors.push(String(error)));

      const response = await page.goto(`${baseUrl}/${pageName}?deploy=${Date.now()}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(500);
      record(pageName, viewport, "HTTP 200", response?.status() === 200, `status=${response?.status()}`);

      const state = await page.evaluate(() => {
        const header = document.getElementById("siteHeader");
        const headerRect = header?.getBoundingClientRect();
        const wordmark = document.querySelector(".wordmark");
        const wordmarkRect = wordmark?.getBoundingClientRect();
        const nav = document.getElementById("primaryNav");
        const toggle = document.getElementById("menuToggle");
        return {
          innerWidth: window.innerWidth,
          scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          headerRect: headerRect ? { left: headerRect.left, right: headerRect.right } : null,
          wordmarkRect: wordmarkRect ? { width: wordmarkRect.width, height: wordmarkRect.height } : null,
          wordmarkLabel: wordmark?.getAttribute("aria-label") || "",
          controlChars: /[\u0001\u0003]/.test(document.body.textContent || ""),
          brokenImages: Array.from(document.images).filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
          logoImages: Array.from(document.querySelectorAll(".brand-logo")).map((image) => ({ complete: image.complete, naturalWidth: image.naturalWidth })),
          menuExpanded: toggle?.getAttribute("aria-expanded"),
          menuOpen: nav?.classList.contains("open") || false,
          cssHref: document.querySelector('link[href^="css/styles.css"]')?.getAttribute("href") || "",
          jsSrc: document.querySelector('script[src^="js/main.js"]')?.getAttribute("src") || "",
          footer: Boolean(document.querySelector(".site-footer")),
          mobileCta: Boolean(document.querySelector(".mobile-cta"))
        };
      });

      record(pageName, viewport, "No horizontal overflow", state.scrollWidth <= state.innerWidth + 1, JSON.stringify({ scrollWidth: state.scrollWidth, innerWidth: state.innerWidth }));
      record(pageName, viewport, "Header inside viewport", Boolean(state.headerRect) && state.headerRect.left >= -1 && state.headerRect.right <= state.innerWidth + 1, JSON.stringify(state.headerRect));
      record(pageName, viewport, "Wordmark visible", Boolean(state.wordmarkRect) && state.wordmarkRect.width >= 120 && state.wordmarkRect.height > 20 && state.wordmarkLabel.includes("Detex Lab"), JSON.stringify({ rect: state.wordmarkRect, label: state.wordmarkLabel }));
      record(pageName, viewport, "Logo assets loaded", state.logoImages.length >= 3 && state.logoImages.every((image) => image.complete && image.naturalWidth > 0), JSON.stringify(state.logoImages));
      record(pageName, viewport, "No U+0001/U+0003", !state.controlChars);
      record(pageName, viewport, "All images loaded", state.brokenImages.length === 0, state.brokenImages.join(", "));
      record(pageName, viewport, "Menu initially closed", state.menuExpanded === "false" && !state.menuOpen, JSON.stringify({ expanded: state.menuExpanded, open: state.menuOpen }));
      record(pageName, viewport, "Cache key deployed", state.cssHref.includes(expectedCacheKey) && state.jsSrc.includes(expectedCacheKey), JSON.stringify({ css: state.cssHref, js: state.jsSrc }));
      record(pageName, viewport, "Footer and CTA present", state.footer && state.mobileCta);

      const localLinks = await page.locator('a[href]:not([href^="http"]):not([href^="mailto:"]):not([href^="tel:"])').evaluateAll((nodes) => nodes.map((node) => node.href));
      const badLinks = [];
      for (const href of [...new Set(localLinks)]) {
        const target = new URL(href);
        if (target.origin !== new URL(baseUrl).origin) continue;
        const targetResponse = await page.request.get(target.href.split("#")[0], { timeout: 30_000 });
        if (!targetResponse.ok()) badLinks.push(`${target.pathname}:${targetResponse.status()}`);
      }
      record(pageName, viewport, "Internal links return success", badLinks.length === 0, badLinks.join(", "));

      if (viewport.width <= 1040) {
        await page.locator("#menuToggle").click();
        await page.waitForTimeout(250);
        const openState = await page.evaluate(() => {
          const nav = document.getElementById("primaryNav");
          const backdrop = document.getElementById("menuBackdrop");
          const rect = nav?.getBoundingClientRect();
          return {
            open: nav?.classList.contains("open") || false,
            visibility: nav ? getComputedStyle(nav).visibility : "missing",
            pointerEvents: nav ? getComputedStyle(nav).pointerEvents : "missing",
            background: nav ? getComputedStyle(nav).backgroundColor : "",
            rect: rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : null,
            backdropOpen: backdrop?.classList.contains("open") || false,
            bodyLocked: document.body.classList.contains("menu-open")
          };
        });
        const rectOk = openState.rect && openState.rect.left >= -1 && openState.rect.right <= viewport.width + 1 && openState.rect.top >= 0 && openState.rect.bottom <= viewport.height + 1;
        const opaque = openState.background === "rgb(255, 255, 255)" || openState.background === "rgba(255, 255, 255, 1)";
        record(pageName, viewport, "Mobile menu opens correctly", openState.open && openState.visibility === "visible" && openState.pointerEvents === "auto" && rectOk && opaque && openState.backdropOpen && openState.bodyLocked, JSON.stringify(openState));
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
        const closed = await page.evaluate(() => {
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
        record(pageName, viewport, "Mobile menu closes cleanly", closed.expanded === "false" && !closed.open && closed.visibility === "hidden" && closed.pointerEvents === "none" && closed.backdropHidden && !closed.bodyLocked, JSON.stringify(closed));
      }

      if (await page.locator("#contactForm").count()) {
        await page.locator("#inquiryType").selectOption("sample");
        await page.locator("#organization").fill("Live QA Organization");
        await page.locator("#contactName").fill("Live QA Contact");
        await page.locator("#contactEmail").fill("live-qa@example.com");
        await page.locator("#message").fill("Live deployment inquiry test");
        await page.evaluate(() => {
          window.__liveMailto = "";
          document.getElementById("contactForm").addEventListener("detex:mailto", (event) => {
            event.preventDefault();
            window.__liveMailto = event.detail.url;
          }, { once: true });
        });
        await page.locator('#contactForm button[type="submit"]').click();
        const mailto = await page.evaluate(() => window.__liveMailto || "");
        const decoded = decodeURIComponent(mailto);
        record(pageName, viewport, "Live contact mailto", mailto.startsWith("mailto:contact@detexlab.com?") && decoded.includes("Live QA Organization") && decoded.includes("live-qa@example.com") && decoded.includes("Live deployment inquiry test"), mailto);
        record(pageName, viewport, "Direct email fallback", await page.locator('#formStatus a[href="mailto:contact@detexlab.com"]').count() === 1);
      }

      record(pageName, viewport, "No console errors", consoleErrors.length === 0, consoleErrors.join(" | "));
      record(pageName, viewport, "No page errors", pageErrors.length === 0, pageErrors.join(" | "));
      await page.close();
    }

    for (const mainPage of ["index.html", "index-en.html"]) {
      const page = await context.newPage();
      await page.goto(`${baseUrl}/${mainPage}?deploy=${Date.now()}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(500);
      const prefix = `${mainPage.replace(".html", "")}-${viewport.name}`;
      for (const [position, ratio] of [["top", 0], ["middle", 0.5], ["bottom", 1]]) {
        await page.evaluate((value) => window.scrollTo(0, Math.max(0, (document.documentElement.scrollHeight - window.innerHeight) * value)), ratio);
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(artifactDir, `${prefix}-${position}.png`) });
      }
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const result = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  pages,
  viewports,
  totalChecks: rows.length,
  passed: rows.filter((row) => row.status === "PASS").length,
  failed: failures.length,
  failures,
  results: rows
};
fs.writeFileSync(path.join(artifactDir, "results.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ baseUrl, pages: pages.length, viewports: viewports.length, totalChecks: result.totalChecks, passed: result.passed, failed: result.failed }, null, 2));
if (failures.length) {
  console.error(JSON.stringify(failures.slice(0, 40), null, 2));
  process.exitCode = 1;
}
