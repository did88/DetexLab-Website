import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const root = process.cwd();
const remoteBaseUrl = (process.env.DETEX_BASE_URL || "").replace(/\/$/, "");
const artifactRoot = path.join(root, remoteBaseUrl ? "live-qa-artifacts" : "qa-artifacts", "mobile-logo-visibility");
fs.rmSync(artifactRoot, { recursive: true, force: true });
fs.mkdirSync(artifactRoot, { recursive: true });

const pages = [
  "index.html",
  "index-en.html",
  "technology.html",
  "technology-en.html",
  "features.html",
  "features-en.html",
  "campaign-template.html",
  "campaign-template-en.html"
];

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".mp4", "video/mp4"]
]);

let server = null;
let baseUrl = remoteBaseUrl;
if (!baseUrl) {
  server = http.createServer((req, res) => {
    const clean = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\/+/, "") || "index.html";
    const filePath = path.resolve(root, clean);
    if (!filePath.startsWith(path.resolve(root) + path.sep) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "content-type": mime.get(path.extname(filePath).toLowerCase()) || "application/octet-stream",
      "cache-control": "no-store"
    });
    fs.createReadStream(filePath).pipe(res);
  });
  await new Promise((resolve) => server.listen(4174, "127.0.0.1", resolve));
  baseUrl = "http://127.0.0.1:4174";
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const results = [];
const failures = [];

function visibleLogoState() {
  const wordmark = document.querySelector(".wordmark");
  const light = document.querySelector(".brand-logo-header-on-light");
  const dark = document.querySelector(".brand-logo-header-on-dark");
  const lightStyle = light ? getComputedStyle(light) : null;
  const darkStyle = dark ? getComputedStyle(dark) : null;
  const rect = light?.getBoundingClientRect();
  const lightVisible = Boolean(
    light && light.complete && light.naturalWidth > 0 && rect && rect.width > 80 && rect.height > 16 &&
    lightStyle?.display !== "none" && lightStyle?.visibility !== "hidden" && Number(lightStyle?.opacity || 0) > 0.5
  );
  return {
    lightVisible,
    wordmarkWidth: wordmark?.getBoundingClientRect().width || 0,
    light: {
      display: lightStyle?.display || "missing",
      visibility: lightStyle?.visibility || "missing",
      opacity: lightStyle?.opacity || "missing",
      naturalWidth: light?.naturalWidth || 0,
      width: rect?.width || 0,
      height: rect?.height || 0
    },
    dark: {
      display: darkStyle?.display || "missing",
      visibility: darkStyle?.visibility || "missing",
      opacity: darkStyle?.opacity || "missing"
    },
    scrolled: document.getElementById("siteHeader")?.classList.contains("scrolled") || false
  };
}

async function waitForVisibleTop(page, pageName) {
  const deadline = Date.now() + (remoteBaseUrl ? 240_000 : 10_000);
  let state = null;
  while (Date.now() < deadline) {
    await page.goto(`${baseUrl}/${pageName}?mobile-logo-qa=${Date.now()}`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(250);
    state = await page.evaluate(visibleLogoState);
    if (state.lightVisible && !state.scrolled) return state;
    await page.waitForTimeout(remoteBaseUrl ? 10_000 : 500);
  }
  return state;
}

try {
  for (const pageName of pages) {
    const page = await context.newPage();
    const topState = await waitForVisibleTop(page, pageName);
    const topOk = Boolean(topState?.lightVisible && !topState?.scrolled && topState?.wordmarkWidth >= 120);
    results.push({ page: pageName, state: "top", status: topOk ? "PASS" : "FAIL", detail: topState });
    if (!topOk) failures.push(results.at(-1));
    await page.screenshot({ path: path.join(artifactRoot, `${pageName.replace(/\.html$/, "")}-top.png`), fullPage: false });

    await page.evaluate(() => window.scrollTo(0, 240));
    await page.waitForTimeout(350);
    const scrolledState = await page.evaluate(visibleLogoState);
    const scrolledOk = Boolean(scrolledState.lightVisible && scrolledState.scrolled && scrolledState.wordmarkWidth >= 120);
    results.push({ page: pageName, state: "scrolled", status: scrolledOk ? "PASS" : "FAIL", detail: scrolledState });
    if (!scrolledOk) failures.push(results.at(-1));
    await page.screenshot({ path: path.join(artifactRoot, `${pageName.replace(/\.html$/, "")}-scrolled.png`), fullPage: false });
    await page.close();
  }
} finally {
  await context.close();
  await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}

fs.writeFileSync(path.join(artifactRoot, "results.json"), JSON.stringify({ baseUrl, results, failures }, null, 2));
console.log(JSON.stringify({ baseUrl, checks: results.length, failures: failures.length }, null, 2));
if (failures.length) process.exitCode = 1;
