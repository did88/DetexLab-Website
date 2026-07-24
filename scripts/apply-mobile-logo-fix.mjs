import fs from "node:fs";

const cssPath = "css/styles.css";
const css = fs.readFileSync(cssPath, "utf8");
const before = `  .detex-signal-system .brand-logo-header-on-dark {
    opacity: 0;
  }

  .detex-signal-system .brand-logo-header-on-light {
    opacity: 1;
  }`;
const after = `  .detex-signal-system .brand-logo-header-on-dark {
    display: none;
    opacity: 0;
  }

  .detex-signal-system .brand-logo-header-on-light {
    display: block;
    opacity: 1;
  }`;
if (!css.includes(before)) throw new Error("Expected mobile logo visibility block was not found in css/styles.css");
fs.writeFileSync(cssPath, css.replace(before, after));

const liveWorkflowPath = ".github/workflows/live-deployment-qa.yml";
let workflow = fs.readFileSync(liveWorkflowPath, "utf8");
if (!workflow.includes("Verify mobile logo visibility")) {
  const marker = `      - name: Upload live QA results`;
  const step = `      - name: Verify mobile logo visibility
        env:
          DETEX_BASE_URL: https://detexlab.com
        run: node scripts/qa-mobile-logo.mjs

`;
  if (!workflow.includes(marker)) throw new Error("Live QA upload step marker was not found");
  workflow = workflow.replace(marker, step + marker);
  fs.writeFileSync(liveWorkflowPath, workflow);
}

console.log("Applied mobile top-of-page logo visibility fix and live regression step.");
